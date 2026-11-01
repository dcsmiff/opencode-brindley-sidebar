import { test } from "node:test"
import assert from "node:assert/strict"
import { scan } from "../src/scan.ts"

const opts = { exclude: ["**/test-corpus/**"] }

test("builds refs from the collection prefix and file number", async () => {
  const { initiatives } = await scan("test/fixtures/repo", opts)
  assert.ok(initiatives.some((i) => i.ref === "at#70"))
  assert.ok(initiatives.some((i) => i.ref === "pl#4"))
})

test("takes the title from the first heading", async () => {
  const { initiatives } = await scan("test/fixtures/repo", opts)
  const item = initiatives.find((i) => i.ref === "at#70")
  assert.equal(item?.title, "Results go stale when a dependency changes")
})

test("derives status from the folders map when front-matter omits it", async () => {
  const { initiatives } = await scan("test/fixtures/repo", opts)
  const item = initiatives.find((i) => i.ref === "pl#3")
  assert.equal(item?.status, "done")
  assert.equal(item?.tier, "settled")
})

test("classifies an unrecognised status as draft", async () => {
  const { initiatives } = await scan("test/fixtures/repo", opts)
  assert.equal(initiatives.find((i) => i.ref === "at#99")?.tier, "draft")
})

// Review Focus 2
test("counts a file with no front-matter as unreadable without throwing", async () => {
  const result = await scan("test/fixtures/repo", opts)
  assert.equal(result.unreadable, 1)
  assert.equal(
    result.initiatives.some((i) => i.ref === "at#98"),
    false,
  )
})

test("excludes the fixtures collection entirely", async () => {
  const { collections } = await scan("test/fixtures/repo", opts)
  assert.equal(
    collections.some((c) => c.name === "fixtures"),
    false,
  )
})
