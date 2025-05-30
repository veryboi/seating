/*  src/lib/cdl.validate.ts
 *  -----------------------------------------------------------
 *  Runtime validator for the CDL schema (draft-07 via AJV v8)
 *  -----------------------------------------------------------
 */

import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { CDL, CDL_JSON_SCHEMA } from "./cdl-schema";

/* ---------- AJV singleton ---------- */
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(CDL_JSON_SCHEMA);

/* ---------- helper ---------- */
function formatErrors(errs: ErrorObject[] | null | undefined): string {
  if (!errs) return "(no details)";
  return errs
    .map((e) => {
      const path = e.instancePath || "(root)";
      return `${path} → ${e.message}`;
    })
    .join("\n");
}

/* ---------- public API ---------- */

/** Validate unknown JSON and return it as typed CDL (throws if invalid). */
export function parseCDL(json: unknown): CDL {
  if (!validate(json)) {
    throw new Error("Invalid CDL:\n" + formatErrors(validate.errors));
  }
  return json as CDL;
}

/** Type-guard variant that just returns boolean. */
export function isCDL(json: unknown): json is CDL {
  return !!validate(json);
}
