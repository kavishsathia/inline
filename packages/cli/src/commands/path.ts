import { resolveRepo, storeFile } from "@inline/shared";
import { ParsedArgs } from "../args";

export function runPath(_args: ParsedArgs): void {
  const repo = resolveRepo(process.cwd());
  process.stdout.write(`${storeFile(repo.repoPath, repo.branch)}\n`);
}
