import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveOptions } from "../src/options.ts"

test("applies documented defaults", () => {
  assert.deepEqual(resolveOptions(undefined), {
    order: "status-recency",
    exclude: ["**/test-corpus/**"],
    maxRows: 8,
  })
})

test("accepts valid overrides", () => {
  const o = resolveOptions({ order: "recency", exclude: ["**/tmp/**"], maxRows: 3 })
  assert.equal(o.order, "recency")
  assert.deepEqual(o.exclude, ["**/tmp/**"])
  assert.equal(o.maxRows, 3)
})

test("falls back to the default for an unknown order", () => {
  assert.equal(resolveOptions({ order: "nonsense" }).order, "status-recency")
})

test("rejects a non-positive maxRows", () => {
  assert.equal(resolveOptions({ maxRows: 0 }).maxRows, 8)
  assert.equal(resolveOptions({ maxRows: -2 }).maxRows, 8)
})
