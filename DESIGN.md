# Design notes

Why this plugin is shaped the way it is. Brief, and limited to decisions that
are not obvious from the code.

## Two sections, not one

**Initiatives** answers "how much is open here" in counts. **Pick up next**
answers "what should I work on" in rows. They are separate `sidebar.content`
contributions so each collapses independently, the same way OpenCode's own
Context and MCP sections behave.

Both render nothing when the session's repository has no collections. Most
repositories do not use Brindley, and a dead `Initiatives 0` header in every
unrelated session is noise.

## Tiers

| Tier | Statuses |
| --- | --- |
| `active` | in-progress, designed |
| `draft` | draft |
| `settled` | done, deferred, abandoned, superseded |

`deferred` counts as settled. Brindley already treats it that way for milestone
completion, and showing dormant work as open inflates the counts that the
section exists to convey.

An **unrecognised** status is classified `draft`, never `settled`, and renders
as a red `?`. Hiding an initiative because its `status:` has a typo is the
worst available outcome: the work disappears silently. Note that classifying it
is not enough — an early version rendered it identically to a draft, which kept
the letter of this rule and none of its intent.

## Front-matter wins over folder

Brindley takes status from front-matter, falling back to the sub-folder name
for collections that declare `folders:`. A file sitting in `completed/` while
still declaring `status: draft` is a half-applied change, which Brindley's own
`validate` reports. The plugin shows it as a draft rather than promoting it by
location, so the inconsistency stays visible.

## Ordering

`status-recency` is the default because `status` and `updated` are present on
every initiative, while scoring dimensions are usually sparse. The
priority-based orders are worth selecting only once a collection is actually
scored; unscored initiatives sort last.

## Glyphs and type letters

Status is carried by a coloured glyph rather than a status word. The sidebar is
about 34 columns wide, and `In progress` consumes a third of a row, leaving
titles truncated to mush.

Type is a one-letter prefix instead of a second colour. In practice a backlog
contains two or three statuses but many types, so type is where the variety is
— but colouring dozens of draft rows by type would drown the handful of
actionable ones, which defeats the section. `feature` is left blank because it
is usually the majority, and marking the unremarkable majority is noise.

## Reading the files directly

OpenCode's server API exposes MCP servers and resources but no tool-invocation
endpoint, so a plugin cannot call Brindley's `list`. The plugin parses the
Markdown itself.

To avoid drifting from Brindley's rules it reads each collection's `README.md`
for `name`, `aliases`, `folders` and `ignore` rather than assuming them, and
treats `brindley: 1` as the only marker of a collection.

## Where reactivity lives

`src/store.ts` is deliberately free of any framework import, exposing
`get`/`subscribe`. Two reasons:

1. It can be tested under plain Node, which is most of the value in the test
   suite.
2. OpenCode runs plugins with **its own** OpenTUI and Solid. A copy of
   `solid-js` inside this package shadows the host's, and outside a browser
   condition it resolves to Solid's SSR build where signals never notify. The
   failure is quiet and easy to misread: the sidebar renders values but never
   updates. `.npmrc` sets `legacy-peer-deps=true` to keep npm from installing
   the peers.

The single reactive bridge is in `src/tui.tsx`, where `solid-js` resolves to
the host's copy at runtime.

## Testing boundary

`scan.ts`, `order.ts`, `row.ts`, `status.ts`, `pin.ts` and `store.ts` carry the
tests. The Solid components are kept thin and gated by a JSX/TypeScript parse
check, because mounting a plugin context outside OpenCode is not possible here.
That boundary is the reason logic such as goal extraction and row selection
lives in `.ts` modules rather than inside the components.
