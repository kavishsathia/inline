# inline

Coding agents narrate into the terminal, where the commentary is ephemeral and
disconnected from the code it describes. **inline** moves that commentary to
where it belongs: anchored to the exact line it's about, rendered inside VS Code.

- **`inline` CLI** — an agent leaves a note on a file/line:
  `inline comment --file src/foo.ts --line 42 "adding retry here, upstream flakes"`
- **VS Code extension** — watches the comment store and renders each note as a
  real inline `CommentThread` on the line it points at.

## Layout

```
packages/
  shared/      # comment schema + storage-path resolver (used by both sides)
  cli/         # the `inline` command
  extension/   # the VS Code extension
```

## Storage

Comments live outside the repo, in a per-project, per-branch store:

```
~/.inline/
  index.json                 # repoHash -> { repoPath, lastSeen }
  projects/<repoHash>/<branchSlug>/comments.json
```

Switching git branches swaps the active comment set automatically.
