import type { ScanResult } from "./scan.ts"

export function applyPin(result: ScanResult, pinned: string | null): ScanResult {
  if (!pinned) return result
  const collection = result.collections.find((c) => c.path === pinned)
  if (!collection) return result
  return {
    collections: [collection],
    initiatives: result.initiatives.filter((i) => i.path.startsWith(`${collection.path}/`)),
    unreadable: result.unreadable,
  }
}
