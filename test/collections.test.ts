import { test } from "node:test"
import assert from "node:assert/strict"
import { findCollections } from "../src/collections.ts"

const opts = { exclude: ["**/test-corpus/**"] }

test("finds collections marked brindley: 1", async () => {
  const found = await findCollections("test/fixtures/repo", opts)
  assert.deepEqual(found.map((c) => c.prefix).sort(), ["at", "pl"])
})

test("honours the exclude option", async () => {
  const found = await findCollections("test/fixtures/repo", opts)
  assert.equal(
    found.some((c) => c.name === "fixtures"),
    false,
  )
})

test("never descends into node_modules or .git", async () => {
  const found = await findCollections("test/fixtures/repo", opts)
  assert.equal(
    found.some((c) => c.path.includes("node_modules")),
    false,
  )
})

test("reads the folders map for status-by-folder collections", async () => {
  const found = await findCollections("test/fixtures/repo", opts)
  const ing = found.find((c) => c.prefix === "pl")
  assert.deepEqual(ing?.folders, { done: "completed" })
})

// Review Focus 1
test("falls back to the folder name when name and aliases are absent", async () => {
  const found = await findCollections("test/fixtures/noname", opts)
  assert.equal(found[0].prefix, "plans")
})

// Review Focus 3
test("keeps colliding prefixes distinct by path", async () => {
  const found = await findCollections("test/fixtures/repo", opts)
  assert.equal(new Set(found.map((c) => c.path)).size, found.length)
})

// Review Focus 4
test("stops at the depth cap instead of recursing without bound", async () => {
  const found = await findCollections("test/fixtures/repo", { ...opts, maxDepth: 0 })
  assert.deepEqual(found, [])
})

// Review Focus 3, properly: collisions must be disambiguated, not merely non-merging
test("disambiguates collections that would derive the same prefix", async () => {
  const found = await findCollections("test/fixtures/dup", opts)
  assert.equal(found.length, 2)
  assert.deepEqual(
    found.map((c) => c.prefix).sort(),
    ["a/initiatives", "b/initiatives"],
  )
})

test("honours an exclude pattern written relative to the scan root", async () => {
  const found = await findCollections("test/fixtures/repo", { exclude: ["test-corpus/**"] })
  assert.equal(
    found.some((c) => c.name === "fixtures"),
    false,
  )
})
