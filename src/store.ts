import { watch, type FSWatcher } from "node:fs"
import { scan, type ScanResult } from "./scan.ts"
import type { Options } from "./options.ts"

export type Store = {
  get(): ScanResult | undefined
  subscribe(listener: (result: ScanResult) => void): () => void
  dispose(): void
}

// Deliberately free of any framework import. OpenCode runs plugins with its own
// OpenTUI and Solid, so a copy of solid-js inside this package would shadow the
// host's and break reactivity — outside a browser condition it even resolves to
// Solid's SSR build, where signals never notify. Keeping the scan loop
// framework-free lets it be tested under plain Node, and leaves the single
// reactive bridge in src/tui.tsx, where `solid-js` resolves to the host's copy.
export function createStore(directory: string | undefined, options: Options): Store {
  const listeners = new Set<(result: ScanResult) => void>()
  const watchers: FSWatcher[] = []
  let current: ScanResult | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  async function refresh(): Promise<void> {
    if (!directory || disposed) return
    let next: ScanResult
    try {
      next = await scan(directory, { exclude: options.exclude })
    } catch {
      return
    }
    if (disposed) return
    current = next
    for (const listener of listeners) listener(next)

    for (const w of watchers.splice(0)) w.close()
    for (const collection of next.collections) {
      try {
        const w = watch(collection.path, { recursive: true }, () => {
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => void refresh(), 300)
        })
        watchers.push(w)
      } catch {
        // a collection we cannot watch simply will not auto-refresh
      }
    }
  }

  void refresh()

  return {
    get: () => current,
    subscribe(listener) {
      listeners.add(listener)
      if (current) listener(current)
      return () => listeners.delete(listener)
    },
    dispose() {
      disposed = true
      listeners.clear()
      if (timer) clearTimeout(timer)
      for (const w of watchers.splice(0)) w.close()
    },
  }
}
