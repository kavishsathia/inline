import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { addComment, ANCHOR_CONTEXT, Comment, hashText, resolveRepo, storeFile } from "@inline/shared";
import { ParsedArgs } from "../args";

/** Parse a `<file>:<line>` shorthand positional, if present. */
function parseTarget(positionals: string[]): { file?: string; line?: number } {
  const first = positionals[0];
  if (!first) return {};
  const m = first.match(/^(.*):(\d+)$/);
  if (m) return { file: m[1], line: Number(m[2]) };
  return { file: first };
}

export function runComment(args: ParsedArgs): void {
  const target = parseTarget(args.positionals);

  const fileArg = (args.flags.file as string) || target.file;
  const lineArg = args.flags.line !== undefined ? Number(args.flags.line) : target.line;
  const author = (args.flags.author as string) || "agent";

  // Body: the last positional after the target, or --body.
  const bodyPositional = target.file ? args.positionals.slice(1) : args.positionals;
  const body = (args.flags.body as string) || bodyPositional.join(" ");

  if (!fileArg || !lineArg || !body) {
    process.stderr.write(
      'Usage: inline comment <file>:<line> "message"\n' +
        "  (need a file, a line number, and a message)\n"
    );
    process.exit(1);
  }

  const abs = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(abs)) {
    process.stderr.write(`File not found: ${abs}\n`);
    process.exit(1);
  }

  const repo = resolveRepo(path.dirname(abs));
  const relFile = path.relative(repo.repoPath, abs).split(path.sep).join("/");

  // Capture the anchored line plus a window of surrounding context, so the
  // renderer can relocate the comment even if the anchor line itself changes.
  const lines = fs.readFileSync(abs, "utf8").split("\n");
  const idx = lineArg - 1;
  const anchorText = lines[idx] ?? "";
  const contextBefore = lines.slice(Math.max(0, idx - ANCHOR_CONTEXT), idx);
  const contextAfter = lines.slice(idx + 1, idx + 1 + ANCHOR_CONTEXT);

  const comment: Comment = {
    id: randomUUID(),
    file: relFile,
    line: lineArg,
    anchorText,
    anchorHash: hashText(anchorText),
    contextBefore,
    contextAfter,
    body,
    author,
    createdAt: new Date().toISOString(),
    branch: repo.branch,
  };

  addComment(repo.repoPath, repo.branch, comment);

  process.stdout.write(
    `✓ comment on ${relFile}:${lineArg} (${repo.branch})\n` +
      `  ${storeFile(repo.repoPath, repo.branch)}\n`
  );
}
