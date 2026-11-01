import type { Order } from "./order.ts"

const ORDERS = ["status-recency", "status-priority", "recency", "priority"]

export type Options = { order: Order; exclude: string[]; maxRows: number }

export function resolveOptions(raw: unknown): Options {
  const o = raw !== null && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const order =
    typeof o.order === "string" && ORDERS.includes(o.order) ? (o.order as Order) : "status-recency"
  const exclude = Array.isArray(o.exclude)
    ? o.exclude.filter((v): v is string => typeof v === "string")
    : ["**/test-corpus/**"]
  const maxRows = typeof o.maxRows === "number" && o.maxRows > 0 ? Math.floor(o.maxRows) : 8
  return { order, exclude, maxRows }
}
