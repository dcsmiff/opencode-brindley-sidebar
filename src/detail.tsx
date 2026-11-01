import { createResource, Show } from "solid-js"
import { readFile } from "node:fs/promises"
import { usePlugin } from "@opencode/plugin/tui"
import { goalOf, openQuestionCount } from "./detail-data.ts"
import type { Initiative } from "./scan.ts"

async function details(path: string): Promise<{ goal: string; questions: number }> {
  const text = await readFile(path, "utf8").catch(() => "")
  return { goal: goalOf(text), questions: openQuestionCount(text) }
}

export function Detail(props: { item: Initiative; onQueue: () => void; onCopy: () => void }) {
  const context = usePlugin()
  const [data] = createResource(() => props.item.path, details)

  return (
    <box flexDirection="column" gap={1}>
      <text fg={context.theme.text.base}>
        <b>{props.item.ref}</b>
      </text>
      <text fg={context.theme.text.base}>{props.item.title}</text>
      <text fg={context.theme.text.muted}>
        {[props.item.status, props.item.type, props.item.updated].filter(Boolean).join(" · ")}
      </text>
      <Show when={data()?.goal}>
        <box flexDirection="column">
          <text fg={context.theme.text.base}>
            <b>Goal</b>
          </text>
          <text fg={context.theme.text.muted}>{data()?.goal}</text>
        </box>
      </Show>
      <Show when={(data()?.questions ?? 0) > 0}>
        <text fg={context.theme.text.muted}>
          {data()?.questions} open {data()?.questions === 1 ? "question" : "questions"}
        </text>
      </Show>
      <box flexDirection="row" gap={2}>
        <text fg={context.theme.text.muted} onMouseUp={props.onQueue}>
          ctrl+q queue
        </text>
        <text fg={context.theme.text.muted} onMouseUp={props.onCopy}>
          ctrl+y copy
        </text>
        <text fg={context.theme.text.muted}>esc close</text>
      </box>
    </box>
  )
}
