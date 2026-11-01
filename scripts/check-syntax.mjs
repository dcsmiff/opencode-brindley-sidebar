// The Solid/OpenTUI components cannot be unit-tested here: OpenCode supplies
// both frameworks at runtime and they are deliberately not installed. This at
// least proves every .tsx parses as JSX + TypeScript before it ships.
import { parse } from "@babel/parser"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"

const dir = "src"
const files = readdirSync(dir).filter((f) => f.endsWith(".tsx"))
let failed = false

for (const file of files) {
  const full = path.join(dir, file)
  try {
    parse(readFileSync(full, "utf8"), { sourceType: "module", plugins: ["jsx", "typescript"] })
    console.log(`ok   ${full}`)
  } catch (error) {
    console.error(`FAIL ${full}: ${error.message}`)
    failed = true
  }
}

if (files.length === 0) {
  console.error("no .tsx files found - check moved?")
  failed = true
}
process.exit(failed ? 1 : 0)
