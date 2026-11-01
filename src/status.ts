export type Tier = "active" | "draft" | "settled"

const CANONICAL: Record<string, string> = {
  proposed: "draft",
  draft: "draft",
  designed: "designed",
  "in-progress": "in-progress",
  "in progress": "in-progress",
  active: "in-progress",
  deferred: "deferred",
  future: "deferred",
  done: "done",
  completed: "done",
  complete: "done",
  closed: "done",
  abandoned: "abandoned",
  superseded: "superseded",
}

const TIERS: Record<string, Tier> = {
  "in-progress": "active",
  designed: "active",
  draft: "draft",
  done: "settled",
  deferred: "settled",
  abandoned: "settled",
  superseded: "settled",
}

export function canonicalStatus(status: string): string {
  return CANONICAL[status.trim().toLowerCase()] ?? status.trim().toLowerCase()
}

// A status Brindley does not define. Such an initiative is still shown (as a
// draft), so the reader can see the typo rather than lose the initiative, but
// it must be rendered distinctly or "surfacing" it means nothing.
export function isRecognisedStatus(status: string): boolean {
  return canonicalStatus(status) in TIERS
}

export function tierFor(status: string): Tier {
  return TIERS[canonicalStatus(status)] ?? "draft"
}
