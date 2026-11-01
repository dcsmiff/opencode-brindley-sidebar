import { parse } from "yaml"

export function parseFrontMatter(
  text: string,
): { data: Record<string, unknown>; body: string } | null {
  if (!text.startsWith("---")) return null
  const end = text.indexOf("\n---", 3)
  if (end === -1) return null
  const raw = text.slice(text.indexOf("\n") + 1, end + 1)
  const rest = text.slice(end + 4)
  const parsed = raw.trim() === "" ? {} : parse(raw)
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null
  return {
    data: parsed as Record<string, unknown>,
    body: rest.startsWith("\n") ? rest.slice(1) : rest,
  }
}
