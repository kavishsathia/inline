import { readStore, resolveRepo } from "@inline/shared";
import { ParsedArgs } from "../args";

export function runList(_args: ParsedArgs): void {
  const repo = resolveRepo(process.cwd());
  const store = readStore(repo.repoPath, repo.branch);

  if (store.comments.length === 0) {
    process.stdout.write(`No comments on ${repo.branch}.\n`);
    return;
  }

  process.stdout.write(`${store.comments.length} comment(s) on ${repo.branch}:\n\n`);
  for (const c of store.comments) {
    const firstLine = c.body.split("\n")[0];
    process.stdout.write(`  ${c.file}:${c.line}  [${c.author}]\n    ${firstLine}\n`);
  }
}
