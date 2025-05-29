//  src/lib/seat-optimizer.ts
//  -----------------------------------------------------------
//  Heuristic seating-chart optimiser for CDL constraints
//  -----------------------------------------------------------

import seedrandom from "seedrandom";
import { CDL, BalanceRule, GroupRule, Seat, Desk } from "./cdl-schema";

/* ---------- Public layout & map types (align with UI) ---------- */
export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  tags: string[];
  gender?: "M" | "F";
};

export type SeatMap = Record<string, string | null>;

/* ---------- Tunable cost weights ---------- */
export interface CostWeights {
  balanceEven: number;
  balanceMax: number;
  balanceMin: number;
  together: number;
  apart: number;
}
const DEFAULT_WEIGHTS: CostWeights = {
  balanceEven: 3,
  balanceMax: 3,
  balanceMin: 3,
  together: 10,
  apart: 10,
};

/* ---------- Optimiser options ---------- */
export interface OptimizerOptions {
  iterations?: number;
  randomSeed?: number;
  weights?: Partial<CostWeights>;
}

/* more stuff*/
let seatCoords: Record<string, [number, number]> = {};
let deskLookup: Record<string, string> = {};

/* ---------- Public API ---------- */
export function generateChart(
  students: Student[],
  desks: Desk[],
  cdl: CDL,
  opts: OptimizerOptions = {}
): SeatMap {
  /* --- deterministic rng for reproducibility --- */
  const rng = seedrandom(
    (opts.randomSeed ?? Date.now()).toString()
  );

  /* --- 0. normalise layout (ensure ids) --- */
  const layout = normaliseLayout(desks);

  /* --- 1. queue ordering --- */
  const queue = seedQueue(students, cdl.ordering, rng);

  /* --- 2. blank seat map --- */
  const seatMap: SeatMap = Object.fromEntries(
    layout.flatMap((d) => d.seats.map((s) => [s.id, null]))
  );

  /* --- 3. apply forced seats / desks --- */
  applyForced(seatMap, queue, cdl.desks ?? [], cdl.seats ?? [], layout);

  /* --- 4. greedy fill for remaining --- */
  fillRemaining(seatMap, queue, rng);

  /* --- 5. hill-climb refinement --- */
  hillClimb(
    seatMap,
    layout,
    cdl,
    opts.iterations ?? 50_000,
    rng,
    { ...DEFAULT_WEIGHTS, ...opts.weights }
  );

  /* --- 6. optional post-process tweaks (future) --- */
  // seatMap = postProcess(seatMap, layout, cdl);

  return seatMap;
}

/* =============================================================== */
/*  Concrete helper implementations                                */
/* =============================================================== */

