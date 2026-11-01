import { test } from "node:test"
import assert from "node:assert/strict"
import { glyphFor, rowsFor, typeMarkFor } from "../src/row.ts"
import type { Initiative } from "../src/scan.ts"

const make = (over: Partial<Initiative>): Initiative => ({
  ref: "x#1",
  number: 1,
  title: "t",
  status: "draft",
  tier: "draft",
  path: "/x",
  ...over,
})

test("uses a distinct glyph per status", () => {
  assert.equal(glyphFor("active", "in-progress"), "▶")
  assert.equal(glyphFor("active", "designed"), "◆")
  assert.equal(glyphFor("draft", "draft"), "○")
})

// The spec keeps an unrecognised status visible "so a typo surfaces instead of
// disappearing" — rendering it identically to a draft does not surface it.
test("marks an unrecognised status distinctly from a draft", () => {
  assert.equal(glyphFor("draft", "wat"), "?")
  assert.notEqual(glyphFor("draft", "wat"), glyphFor("draft", "draft"))
})

test("letters the exceptional types and leaves feature unmarked", () => {
  assert.equal(typeMarkFor("bug"), "b")
  assert.equal(typeMarkFor("spike"), "s")
  assert.equal(typeMarkFor("chore"), "c")
  assert.equal(typeMarkFor("infra"), "i")
  assert.equal(typeMarkFor("feature"), " ")
  assert.equal(typeMarkFor(undefined), " ")
})

test("is case insensitive and falls back to the first letter of any other type", () => {
  assert.equal(typeMarkFor("BUG"), "b")
  assert.equal(typeMarkFor("experiment"), "e")
  assert.equal(typeMarkFor(""), " ")
})

test("collapsed shows only active rows", () => {
  const items = [make({ tier: "active", status: "in-progress" }), make({ tier: "draft" })]
  const rows = rowsFor(items, { order: "status-recency", exclude: [], maxRows: 8 }, false)
  assert.equal(rows.length, 1)
})

test("expanded adds drafts but never settled", () => {
  const items = [
    make({ ref: "a#1", tier: "active", status: "in-progress" }),
    make({ ref: "a#2", tier: "draft" }),
    make({ ref: "a#3", tier: "settled", status: "done" }),
  ]
  const rows = rowsFor(items, { order: "status-recency", exclude: [], maxRows: 8 }, true)
  assert.deepEqual(
    rows.map((r) => r.ref),
    ["a#1", "a#2"],
  )
})

test("collapsed respects maxRows", () => {
  const items = Array.from({ length: 12 }, (_, n) =>
    make({ ref: `a#${n}`, tier: "active", status: "in-progress" }),
  )
  assert.equal(
    rowsFor(items, { order: "status-recency", exclude: [], maxRows: 3 }, false).length,
    3,
  )
})
