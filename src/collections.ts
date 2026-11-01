import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import picomatch from "picomatch"
import { parseFrontMatter } from "./frontmatter.ts"

export type Collection = {
  prefix: string
  name: string
  path: string
  folders: Record<string, string>
  ignore: string[]
}

const SKIP = new Set(["node_modules", ".git", ".svn", "dist", "build"])

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : []
}

function asStringMap(value: unknown): Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value)) if (typeof v === "string") out[k] = v
  return out
}

async function readCollection(dir: string): Promise<Collection | null> {
  let text: string
  try {
    text = await readFile(path.join(dir, "README.md"), "utf8")
  } catch {
    return null
  }
  const parsed = parseFrontMatter(text)
  if (!parsed) return null
  const brindley = parsed.data.brindley
  if (brindley !== 1 && brindley !== "1" && brindley !== true) return null
  const aliases = asStringArray(parsed.data.aliases)
  const name = typeof parsed.data.name === "string" ? parsed.data.name : path.basename(dir)
  return {
    prefix: aliases[0] ?? name,
    name,
    path: dir,
    folders: asStringMap(parsed.data.folders),
    ignore: asStringArray(parsed.data.ignore),
  }
}

// Two collections can derive the same prefix — an alias repeated across
// collections, or two folders with the same name and no `name:` of their own.
// Identical refs would make rows ambiguous and point "copy ref" and the queued
// prompt at the wrong initiative, so qualify the duplicates with their parent
// folder, and fall back to a numeric suffix if that still collides.
function disambiguate(collections: Collection[]): Collection[] {
  const counts = new Map<string, number>()
  for (const c of collections) counts.set(c.prefix, (counts.get(c.prefix) ?? 0) + 1)

  const qualified = collections.map((c) =>
    (counts.get(c.prefix) ?? 0) > 1
      ? { ...c, prefix: `${path.basename(path.dirname(c.path))}/${c.prefix}` }
      : c,
  )

  const used = new Set<string>()
  return qualified.map((c) => {
    if (!used.has(c.prefix)) {
      used.add(c.prefix)
      return c
    }
    let n = 2
    while (used.has(`${c.prefix}~${n}`)) n++
    const prefix = `${c.prefix}~${n}`
    used.add(prefix)
    return { ...c, prefix }
  })
}

export async function findCollections(
  root: string,
  options: { exclude: string[]; maxDepth?: number },
): Promise<Collection[]> {
  const maxDepth = options.maxDepth ?? 4
  const isExcluded = picomatch(options.exclude.length ? options.exclude : ["__none__"])
  const found: Collection[] = []
  const seen = new Set<string>()

  async function walk(dir: string, depth: number): Promise<void> {
    const real = path.resolve(dir)
    if (seen.has(real)) return
    seen.add(real)

    const collection = await readCollection(dir)
    if (collection) found.push(collection)
    if (depth >= maxDepth) return

    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP.has(entry.name) || entry.name.startsWith(".")) continue
      const child = path.join(dir, entry.name)
      if (isExcluded(path.relative(root, child))) continue
      await walk(child, depth + 1)
    }
  }

  await walk(root, 0)
  return disambiguate(found)
}
