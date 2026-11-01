import { test } from "node:test"
import assert from "node:assert/strict"
import { applyPin } from "../src/pin.ts"

const result = {
  collections: [
    { prefix: "at", name: "atlas", path: "/r/docs", folders: {}, ignore: [] },
    { prefix: "pl", name: "pipeline", path: "/r/ing", folders: {}, ignore: [] },
  ],
  initiatives: [
    {
      ref: "at#1",
      number: 1,
      title: "a",
      status: "draft",
      tier: "draft" as const,
      path: "/r/docs/1-a.md",
    },
    {
      ref: "pl#2",
      number: 2,
      title: "b",
      status: "draft",
      tier: "draft" as const,
      path: "/r/ing/2-b.md",
    },
  ],
  unreadable: 0,
}

test("returns everything when nothing is pinned", () => {
  assert.equal(applyPin(result, null).initiatives.length, 2)
})

test("narrows to the pinned collection", () => {
  const pinned = applyPin(result, "/r/ing")
  assert.deepEqual(
    pinned.initiatives.map((i) => i.ref),
    ["pl#2"],
  )
  assert.equal(pinned.collections.length, 1)
})

test("falls back to everything when the pinned path no longer exists", () => {
  assert.equal(applyPin(result, "/r/gone").initiatives.length, 2)
})
