import * as path from "path";
import { Comment, readStore, removeComments, resolveRepo } from "@inline/shared";
import { ParsedArgs } from "../args";

/** Is the target a `<file>:<line>` location rather than an id prefix? */
function asLocation(target: string): { file: string; line: number } | null {
  const m = target.match(/^(.*):(\d+)$/);
  if (!m) return null;
  return { file: m[1], line: Number(m[2]) };
}

export function runDismiss(args: ParsedArgs): void {
  const target = args.positionals[0];
  const all = args.flags.all === true;

  if (!target && !all) {
    process.stderr.write(
      "Usage:\n" +
        "  inline dismiss <id>            Dismiss one comment by id (prefix ok)\n" +
        "  inline dismiss <file>:<line>   Dismiss comment(s) at a location\n" +
        "  inline dismiss --all           Dismiss every comment on this branch\n"
    );
    process.exit(1);
  }

  const loc = target ? asLocation(target) : null;

  // For a location target, resolve the repo from the file so the relative
  // path matches what was stored; otherwise resolve from cwd.
  const repo = loc
    ? resolveRepo(path.dirname(path.resolve(process.cwd(), loc.file)))
    : resolveRepo(process.cwd());

  let predicate: (c: Comment) => boolean;
  let describe: string;

  if (all) {
    predicate = () => true;
    describe = "all comments";
  } else if (loc) {
    const abs = path.resolve(process.cwd(), loc.file);
    const relFile = path.relative(repo.repoPath, abs).split(path.sep).join("/");
    predicate = (c) => c.file === relFile && c.line === loc.line;
    describe = `${relFile}:${loc.line}`;
  } else {
    // id prefix — guard against an ambiguous prefix matching several comments.
    const store = readStore(repo.repoPath, repo.branch);
    const matches = store.comments.filter((c) => c.id.startsWith(target));
    if (matches.length > 1) {
      process.stderr.write(`Ambiguous id "${target}" matches ${matches.length} comments:\n`);
      for (const c of matches) {
        process.stderr.write(`  ${c.id.slice(0, 8)}  ${c.file}:${c.line}\n`);
      }
      process.exit(1);
    }
    predicate = (c) => c.id.startsWith(target);
    describe = `comment ${target}`;
  }

  const { removed } = removeComments(repo.repoPath, repo.branch, predicate);

  if (removed.length === 0) {
    process.stderr.write(`No comment matched ${describe} on ${repo.branch}.\n`);
    process.exit(1);
  }

  process.stdout.write(`✓ dismissed ${removed.length} comment(s) (${describe}) on ${repo.branch}\n`);
}
