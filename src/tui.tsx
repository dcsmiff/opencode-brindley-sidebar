import { spawn } from "node:child_process"
import { createSignal } from "solid-js"
import { Plugin } from "@opencode/plugin/tui"
import { resolveOptions } from "./options.ts"
import { createStore } from "./store.ts"
import { Health, PickUpNext } from "./sections.tsx"
import { Detail } from "./detail.tsx"
import { promptFor } from "./prompt.ts"
import { applyPin } from "./pin.ts"
import type { Initiative, ScanResult } from "./scan.ts"

export default Plugin.define({
  id: "brindley.sidebar",
  setup(context) {
    const options = resolveOptions(context.options)
    const store = createStore(context.location?.directory, options)
    const [result, setResult] = createSignal<ScanResult | undefined>(store.get())
    const unsubscribe = store.subscribe((next) => setResult(next))
    const [view, setView] = context.storage.store("view", { initial: { expanded: false } })
    const [pin, setPin] = context.storage.store("pin", {
      initial: { path: null as string | null },
    })

    // The initiative whose dialog is currently open. Held in one signal so the
    // shortcut layer below can be registered exactly once: registering it per
    // dialog would stack layers bound to stale initiatives, and ctrl+q could
    // then queue a previously viewed one.
    const [current, setCurrent] = createSignal<Initiative | undefined>(undefined)

    const visible = () => {
      const current = result()
      return current ? applyPin(current, pin.path) : undefined
    }

    const queue = () => {
      const item = current()
      if (!item) return
      const route = context.ui.router.current()
      const sessionID = route.type === "session" ? route.sessionID : undefined
      if (!sessionID) {
        context.ui.toast.show({ message: "Open a session first", variant: "error" })
        return
      }
      void context.client.session.prompt({ sessionID, ...promptFor(item) }).then(
        () => context.ui.toast.show({ message: `Queued ${item.ref}`, variant: "success" }),
        () => context.ui.toast.show({ message: `Could not queue ${item.ref}`, variant: "error" }),
      )
      context.ui.dialog.clear()
    }

    const copy = () => {
      const item = current()
      if (!item) return
      let settled = false
      const child = spawn("pbcopy")
      child.on("error", () => {
        if (settled) return
        settled = true
        context.ui.toast.show({ message: "Clipboard unavailable", variant: "error" })
      })
      child.on("close", (code) => {
        if (settled) return
        settled = true
        if (code === 0) context.ui.toast.show({ message: `Copied ${item.ref}` })
        else context.ui.toast.show({ message: `Could not copy ${item.ref}`, variant: "error" })
      })
      child.stdin.end(item.ref)
      context.ui.dialog.clear()
    }

    context.keymap.layer(() => ({
      commands: [
        {
          id: "brindley.queue",
          title: "Queue work on this initiative",
          group: "Brindley",
          bind: "ctrl+q",
          enabled: () => current() !== undefined,
          run: queue,
        },
        {
          id: "brindley.copy",
          title: "Copy initiative reference",
          group: "Brindley",
          bind: "ctrl+y",
          enabled: () => current() !== undefined,
          run: copy,
        },
      ],
    }))

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "brindley.pick",
          title: "Pick Brindley collection",
          group: "Brindley",
          slash: { name: "brindley" },
          palette: true,
          run: async () => {
            const current = result()
            if (!current || current.collections.length === 0) {
              context.ui.toast.show({ message: "No Brindley collections here", variant: "error" })
              return
            }
            const chosen = await context.ui.dialog.select({
              title: "Brindley collection",
              current: pin.path ?? "all",
              options: [
                { title: "All collections", value: "all" },
                ...current.collections.map((c) => ({
                  title: c.name,
                  value: c.path,
                  description: context.ui.format.path(c.path),
                })),
              ],
            })
            if (chosen === undefined) return
            await setPin((draft) => {
              draft.path = chosen === "all" ? null : chosen
            })
          },
        },
      ],
    }))

    function openDetail(item: Initiative) {
      setCurrent(item)
      context.ui.dialog.set({ size: "large", centered: true })
      context.ui.dialog.show(
        () => <Detail item={item} onQueue={queue} onCopy={copy} />,
        () => setCurrent(undefined),
      )
    }

    const disposeHealth = context.ui.slot({
      append: "sidebar.content",
      render: () => <Health result={visible()} />,
    })

    const disposeNext = context.ui.slot({
      append: "sidebar.content",
      render: () => (
        <PickUpNext
          result={visible()}
          options={options}
          expanded={view.expanded}
          onToggle={() => {
            void setView((draft) => {
              draft.expanded = !draft.expanded
            }).catch(() => {})
          }}
          onOpen={openDetail}
        />
      ),
    })

    return () => {
      unsubscribe()
      disposeHealth()
      disposeNext()
      store.dispose()
    }
  },
})
