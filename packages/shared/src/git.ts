import { execFileSync } from "child_process";
import { NO_GIT_BRANCH } from "./paths";

export interface RepoContext {
  /** Absolute repo root, or the original cwd when not in a git repo. */
  repoPath: string;
  /** Branch name, `detached-<sha>`, or NO_GIT_BRANCH. */
  branch: string;
  /** Whether `cwd` is actually inside a git work tree. */
  isGit: boolean;
}

function git(cwd: string, args: string[]): string | null {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

/**
 * Resolve the repo + branch identity for a directory. This is the single
 * source of truth both the CLI and extension use to locate a store, so they
 * always agree on the key.
 */
export function resolveRepo(cwd: string): RepoContext {
  const root = git(cwd, ["rev-parse", "--show-toplevel"]);
  if (!root) {
    return { repoPath: cwd, branch: NO_GIT_BRANCH, isGit: false };
  }

  const branch = git(cwd, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (!branch || branch === "HEAD") {
    // Detached HEAD: key off the short commit SHA so the bucket is stable.
    const sha = git(cwd, ["rev-parse", "--short", "HEAD"]) || "unknown";
    return { repoPath: root, branch: `detached-${sha}`, isGit: true };
  }

  return { repoPath: root, branch, isGit: true };
}
