/*  src/lib/llm.compiler.ts
 *  -----------------------------------------------------------
 *  Convert chart / student notes + layout → CDL via Google Gemini
 *  -----------------------------------------------------------
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CDL, Desk } from "./cdl-schema";
import { parseCDL } from "./cdl.validate";

/* ------------------------------------------------------------------ */
/*  Options                                                           */
/* ------------------------------------------------------------------ */

export interface CompileOpts {
  model?: string;          // Gemini model ID
  temperature?: number;    // default 0.1
  retries?: number;        // JSON-repair attempts
  signal?: AbortSignal;    // optional abort
}

/* ------------------------------------------------------------------ */
/*  Main entry                                                        */
/* ------------------------------------------------------------------ */

export async function compileNotesToCDL(
  chartNote: string,
  studentNotes: Record<string, string>,
  studentTags: Record<string, string[]>,
  layout: Desk[],
  allTags: string[],
  opts: CompileOpts = {},
): Promise<CDL> {
  const {
    model        = "gemini-2.5-flash-preview-04-17",
    temperature  = 0.1,
    retries      = 2,
    signal,
  } = opts;

  /* ---------- static prompt blocks ---------- */

  const SYSTEM_PROMPT = `
You are a strict compiler. Convert teacher instructions **and** the classroom
layout into CDL JSON (Constraint-Description Language).
Return ONLY valid JSON — no markdown fences, no prose.`.trim();

const SCHEMA_HINT = `
CDL keys you may emit
  desks · seats · balanceRules · groups · preferences · ordering

❌  Do NOT copy the classroom layout into “desks” / “seats”.
    Emit those keys ONLY to pin a student with
      { deskId, forcedStudent }   or   { seatId, forcedStudent }.

preferences  (soft seat-affinity rewards)
  {
    student?:  "Exact Name" | "Any",
    tags?:     ["TagA","TagB"],

    seatIds?:  ["desk-1/seat-0", …],
    deskIds?:  ["desk-5", …],

    weight:    1..∞       // positive reward
  }

  • You MUST include seatIds OR deskIds (or both). No selector field.
  • Allowed keys are exactly: student, tags, seatIds, deskIds, weight.
    Anything else (relation, selector, etc.) is forbidden.

groups item
  { tags?[], students?[], relation:"together"|"apart",
    minDistance?, clusterSize? }

ordering & balanceRules unchanged.  Use id strings exactly as in layout JSON.`.trim();




const FEW_SHOT = `
User:
"Seat Ava ONLY at desk-0/seat-0 or desk-0/seat-1."
Assistant:
{
  "preferences":[
    { "student":"Ava Kim",
      "seatIds":["desk-0/seat-0","desk-0/seat-1"],
      "weight":5 }
  ]
}

User:
"Any student tagged Needs Assistance should sit at desk-5."
Assistant:
{
  "preferences":[
    { "tags":["Needs Assistance"], "deskIds":["desk-5"], "weight":3 }
  ]
}

User:
"Charlie prefers the big rectangle desk (desk-2)."
Assistant:
{
  "preferences":[
    { "student":"Charlie Lee", "deskIds":["desk-2"], "weight":2 }
  ]
}`.trim();


  /* ---------- user-specific block ---------- */
  const USER_PROMPT = buildUserPrompt(
    chartNote,
    studentNotes,
    studentTags,
    layout,
    allTags,
  );

  /* ---------- Gemini client ---------- */
  const apiKey =
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GEMINI_API_KEY)
   || (typeof import.meta !== "undefined" && (import.meta as any).env?.REACT_APP_GEMINI_API_KEY)
   || (typeof window !== "undefined"   && (window as any).GEMINI_API_KEY)
   ||  process.env?.GEMINI_API_KEY;

  if (!apiKey) throw new Error("Gemini API key not found");

  const genAI = new GoogleGenerativeAI(apiKey);
  const llm   = genAI.getGenerativeModel({ model });

  let prompt   = [SYSTEM_PROMPT, SCHEMA_HINT, FEW_SHOT, USER_PROMPT].join("\n\n");
  let lastErr = "";
let lastRaw = "";

for (let attempt = 0; attempt <= retries; attempt++) {
  const res = await llm.generateContent(
    {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature },
    },
    { signal }
  );

  const raw = res.response.text().trim();
  lastRaw = raw;

  try {
    const json = JSON.parse(stripFences(raw));
    return parseCDL(json);
  } catch (err) {
    lastErr = (err as Error).message;
    prompt +=
      "\n\nAssistant:\n" + raw +
      "\n\nUser:\nJSON invalid (" + lastErr + "). Respond again with corrected JSON only.";
  }
}

throw new Error(
  "compileNotesToCDL failed:\n" +
  lastErr +
  "\n\nLast JSON candidate :\n" +
  lastRaw
);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function stripFences(txt: string) {
  if (txt.startsWith("```")) {
    return txt.replace(/^```[a-z]*\s*/i, "").replace(/```$/, "").trim();
  }
  return txt;
}

function buildUserPrompt(
  chartNote: string,
  studentNotes: Record<string, string>,
  studentTags: Record<string, string[]>,
  layout: Desk[],
  tagList: string[],
): string {
  const notesBlock = Object.entries(studentNotes)
    .map(([n, t]) => `${n}: ${t}`)
    .join("\n") || "(none)";

  const tagBlock = Object.entries(studentTags)
    .map(([n, arr]) => `${n}: ${(arr ?? []).join(", ")}`)
    .join("\n") || "(none)";

  const layoutBlock = JSON.stringify(layout, null, 2);

  return `
STUDENT NOTES
-------------
${notesBlock}

STUDENT TAGS
------------
${tagBlock}

CLASSROOM LAYOUT
----------------
• desk.position   is the top-left anchor of the desk.
• seat.x / seat.y are ABSOLUTE canvas coords (desk.position + offset).
• x grows to the RIGHT, y grows to the BACK:
    y = 0   → front row
    x = 0   → far left wall

${layoutBlock}

CHART NOTE
----------
${chartNote || "(none)"}

TAG WHITELIST
-------------
${JSON.stringify(tagList)}
`.trim();
}

export { buildUserPrompt };
