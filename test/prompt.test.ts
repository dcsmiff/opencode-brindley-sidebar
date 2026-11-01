import { test } from "node:test"
import assert from "node:assert/strict"
import { promptFor } from "../src/prompt.ts"

test("builds a queued prompt naming the ref and attaching the file", () => {
  const body = promptFor({
    ref: "at#70",
    number: 70,
    title: "Results go stale",
    status: "in-progress",
    tier: "active",
    path: "/repo/docs/initiatives/70-x.md",
  })
  assert.equal(body.delivery, "queue")
  assert.deepEqual(body.files, ["/repo/docs/initiatives/70-x.md"])
  assert.match(body.text, /at#70/)
  assert.match(body.text, /Results go stale/)
})
