import { test } from "node:test"
import assert from "node:assert/strict"
import { parseFrontMatter } from "../src/frontmatter.ts"

test("parses a front-matter block and returns the body", () => {
  const result = parseFrontMatter("---\nstatus: draft\n---\n# Title\n\nBody.\n")
  assert.deepEqual(result?.data, { status: "draft" })
  assert.equal(result?.body.trim(), "# Title\n\nBody.")
})

test("parses nested YAML structures", () => {
  const result = parseFrontMatter("---\naliases:\n  - at\nfolders:\n  done: completed\n---\n")
  assert.deepEqual(result?.data.aliases, ["at"])
  assert.deepEqual(result?.data.folders, { done: "completed" })
})

test("returns null when there is no front-matter", () => {
  assert.equal(parseFrontMatter("# Just a heading\n"), null)
})

test("returns null when the block is never closed", () => {
  assert.equal(parseFrontMatter("---\nstatus: draft\n"), null)
})

test("returns empty data for an empty block", () => {
  assert.deepEqual(parseFrontMatter("---\n---\nbody")?.data, {})
})
