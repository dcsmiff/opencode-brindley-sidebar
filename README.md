# opencode-brindley-sidebar

Two OpenCode sidebar sections showing the state of the [Brindley](https://www.npmjs.com/package/brindley)
initiatives in whatever repository your session is working on.

```
Initiatives
4 active, 51 draft
18 deferred, 33 done

▼ Pick up next      4 · 51
  ◆   at#116 Suggestions for…
  ▶ b at#117 `GET /suggest` …
  ○ c at#112 Replay already-…
```

- **Initiatives** — counts by tier. `active` is in-progress and designed work;
  `done` aggregates done, abandoned and superseded.
- **Pick up next** — actionable rows, collapsed to active work. Expand it to see
  every initiative that is not in an end state. Click a row for its detail
  dialog.

Each row is a status glyph, a type letter, then the reference and title:

| Glyph | Status | Colour |
| --- | --- | --- |
| `▶` | in progress | green |
| `◆` | designed | amber |
| `○` | draft | muted |
| `?` | unrecognised status | red |

A `?` means the `status:` value is not one Brindley defines — usually a typo.
The initiative is still listed rather than hidden, so the mistake is visible.

The type letter is the type's first letter, except `feature`, which is left
blank because it is the majority of open work and marking it would only add
noise. `docs` and `decision` both show `d`; they are rare and the title tells
them apart.

Both sections render nothing when the session's repository has no collections,
so they stay out of the way in unrelated projects.

## Install

Add the package to `~/.config/opencode/cli.json`:

```jsonc
{
  "plugins": [{ "package": "/path/to/opencode-brindley-sidebar" }]
}
```

Toggle the sidebar with `Ctrl+X` then `B`.

## Options

```jsonc
{
  "plugins": [
    {
      "package": "/path/to/opencode-brindley-sidebar",
      "options": {
        "order": "status-recency",
        "exclude": ["**/test-corpus/**"],
        "maxRows": 8
      }
    }
  ]
}
```

| Option | Default | Meaning |
| --- | --- | --- |
| `order` | `status-recency` | Row order. Also `status-priority`, `recency`, `priority`. |
| `exclude` | `["**/test-corpus/**"]` | Glob patterns for directories to skip when discovering collections. Matched against the path relative to the session's directory, so both `**/test-corpus/**` and `archive/**` work. |
| `maxRows` | `8` | Maximum rows shown while collapsed. |

`status-recency` needs only `status` and `updated`, which every initiative has.
The priority orders are worth selecting only once most initiatives carry a
`priority` value — unscored ones sort last.

## Commands

| Command | Does |
| --- | --- |
| `/brindley` | Pin the sections to one collection, or return to all of them. The choice persists per project. |

In the detail dialog:

| Key | Does |
| --- | --- |
| `ctrl+q` | Queue a prompt to work on the initiative, with the file attached. It does not interrupt a running session; retrieve it into the composer with `<leader>q` then `ctrl+u`. |
| `ctrl+y` | Copy the reference (e.g. `at#70`) to the clipboard. macOS only — it shells out to `pbcopy`, and reports an error rather than a false success elsewhere. |
| `esc` | Close. |

## How it reads your files

A collection is any folder whose `README.md` front-matter has `brindley: 1`.
Discovery walks up to 4 directories below the session location, skipping
`node_modules` and `.git`. Each collection's `name`, `aliases`, `folders` and
`ignore` are read from that README rather than assumed, so the plugin follows
Brindley's own configuration. Row prefixes come from `aliases[0]`, falling back
to `name` and then the folder name.

Initiative status comes from front-matter, falling back to the sub-folder name
for collections that declare `folders:`. An unrecognised status is shown as a
draft rather than hidden, so a typo surfaces instead of disappearing.

The plugin is read-only: it never writes to your initiative files.

## Development

```sh
npm install
npm test
```

Tests run on Node's built-in runner with native type stripping — no build step.
`src/scan.ts` and `src/order.ts` carry the test weight; the Solid components are
kept thin and are gated by a JSX/TypeScript parse check rather than unit tests.

### Do not install the peer dependencies

`solid-js` and `@opentui/*` are peer dependencies and must **not** end up in
this package's `node_modules`. OpenCode runs plugins with its own OpenTUI and
Solid; a local copy shadows the host's, and outside a browser condition it
resolves to Solid's SSR build, where signals never notify. The symptom is
subtle and easy to misread: the sidebar renders values but never updates.

`.npmrc` sets `legacy-peer-deps=true` to stop npm auto-installing them. After
any dependency change, confirm:

```sh
ls node_modules/solid-js   # must not exist
```

`src/store.ts` is deliberately framework-free so it can be tested under plain
Node. The single reactive bridge lives in `src/tui.tsx`, where `solid-js`
resolves to the host's copy at runtime.
