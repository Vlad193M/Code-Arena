import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { openApiDocument } from "../lib/openapi";

const doc = JSON.stringify(openApiDocument, null, 2);
const outPath = join(import.meta.dirname, "..", "..", "openapi.json");

writeFileSync(outPath, `${doc}\n`);
