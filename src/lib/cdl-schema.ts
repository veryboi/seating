//  src/lib/cdl-schema.ts
//  -----------------------------------------------------------
//  Constraint-Description Language (CDL)  –  single source of truth
//  -----------------------------------------------------------

/* ------------------------------------------------------------------ */
/*  1 ▸  Layout primitives (used by the UI, not by CDL validation)    */
/* ------------------------------------------------------------------ */

/** Absolute seat coordinates after offset has been applied. */
export interface Seat {
    id: string;          // "desk-2/seat-1"
    x: number;           // canvas-space X
    y: number;           // canvas-space Y
  }
  
  /** Desk definition coming from chart JSON. */
  export interface Desk {
    id: string;                          // "desk-2"
    position: [number, number];          // top-left corner
    seats: Seat[];                       // child seats (absolute coords)
    shape: {                             // visual shape used by editor
      type: "circle" | "rectangle" | "polygon";
      radius?: number;
      width?: number;
      height?: number;
      points?: [number, number][];
    };
  }
  
  /* ------------------------------------------------------------------ */
  /*  2 ▸  CDL TypeScript interfaces (for IntelliSense)                 */
  /* ------------------------------------------------------------------ */
  
  export type CDL = {
    /** Pin whole desks or individual seats to specific students */
    desks?: DeskBlock[];
    seats?: SeatBlock[];
  
    /** Generic tag-balancing / quota rules */
    balanceRules?: BalanceRule[];
  
    /** Together / apart constraints */
    groups?: GroupRule[];

    preferences?: PreferenceRule[];
  
    /** Room-wide settings that aren't expressible via balanceRules */
    global?: GlobalRules;
  
    /** How the queue is ordered before filling seats */
    ordering?: OrderingRule;
  };
  
  export type DeskBlock = { deskId: string; forcedStudent: string };
  export type SeatBlock = { seatId: string; forcedStudent: string };
  
  export type BalanceRule = {
    tags: string[];                        // counted if student has ≥1 tag
    scope: "desk" | "row" | "room";
    mode: "even" | "max" | "min";
    value?: number;                        // used by max / min
    tolerance?: number;                    // allowed imbalance for "even"
  };
  
  export type GroupRule = {
    tags?: string[];
    students?: string[];
    relation: "together" | "apart";
    minDistance?: number;                  // "apart" by ≥ N seats
    clusterSize?: number;                  // "together" in groups of N
  };
  
  export type GlobalRules = {
    maxSameTagPerRow?: number;
    optimizeFor?: "visibility" | "collaboration" | "random";
  };
  
  export type OrderingRule =
    | { type: "alphabetic"; by: "first" | "last"; direction?: "asc" | "desc" }
    | { type: "random" }
    | { type: "custom"; order: string[] };

export type PreferenceRule = {
    /** Apply to one student (exact match) or any student with these tags */
    student?: string;             // "Any" = wildcard
    tags?: string[];              // mutually exclusive with student (unless student === "Any")
    
    /** How to match seats */
    seatIds?: string[];           // explicit seat list
    deskIds?: string[];           // any seat belonging to these desks
    
    /** Whether this is a positive or negative preference */
    modifier?: "prefers" | "does not prefer";  // default: "prefers"
    
    /** Positive reward; optimiser subtracts this from cost when satisfied */
    weight: number;
    };
  
  /* ------------------------------------------------------------------ */
  /*  3 ▸  Runtime JSON-Schema (draft-07) for AJV validation            */
  /* ------------------------------------------------------------------ */
  
  export const CDL_JSON_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Classroom Constraint Description Language",
    type: "object",
    additionalProperties: false,
  
    properties: {
      desks: {
        type: "array",
        items: {
          type: "object",
          required: ["deskId", "forcedStudent"],
          additionalProperties: false,
          properties: {
            deskId: { type: "string" },
            forcedStudent: { type: "string" }
          }
        }
      },
  
      seats: {
        type: "array",
        items: {
          type: "object",
          required: ["seatId", "forcedStudent"],
          additionalProperties: false,
          properties: {
            seatId: { type: "string" },
            forcedStudent: { type: "string" }
          }
        }
      },
  
      balanceRules: {
        type: "array",
        items: {
          type: "object",
          required: ["tags", "scope", "mode"],
          additionalProperties: false,
          properties: {
            tags: { type: "array", items: { type: "string" }, minItems: 1 },
            scope: { enum: ["desk", "row", "room"] },
            mode: { enum: ["even", "max", "min"] },
            value: { type: "integer", minimum: 1 },
            tolerance: { type: "integer", minimum: 0 }
          }
        }
      },
  
      preferences: {
        type: "array",
        items: {
          type: "object",
          required: ["weight"],
          additionalProperties: false,
          properties: {
            student:  { type: "string" },
            tags:     { type: "array", items: { type: "string" }, minItems: 1 },
            seatIds:  { type: "array", items: { type: "string" }, minItems: 1 },
            deskIds:  { type: "array", items: { type: "string" }, minItems: 1 },
            modifier: { enum: ["prefers", "does not prefer"] },
            weight:   { type: "integer", minimum: 1 }
          },
  
          /* must specify at least seatIds or deskIds */
          anyOf: [
            { required: ["seatIds"] },
            { required: ["deskIds"] }
          ]
        }
      },
      
      groups: {
        type: "array",
        items: {
          type: "object",
          required: ["relation"],
          additionalProperties: false,
          properties: {
            tags: {
              type: "array",
              items: { type: "string" },
              minItems: 1
            },
            students: {
              type: "array",
              items: { type: "string" },
              minItems: 1
            },
            relation: { enum: ["together", "apart"] },
            minDistance: { type: "integer", minimum: 1 },
            clusterSize: { type: "integer", minimum: 2 }
          }
        }
      },
  
      global: {
        type: "object",
        additionalProperties: false,
        properties: {
          maxSameTagPerRow: { type: "integer", minimum: 1 },
          optimizeFor: { enum: ["visibility", "collaboration", "random"] }
        }
      },
  
      ordering: {
        oneOf: [
          {
            type: "object",
            required: ["type", "by"],
            additionalProperties: false,
            properties: {
              type: { const: "alphabetic" },
              by: { enum: ["first", "last"] },
              direction: { enum: ["asc", "desc"] }
            }
          },
          {
            type: "object",
            required: ["type"],
            additionalProperties: false,
            properties: { type: { const: "random" } }
          },
          {
            type: "object",
            required: ["type", "order"],
            additionalProperties: false,
            properties: {
              type: { const: "custom" },
              order: { type: "array", items: { type: "string" }, minItems: 1 }
            }
          }
        ]
      }
    }
  } as const;
  