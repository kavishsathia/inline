# inline

Coding agents narrate into the terminal, where the commentary is ephemeral and
disconnected from the code it describes. **inline** moves that commentary to
where it belongs: anchored to the exact line it's about, rendered inside VS Code.

- **`inline` CLI** — an agent leaves a note on a file/line:
  `inline comment src/foo.ts:42 "adding retry here, upstream flakes"`
- **VS Code extension** — watches the comment store and renders each note as a
  real inline `CommentThread` on the line it points at.

## Setup

Prerequisites: Node 18+ and VS Code with the `code` CLI on your `PATH`
(in VS Code: `Cmd+Shift+P` → "Shell Command: Install 'code' command in PATH").

```bash
# 1. Install deps and build all three packages
npm install
npm run build

# 2. Install the VS Code extension (builds, packages, and installs the .vsix)
npm run install-local --workspace inline-vscode
#    then reload VS Code: Cmd+Shift+P → "Developer: Reload Window"

# 3. Make the `inline` CLI available globally
cd packages/cli && npm link && cd ../..
```

Verify:

```bash
inline help                  # CLI is on your PATH
code --list-extensions | grep inline   # extension is installed
```

### Try it

```bash
# Leave a comment on a line of any file in a git repo
inline comment src/app.js:42 "retry wraps the flaky upstream"

# See what's on this branch (each row starts with a short id)
inline list

# Dismiss it once addressed — by id prefix, by location, or all at once
inline dismiss 63ac0e4f
inline dismiss src/app.js:42
inline dismiss --all
```

In VS Code, open that file — the note renders inline on line 42. Edits, branch
switches, and dismissals all update the rendered comments live.

Try it against the playground at `examples/demo/app.js`:

```bash
inline comment examples/demo/app.js:4 "retry wraps the flaky upstream"
inline comment examples/demo/app.js:18 "throws the last error after retries"
```

### Updating after code changes

```bash
npm run build                                  # rebuild all packages
npm run install-local --workspace inline-vscode  # reinstall the extension
# the linked `inline` CLI picks up rebuilds automatically (it's symlinked)
```

Bump the extension's `version` in `packages/extension/package.json` when you
want VS Code to show it as an update.

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
