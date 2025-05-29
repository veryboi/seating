/*  src/lib/llm.compiler.ts
 *  -----------------------------------------------------------
 *  Convert chart / student notes → CDL via Google Gemini
 *  -----------------------------------------------------------
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CDL } from "./cdl-schema";
import { parseCDL } from "./cdl.validate";

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export interface CompileOpts {
  model?: string;          // Gemini model (default "gemini-pro")
  temperature?: number;    // default 0.1
  retries?: number;        // JSON-repair attempts (default 2)
  signal?: AbortSignal;    // optional abort
}

/**
 * Compile free-form teacher notes into a validated CDL object.
 *
 * @param chartNote     – overall instruction field
 * @param studentNotes  – per-student text notes (name → note)
 * @param studentTags   – per-student tag array (name → tags[])
 * @param allTags       – global list of valid tags
 */
export async function compileNotesToCDL(
  chartNote: string,
  studentNotes: Record<string, string>,
  studentTags: Record<string, string[]>,
  allTags: string[],
  opts: CompileOpts = {}
): Promise<CDL> {
  const {
    model = "gemini-2.0-flash-lite",
    temperature = 0.1,
    retries = 2,
    signal,
  } = opts;

  /* ——— Prompt blocks ——— */
  const SYSTEM_PROMPT = `
You are a compiler that converts teacher instructions into a JSON
object that follows the CDL schema (Constraint-Description Language).
Return ONLY valid JSON — no code fences, no commentary.`.trim();

  const SCHEMA_HINT = `
Allowed top-level keys: desks, seats, balanceRules, groups, ordering

balanceRules item
  {tags[], scope("desk"|"row"|"room"), mode("even"|"max"|"min"), value?, tolerance?}

ordering
  {type:"alphabetic", by:"first"|"last", direction?:"asc"|"desc"}
  {type:"random"}
  {type:"custom", order:[studentIds…]}

group rule
  {tags?[], students?[], relation:"together"|"apart", minDistance?, clusterSize?}

No other keys are permitted.`.trim();

  const FEW_SHOT = `
User:
Balance boys and girls per desk (±1), separate any "Disruptive".
Assistant:
{
  "balanceRules":[
    {"tags":["Male","Female"],"scope":"desk","mode":"even","tolerance":1}
  ],
  "groups":[
    {"tags":["Disruptive"],"relation":"apart"}
  ]
}

User:
Reverse alphabetic by last name; max 1 Talkative per row.
Assistant:
{
  "ordering":{"type":"alphabetic","by":"last","direction":"desc"},
  "balanceRules":[
    {"tags":["Talkative"],"scope":"row","mode":"max","value":1}
  ]
}
`.trim();

  const USER_PROMPT = buildUserPrompt(
    chartNote,
    studentNotes,
    studentTags,
    allTags
  );

  /* ——— Init Gemini client ——— */
  const apiKey =
    // vite / react-scripts
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.REACT_APP_GEMINI_API_KEY) ||
    // manual global
    (typeof window !== "undefined" && (window as any).GEMINI_API_KEY) ||
    // Node fallback (tests)
    process.env?.GEMINI_API_KEY;

  if (!apiKey) throw new Error("Gemini API key not found");

  const genAI = new GoogleGenerativeAI(apiKey);
  const llm   = genAI.getGenerativeModel({ model });

  /* ——— Assemble the full prompt ——— */
  let basePrompt = [SYSTEM_PROMPT, SCHEMA_HINT, FEW_SHOT, USER_PROMPT].join(
    "\n\n"
  );

  let attempt   = 0;
  let lastError = "";

  while (attempt <= retries) {
    attempt++;

    const result = await llm.generateContent(
      {
        contents: [{ role: "user", parts: [{ text: basePrompt }] }],
        generationConfig: { temperature },
      },
      { signal }
    );

    const raw = result.response.text().trim();

    try {
        /* ── strip ``` fences if the model included them ── */
        let jsonText = raw.trim();
        if (jsonText.startsWith("```")) {
          jsonText = jsonText
            .replace(/^```[a-z]*\s*/i, "")   // opening fence + optional language tag
            .replace(/```$/, "")             // closing fence
            .trim();
        }
      
        const json = JSON.parse(jsonText);
        return parseCDL(json);               // throws if schema invalid
      } catch (err) {
        lastError = (err as Error).message;
      
        /* append feedback + invalid JSON so Gemini can self-correct */
        const feedback = `
      The JSON you produced was invalid or didn't match the schema:
      ${lastError}
      
      Respond again with ONLY corrected JSON.`;
      
        basePrompt += "\n\nAssistant:\n" + raw + "\n\nUser:\n" + feedback;  // <— fixed concat
      }
  }

  throw new Error("compileNotesToCDL failed: " + lastError);
}

/* ------------------------------------------------------------------ */
/*  Helper – build the user-level prompt                              */
/* ------------------------------------------------------------------ */

function buildUserPrompt(
  chartNote: string,
  studentNotes: Record<string, string>,
  studentTags: Record<string, string[]>,
  tags: string[]
): string {
  /* notes block */
  const notesBlock =
    Object.keys(studentNotes).length === 0
      ? "(none)"
      : Object.entries(studentNotes)
          .map(([name, note]) => `${name}: ${note}`)
          .join("\n");

  /* tags block */
  const tagBlock =
  Object.keys(studentTags).length === 0
    ? "(none)"
    : Object.entries(studentTags)
        .map(([name, tgs]) => {
          /* ensure we have an array of strings */
          const arr = Array.isArray(tgs)
            ? tgs
            : tgs == null
            ? []
            : [String(tgs)];
          return `${name}: ${arr.join(", ")}`;
        })
        .join("\n");

  return `
STUDENT NOTES
-------------
${notesBlock}

STUDENT TAGS
------------
${tagBlock}

CHART NOTE
----------
${chartNote || "(none)"}

TAG LIST (only these may be referenced)
--------------------------------------
${JSON.stringify(tags)}
`.trim();
}

export { buildUserPrompt };
