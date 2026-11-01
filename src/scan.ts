import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import picomatch from "picomatch"
import { parseFrontMatter } from "./frontmatter.ts"
import { findCollections, type Collection } from "./collections.ts"
import { canonicalStatus, tierFor, type Tier } from "./status.ts"

export type Initiative = {
  ref: string
  number: number
  title: string
  status: string
  tier: Tier
  type?: string
  updated?: string
  priority?: string
  path: string
}

export type ScanResult = {
  collections: Collection[]
  initiatives: Initiative[]
  unreadable: number
}

const FILE = /^(\d+)-(.+)\.md$/

function titleFrom(body: string, slug: string): string {
  const heading = body.split("\n").find((line) => line.startsWith("# "))
  if (heading) return heading.slice(2).trim()
  return slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())
}

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

async function filesIn(dir: string): Promise<{ file: string; folder: string | null }[]> {
  const out: { file: string; folder: string | null }[] = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry.isFile() && FILE.test(entry.name)) out.push({ file: entry.name, folder: null })
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue
    let children
    try {
      children = await readdir(path.join(dir, entry.name), { withFileTypes: true })
    } catch {
      continue
    }
    for (const child of children) {
      if (child.isFile() && FILE.test(child.name)) out.push({ file: child.name, folder: entry.name })
    }
  }
  return out
}

export async function scan(
  root: string,
  options: { exclude: string[]; maxDepth?: number },
): Promise<ScanResult> {
  const collections = await findCollections(root, options)
  const initiatives: Initiative[] = []
  let unreadable = 0

  for (const collection of collections) {
    const ignored = collection.ignore.length ? picomatch(collection.ignore) : () => false
    const byFolder = new Map(Object.entries(collection.folders).map(([s, f]) => [f, s]))

    for (const { file, folder } of await filesIn(collection.path)) {
      const relative = folder ? `${folder}/${file}` : file
      if (ignored(relative)) continue
      const full = path.join(collection.path, relative)

      let parsed
      try {
        parsed = parseFrontMatter(await readFile(full, "utf8"))
      } catch {
        unreadable++
        continue
      }
      if (!parsed) {
        unreadable++
        continue
      }

      const match = FILE.exec(file)
      if (!match) continue
      const fromFolder = folder ? byFolder.get(folder) : undefined
      const raw = str(parsed.data.status) ?? fromFolder
      if (!raw) {
        unreadable++
        continue
      }
      const status = canonicalStatus(raw)

      initiatives.push({
        ref: `${collection.prefix}#${Number(match[1])}`,
        number: Number(match[1]),
        title: titleFrom(parsed.body, match[2]),
        status,
        tier: tierFor(status),
        type: str(parsed.data.type),
        updated: str(parsed.data.updated),
        priority: str(parsed.data.priority),
        path: full,
      })
    }
  }

  return { collections, initiatives, unreadable }
}
