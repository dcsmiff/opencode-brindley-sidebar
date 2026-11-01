import { test } from "node:test"
import assert from "node:assert/strict"
import { goalOf, openQuestionCount } from "../src/detail-data.ts"

const body = [
  "# Title",
  "",
  "## Goal",
  "",
  "The first paragraph of the goal.",
  "It continues on a second line.",
  "",
  "A second paragraph that should not appear.",
  "",
  "## Open questions",
  "",
  "- Does A hold, or B?",
  "- What about C?",
  "",
  "## Dependencies",
  "",
  "- [something](./1-x.md)",
  "",
].join("\n")

test("takes the first paragraph of the Goal section", () => {
  assert.equal(goalOf(body), "The first paragraph of the goal.\nIt continues on a second line.")
})

test("returns an empty string when there is no Goal section", () => {
  assert.equal(goalOf("# Title\n\n## Design\n\nStuff.\n"), "")
})

test("counts bullets under Open questions only", () => {
  assert.equal(openQuestionCount(body), 2)
})

test("treats _None._ as zero open questions", () => {
  assert.equal(openQuestionCount("## Open questions\n\n_None._\n\n## Design\n\n- a bullet\n"), 0)
})

test("returns zero when there is no Open questions section", () => {
  assert.equal(openQuestionCount("# Title\n\n- a bullet\n"), 0)
})
