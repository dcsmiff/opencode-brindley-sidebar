import { test } from "node:test"
import assert from "node:assert/strict"
import { tierFor } from "../src/status.ts"

test("classifies active statuses", () => {
  assert.equal(tierFor("in-progress"), "active")
  assert.equal(tierFor("designed"), "active")
})

test("classifies settled statuses", () => {
  for (const s of ["done", "deferred", "abandoned", "superseded"]) {
    assert.equal(tierFor(s), "settled")
  }
})

test("maps common aliases", () => {
  assert.equal(tierFor("completed"), "settled")
  assert.equal(tierFor("proposed"), "draft")
  assert.equal(tierFor("future"), "settled")
})

test("classifies an unrecognised status as draft, never settled", () => {
  assert.equal(tierFor("whatever"), "draft")
  assert.equal(tierFor(""), "draft")
})
