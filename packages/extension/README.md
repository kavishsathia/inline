# inline (VS Code extension)

Renders agent commentary as inline `CommentThread`s anchored to the exact line
it's about, sourced from the per-repo/per-branch store written by the `inline`
CLI.

- Comments load automatically for the current workspace folder + git branch.
- Switching branches swaps the active comment set (watches `.git/HEAD`).
- New comments appear live (watches the store file).
- Command: **inline: Refresh comments**.

See the [project README](https://github.com/kavishsathia/inline) for the CLI.
