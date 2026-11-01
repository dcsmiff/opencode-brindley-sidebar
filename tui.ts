// Package-root TUI entrypoint.
//
// OpenCode loads a cli.json plugin given as a filesystem path by resolving
// `<package>/tui`. A package.json `exports` map is only consulted for *named*
// package specifiers, not for absolute or relative paths, so the `./tui`
// export alone leaves a path-configured plugin unresolvable. This file is that
// resolvable entrypoint; the exports map below it still serves the package when
// it is installed by name.
export { default } from "./src/tui.tsx"
