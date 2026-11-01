import { orderInitiatives } from "./order.ts"
import { isRecognisedStatus } from "./status.ts"
import type { Initiative } from "./scan.ts"
import type { Options } from "./options.ts"
import type { Tier } from "./status.ts"

export function glyphFor(tier: Tier, status: string): string {
  if (!isRecognisedStatus(status)) return "?"
  if (tier === "active") return status === "designed" ? "◆" : "▶"
  return "○"
}

// `feature` is about 60% of open work across these collections, so lettering it
// would mark the unremarkable majority and add noise. It stays blank, and only
// the exceptions earn a letter.
//
// Known collision: `docs` and `decision` both yield "d". Both are rare (5 of 70
// open initiatives) and the title disambiguates them at a glance, which is a
// better trade than inventing a letter a reader cannot guess.
const TYPE_MARKS: Record<string, string> = {
  feature: " ",
}

export function typeMarkFor(type: string | undefined): string {
  if (!type) return " "
  const key = type.trim().toLowerCase()
  if (!key) return " "
  return TYPE_MARKS[key] ?? key[0]
}

export function rowsFor(items: Initiative[], options: Options, expanded: boolean): Initiative[] {
  const wanted = expanded ? ["active", "draft"] : ["active"]
  const filtered = items.filter((i) => wanted.includes(i.tier))
  const ordered = orderInitiatives(filtered, options.order)
  return expanded ? ordered : ordered.slice(0, options.maxRows)
}
