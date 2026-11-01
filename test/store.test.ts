import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, writeFile, rename, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createStore } from "../src/store.ts"

const options = { order: "status-recency" as const, exclude: [], maxRows: 8 }

// Poll rather than sleep a fixed time: the watch is debounced at 300ms and a
// fixed wait would be either flaky or needlessly slow.
async function until<T>(get: () => T, predicate: (value: T) => boolean, ms = 5000): Promise<T> {
  const deadline = Date.now() + ms
  for (;;) {
    const value = get()
    if (predicate(value)) return value
    if (Date.now() > deadline) throw new Error("timed out waiting for the store to settle")
    await new Promise((r) => setTimeout(r, 25))
  }
}

async function collection(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "brindley-store-"))
  const dir = path.join(root, "docs", "initiatives")
  await mkdir(dir, { recursive: true })
  await writeFile(
    path.join(dir, "README.md"),
    "---\nbrindley: 1\nname: probe\naliases:\n  - pb\n---\n",
  )
  await writeFile(path.join(dir, "1-one.md"), "---\nstatus: draft\n---\n# One\n")
  return root
}

test("scans asynchronously and reports the initial contents", async () => {
  const root = await collection()
  const store = createStore(root, options)
  try {
    const result = await until(store.get, (r) => r !== undefined)
    assert.deepEqual(result?.initiatives.map((i) => i.ref), ["pb#1"])
  } finally {
    store.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test("picks up a new initiative without a restart", async () => {
  const root = await collection()
  const store = createStore(root, options)
  try {
    await until(store.get, (r) => r !== undefined)
    await writeFile(
      path.join(root, "docs", "initiatives", "2-two.md"),
      "---\nstatus: in-progress\n---\n# Two\n",
    )
    const result = await until(store.get, (r) => (r?.initiatives.length ?? 0) === 2)
    assert.deepEqual(
      result?.initiatives.map((i) => i.ref).sort(),
      ["pb#1", "pb#2"],
    )
    assert.equal(result?.initiatives.find((i) => i.ref === "pb#2")?.tier, "active")
  } finally {
    store.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test("reflects a status edited in place", async () => {
  const root = await collection()
  const store = createStore(root, options)
  try {
    const first = await until(store.get, (r) => r !== undefined)
    assert.equal(first?.initiatives[0].tier, "draft")

    await writeFile(
      path.join(root, "docs", "initiatives", "1-one.md"),
      "---\nstatus: in-progress\n---\n# One\n",
    )

    const result = await until(store.get, (r) => r?.initiatives[0]?.tier === "active")
    assert.equal(result?.initiatives[0].status, "in-progress")
  } finally {
    store.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

// Brindley moves files for collections that declare `folders:`, so completing
// an initiative is a rename into completed/, not an edit. atlas/pipeline
// declares exactly this.
test("reflects a status change made by moving the file into a status folder", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "brindley-store-"))
  const dir = path.join(root, "pipeline")
  await mkdir(dir, { recursive: true })
  await writeFile(
    path.join(dir, "README.md"),
    "---\nbrindley: 1\nname: pipeline\naliases:\n  - pl\nfolders:\n  done: completed\n---\n",
  )
  await writeFile(path.join(dir, "4-feed.md"), "---\nstatus: draft\n---\n# Feed\n")

  const store = createStore(root, options)
  try {
    const first = await until(store.get, (r) => r !== undefined)
    assert.equal(first?.initiatives[0].tier, "draft")

    await mkdir(path.join(dir, "completed"), { recursive: true })
    await writeFile(path.join(dir, "4-feed.md"), "---\nstatus: done\n---\n# Feed\n")
    await rename(path.join(dir, "4-feed.md"), path.join(dir, "completed", "4-feed.md"))

    const result = await until(store.get, (r) => r?.initiatives[0]?.tier === "settled")
    assert.equal(result?.initiatives[0].status, "done")
    assert.equal(result?.initiatives[0].ref, "pl#4")
  } finally {
    store.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

// Brindley's rule is front-matter first, sub-folder only as a fallback, so a
// file sitting in completed/ while still declaring `status: draft` is a
// half-applied change (Brindley's own `validate` flags it). It must read as a
// draft rather than being silently promoted to done by its location.
test("lets front-matter status win over the status folder", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "brindley-store-"))
  const dir = path.join(root, "pipeline", "completed")
  await mkdir(dir, { recursive: true })
  await writeFile(
    path.join(root, "pipeline", "README.md"),
    "---\nbrindley: 1\nname: pipeline\naliases:\n  - pl\nfolders:\n  done: completed\n---\n",
  )
  await writeFile(path.join(dir, "9-half-applied.md"), "---\nstatus: draft\n---\n# Half applied\n")

  const store = createStore(root, options)
  try {
    const result = await until(store.get, (r) => r !== undefined)
    assert.equal(result?.initiatives[0].status, "draft")
    assert.equal(result?.initiatives[0].tier, "draft")
  } finally {
    store.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test("stops updating once disposed", async () => {  const root = await collection()
  const store = createStore(root, options)
  await until(store.get, (r) => r !== undefined)
  store.dispose()
  const before = store.get()?.initiatives.length
  await writeFile(
    path.join(root, "docs", "initiatives", "3-three.md"),
    "---\nstatus: draft\n---\n# Three\n",
  )
  await new Promise((r) => setTimeout(r, 700))
  assert.equal(store.get()?.initiatives.length, before)
  await rm(root, { recursive: true, force: true })
})
