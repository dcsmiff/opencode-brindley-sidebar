import { For, Show } from "solid-js"
import { usePlugin } from "@opencode/plugin/tui"
import { glyphFor, rowsFor, typeMarkFor } from "./row.ts"
import { summarise } from "./order.ts"
import type { Initiative, ScanResult } from "./scan.ts"
import type { Options } from "./options.ts"

export function Health(props: { result: ScanResult | undefined }) {
  const context = usePlugin()
  const counts = () => summarise(props.result?.initiatives ?? [])
  const open = () => `${counts().active} active, ${counts().draft} draft`
  const settled = () => `${counts().deferred} deferred, ${counts().done} done`

  return (
    <Show when={props.result && props.result.collections.length > 0}>
      <box>
        <text fg={context.theme.text.base}>
          <b>Initiatives</b>
        </text>
        <text fg={context.theme.text.muted}>{open()}</text>
        <text fg={context.theme.text.muted}>{settled()}</text>
        <Show when={(props.result?.unreadable ?? 0) > 0}>
          <text fg={context.theme.text.muted}>{props.result?.unreadable} unreadable</text>
        </Show>
      </box>
    </Show>
  )
}

export function PickUpNext(props: {
  result: ScanResult | undefined
  options: Options
  expanded: boolean
  onToggle: () => void
  onOpen: (item: Initiative) => void
}) {
  const context = usePlugin()
  const counts = () => summarise(props.result?.initiatives ?? [])
  const rows = () => rowsFor(props.result?.initiatives ?? [], props.options, props.expanded)

  const colour = (item: Initiative) => {
    if (glyphFor(item.tier, item.status) === "?") {
      return context.theme.text.feedback.error.base
    }
    if (item.tier !== "active") return context.theme.text.muted
    return item.status === "designed"
      ? context.theme.text.feedback.warning.base
      : context.theme.text.feedback.success.base
  }

  return (
    <Show when={counts().active + counts().draft > 0}>
      <box>
        <box flexDirection="row" gap={1} onMouseDown={props.onToggle}>
          <text fg={context.theme.text.base}>{props.expanded ? "▼" : "▶"}</text>
          <text fg={context.theme.text.base} flexGrow={1}>
            <b>Pick up next</b>
          </text>
          <text fg={context.theme.text.muted} flexShrink={0}>
            {props.expanded ? `${counts().active} · ${counts().draft}` : `${counts().active}`}
          </text>
        </box>
        <For each={rows()}>
          {(item) => (
            <box
              flexDirection="row"
              gap={1}
              minWidth={0}
              onMouseUp={() => props.onOpen(item)}
            >
              <text fg={colour(item)} flexShrink={0}>
                {glyphFor(item.tier, item.status)}
              </text>
              <text fg={context.theme.text.muted} flexShrink={0}>
                {typeMarkFor(item.type)}
              </text>
              <text
                wrapMode="none"
                truncate
                flexGrow={1}
                flexShrink={1}
                minWidth={0}
                fg={context.theme.text.base}
              >
                {item.ref} {item.title}
              </text>
            </box>
          )}
        </For>
      </box>
    </Show>
  )
}