/* ---------- 0. normaliseLayout ---------- */
function normaliseLayout(desks: Desk[]): Desk[] {
    /* build new array with IDs and absolute coordinates */
    const out = desks.map((d, di) => {
      const deskId     = d.id ?? `desk-${di}`;
      const [dx, dy]   = d.position as [number, number];
  
      /* seat arrays [offsetX, offsetY] -> object {id, x, y} */
      const seats = d.seats.map((s: any, si: number) => {
        const [ox, oy] = Array.isArray(s) ? s : [s.x, s.y];
        return {
          id: s.id ?? `${deskId}/seat-${si}`,
          x: dx + ox,
          y: dy + oy,
        };
      });
  
      return { ...d, id: deskId, seats };
    });
  
    /* flat lookup for seatDistance / ordering */
    seatCoords = Object.fromEntries(
      out.flatMap((d) => d.seats.map((s) => [s.id, [s.y, s.x]]))
    );
  
    /* helper for same-desk check */
    deskLookup = Object.fromEntries(
      out.flatMap((d) => d.seats.map((s) => [s.id, d.id]))
    );
  
    return out;
  }
  
  /* ---------- 1. ordered queue ---------- */
  function seedQueue(
    students: Student[],
    ordering: CDL["ordering"],
    rng: seedrandom.PRNG
  ): Student[] {
    if (!ordering || ordering.type === "random") return shuffle([...students], rng);
  
    if (ordering.type === "custom") {
      const byId = Object.fromEntries(students.map((s) => [s.id, s]));
      return ordering.order.map((id) => byId[id]).filter(Boolean);
    }
  
    const key = ordering.by === "first" ? "firstName" : "lastName";
    const dir = ordering.direction === "desc" ? -1 : 1;
    return [...students].sort((a, b) =>
      dir * a[key].localeCompare(b[key])
    );
  }
  
  /* ---------- 2. apply forced blocks ---------- */
  function applyForced(
    map: SeatMap,
    queue: Student[],
    deskBlocks: NonNullable<CDL["desks"]>,
    seatBlocks: NonNullable<CDL["seats"]>,
    desks: Desk[]
  ) {
    /* desks */
    deskBlocks.forEach(({ deskId, forcedStudent }) => {
      const desk = desks.find((d) => d.id === deskId);
      if (!desk) return;
      const seats = desk.seats.map((s) => s.id);
      const idx = queue.findIndex((s) => s.id === forcedStudent);
      if (idx === -1) return;
      const studentId = queue.splice(idx, 1)[0].id;
      /* first empty seat in that desk */
      const target = seats.find((sid) => !map[sid]);
      if (target) map[target] = studentId;
    });
  
    /* exact seats */
    seatBlocks.forEach(({ seatId, forcedStudent }) => {
      const idx = queue.findIndex((s) => s.id === forcedStudent);
      if (idx === -1 || !map.hasOwnProperty(seatId)) return;
      map[seatId] = queue.splice(idx, 1)[0].id;
    });
  }
  
  /* ---------- 3. greedy fill ---------- */
  function fillRemaining(
    map: SeatMap,
    queue: Student[],
    _rng: seedrandom.PRNG
  ) {
    /* visual reading order: top-to-bottom, then left-to-right */
    const emptySeats = Object.keys(map)
      .filter((k) => !map[k])
      .sort((a, b) => {
        const [ay, ax] = seatCoords[a];
        const [by, bx] = seatCoords[b];
        return ay === by ? ax - bx : ay - by;
      });
  
    emptySeats.forEach((sid) => {
      map[sid] = queue.shift()?.id ?? null;
    });
  }
  
  /* flat lookup built once */

  
  /* ---------- 4. hill-climb ---------- */
  function hillClimb(
    map: SeatMap,
    desks: Desk[],
    cdl: CDL,
    iterations: number,
    rng: seedrandom.PRNG,
    weights: CostWeights
  ) {
    let bestScore = cost(map, desks, cdl, weights);
  
    for (let i = 0; i < iterations; i++) {
      const [a, b] = randomSwap(map, rng);
      const newScore = cost(map, desks, cdl, weights);
  
      if (newScore < bestScore) {
        bestScore = newScore; // keep swap
      } else {
        // revert
        [map[a], map[b]] = [map[b], map[a]];
      }
    }
  }
  
  /* ---------- Cost engine ---------- */
  function cost(
    map: SeatMap,
    desks: Desk[],
    cdl: CDL,
    w: CostWeights
  ): number {
    let score = 0;
  
    /* balance rules */
    for (const br of cdl.balanceRules ?? []) {
      const scopes =
        br.scope === "desk"
          ? desks.map((d) => d.seats.map((s) => s.id))
          : br.scope === "row"
          ? computeRows(desks)
          : [Object.keys(map)];
  
      scopes.forEach((seatIds) => {
        const cnt = seatIds.reduce((n, sid) => {
          const stuId = map[sid];
          if (!stuId) return n;
          const tags = studentTagsOf(stuId);
          return tags.some((t) => br.tags.includes(t)) ? n + 1 : n;
        }, 0);
  
        if (br.mode === "even") {
          const ideal = seatIds.length / br.tags.length;
          const tol = br.tolerance ?? 0;
          score += Math.max(0, Math.abs(cnt - ideal) - tol) * w.balanceEven;
        } else if (br.mode === "max" && cnt > (br.value ?? 0)) {
          score += (cnt - br.value!) * w.balanceMax;
        } else if (br.mode === "min" && cnt < (br.value ?? 0)) {
          score += (br.value! - cnt) * w.balanceMin;
        }
      });
    }
  
    /* group rules */
    for (const gr of cdl.groups ?? []) {
      const members = new Set<string>([
        ...(gr.students ?? []),
        ...Object.entries(map)
          .filter(
            ([, stuId]) =>
              stuId &&
              studentTagsOf(stuId).some((t) => (gr.tags ?? []).includes(t))
          )
          .map(([, id]) => id as string),
      ]);
  
      const ids = [...members];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const seatA = seatOf(ids[i]);
          const seatB = seatOf(ids[j]);
          if (!seatA || !seatB) continue;
          const d = seatDistance(seatA, seatB, desks);
  
          if (gr.relation === "together") {
            const wantSameDesk = gr.clusterSize == null;
            const needDist     = gr.clusterSize ?? 1;
          
            if (wantSameDesk) {
              /* penalise if any pair is in different desks */
              if (!sameDesk(seatA, seatB)) score += w.together;
            } else {
              if (d > needDist) score += w.together;
            }
          } else if (d <= (gr.minDistance ?? 1)) {
            score += w.apart;
          }
        }
      }
    }
  
    return score;
  
    /* helper closures using existing map */
    function seatOf(stuId: string): string | null {
      return Object.keys(map).find((sid) => map[sid] === stuId) ?? null;
    }
    function studentTagsOf(stuId: string): string[] {
      return studentCache[stuId]?.tags ?? [];
    }
  }
  
  /* ---------- utilities ---------- */
  
  function shuffle<T>(arr: T[], rng: seedrandom.PRNG): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
  function randomSwap(
    map: SeatMap,
    rng: seedrandom.PRNG
  ): [string, string] {
    const seats = Object.keys(map);
    let a = seats[Math.floor(rng() * seats.length)];
    let b = seats[Math.floor(rng() * seats.length)];
    while (a === b) b = seats[Math.floor(rng() * seats.length)];
    [map[a], map[b]] = [map[b], map[a]];
    return [a, b];
  }
  
  function seatDistance(aId: string, bId: string, desks: Desk[]): number {
    const seatPos: Record<string, [number, number]> = {};
    desks.forEach((d) =>
      d.seats.forEach((s) => (seatPos[s.id] = [s.x, s.y]))
    );
    const [ax, ay] = seatPos[aId];
    const [bx, by] = seatPos[bId];
    return Math.hypot(ax - bx, ay - by);
  }

  function sameDesk(aId: string, bId: string): boolean {
    return deskLookup[aId] === deskLookup[bId];
  }
  
  function computeRows(desks: Desk[]): string[][] {
    const allSeats = desks.flatMap((d) => d.seats);
    // group by y coordinate (simple grid assumption)
    const rows: Record<number, string[]> = {};
    allSeats.forEach((s) => {
      const y = Math.round(s.y / 50); // 50px tolerance bucket
      rows[y] = rows[y] || [];
      rows[y].push(s.id);
    });
    return Object.values(rows);
  }
  
  /* ---------- student cache (cheap global) ---------- */
  const studentCache: Record<string, Student> = {};
  export function primeStudentCache(students: Student[]) {
    students.forEach((s) => (studentCache[s.id] = s));
  }
  