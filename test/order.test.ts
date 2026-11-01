import { test } from "node:test"
import assert from "node:assert/strict"
import { orderInitiatives, summarise } from "../src/order.ts"
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

test("status-recency puts active above draft, newest first within a tier", () => {
  const items = [
    make({ ref: "a#1", tier: "draft", updated: "2026-10-20" }),
    make({ ref: "a#2", tier: "active", updated: "2026-01-01" }),
    make({ ref: "a#3", tier: "active", updated: "2026-10-01" }),
  ]
  assert.deepEqual(
    orderInitiatives(items, "status-recency").map((i) => i.ref),
    ["a#3", "a#2", "a#1"],
  )
})

test("status-priority orders by priority inside a tier", () => {
  const items = [
    make({ ref: "a#1", tier: "active", priority: "low" }),
    make({ ref: "a#2", tier: "active", priority: "critical" }),
    make({ ref: "a#3", tier: "active" }),
  ]
  assert.deepEqual(
    orderInitiatives(items, "status-priority").map((i) => i.ref),
    ["a#2", "a#1", "a#3"],
  )
})

test("recency ignores tier entirely", () => {
  const items = [
    make({ ref: "a#1", tier: "active", updated: "2026-01-01" }),
    make({ ref: "a#2", tier: "draft", updated: "2026-10-01" }),
  ]
  assert.deepEqual(
    orderInitiatives(items, "recency").map((i) => i.ref),
    ["a#2", "a#1"],
  )
})

test("priority ranks across tiers", () => {
  const items = [
    make({ ref: "a#1", tier: "active", priority: "low" }),
    make({ ref: "a#2", tier: "draft", priority: "critical" }),
  ]
  assert.deepEqual(
    orderInitiatives(items, "priority").map((i) => i.ref),
    ["a#2", "a#1"],
  )
})

// Review Focus 5
test("sorts missing or unparseable updated dates last without throwing", () => {
  const items = [
    make({ ref: "a#1", tier: "draft" }),
    make({ ref: "a#2", tier: "draft", updated: "not-a-date" }),
    make({ ref: "a#3", tier: "draft", updated: "2026-10-01" }),
  ]
  assert.deepEqual(
    orderInitiatives(items, "recency").map((i) => i.ref),
    ["a#3", "a#1", "a#2"],
  )
})

test("summarise splits settled into deferred and done", () => {
  const items = [
    make({ tier: "active" }),
    make({ tier: "draft" }),
    make({ tier: "settled", status: "deferred" }),
    make({ tier: "settled", status: "done" }),
    make({ tier: "settled", status: "superseded" }),
  ]
  assert.deepEqual(summarise(items), { active: 1, draft: 1, deferred: 1, done: 2 })
})
