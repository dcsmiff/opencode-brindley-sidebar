import type { Initiative } from "./scan.ts"

export function promptFor(item: Initiative): {
  text: string
  files: string[]
  delivery: "queue"
} {
  return {
    text: `Work on ${item.ref} — ${item.title}. Read the attached initiative first.`,
    files: [item.path],
    delivery: "queue",
  }
}
