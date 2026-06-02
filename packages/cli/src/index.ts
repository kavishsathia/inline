import { parseArgs } from "./args";
import { runComment } from "./commands/comment";
import { runDismiss } from "./commands/dismiss";
import { runList } from "./commands/list";
import { runPath } from "./commands/path";

const USAGE = `inline — anchor agent commentary to the lines it's about

Usage:
  inline comment <file>:<line> "message"      Leave a comment on a line
  inline comment --file <f> --line <n> "msg"  (explicit-flag form)
  inline list                                 List comments on this branch
  inline dismiss <id>                         Dismiss a comment by id (prefix ok)
  inline dismiss <file>:<line>                Dismiss comment(s) at a location
  inline dismiss --all                        Dismiss every comment on this branch
  inline path                                 Print the active store path

Comment options:
  --file <path>     File the comment is on (or use <file>:<line> shorthand)
  --line <n>        1-based line number
  --author <name>   Defaults to "agent"
`;

function main(): void {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  switch (command) {
    case "comment":
      runComment(args);
      break;
    case "list":
      runList(args);
      break;
    case "dismiss":
      runDismiss(args);
      break;
    case "path":
      runPath(args);
      break;
    case undefined:
    case "help":
    case "--help":
    case "-h":
      process.stdout.write(USAGE);
      break;
    default:
      process.stderr.write(`Unknown command: ${command}\n\n${USAGE}`);
      process.exit(1);
  }
}

main();
