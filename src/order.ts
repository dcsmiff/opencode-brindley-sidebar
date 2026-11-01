import type { Initiative } from "./scan.ts"

export type Order = "status-recency" | "status-priority" | "recency" | "priority"

const TIER_RANK: Record<string, number> = { active: 0, draft: 1, settled: 2 }
const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  normal: 2,
  low: 3,
  trivial: 4,
}

function priorityRank(item: Initiative): number {
  if (!item.priority) return 99
  return PRIORITY_RANK[item.priority.toLowerCase()] ?? 98
}

function recencyRank(item: Initiative): number {
  if (!item.updated) return Number.POSITIVE_INFINITY
  const time = Date.parse(item.updated)
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : -time
}

function compare(a: Initiative, b: Initiative, order: Order): number {
  const tier = TIER_RANK[a.tier] - TIER_RANK[b.tier]
  if (order === "status-recency") return tier || recencyRank(a) - recencyRank(b) || 0
  if (order === "status-priority") return tier || priorityRank(a) - priorityRank(b) || 0
  if (order === "priority") return priorityRank(a) - priorityRank(b) || tier || 0
  return recencyRank(a) - recencyRank(b) || 0
}

export function orderInitiatives(items: Initiative[], order: Order): Initiative[] {
  return [...items].sort((a, b) => {
    const result = compare(a, b, order)
    return Number.isNaN(result) ? 0 : result || a.ref.localeCompare(b.ref)
  })
}

export function summarise(items: Initiative[]): {
  active: number
  draft: number
  deferred: number
  done: number
} {
  const counts = { active: 0, draft: 0, deferred: 0, done: 0 }
  for (const item of items) {
    if (item.tier === "active") counts.active++
    else if (item.tier === "draft") counts.draft++
    else if (item.status === "deferred") counts.deferred++
    else counts.done++
  }
  return counts
}
