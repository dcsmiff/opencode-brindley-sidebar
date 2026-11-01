function sectionLines(body: string, heading: string): string[] {
  const lines = body.split("\n")
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading}`)
  if (start === -1) return []
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => line.startsWith("## "))
  return end === -1 ? rest : rest.slice(0, end)
}

export function goalOf(body: string): string {
  const lines = sectionLines(body, "goal")
  const paragraph: string[] = []
  for (const line of lines) {
    if (line.trim() === "") {
      if (paragraph.length > 0) break
      continue
    }
    paragraph.push(line.trim())
  }
  return paragraph.join("\n")
}

export function openQuestionCount(body: string): number {
  return sectionLines(body, "open questions").filter((line) => line.startsWith("- ")).length
}
