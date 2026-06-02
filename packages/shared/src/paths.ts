import * as crypto from "crypto";
import * as os from "os";
import * as path from "path";

/** Root of the inline data dir. Override with $INLINE_HOME (handy for tests). */
export function inlineHome(): string {
  return process.env.INLINE_HOME || path.join(os.homedir(), ".inline");
}

/** Short, stable, filesystem-safe key for an absolute repo path. */
export function repoHash(repoPath: string): string {
  const normalized = path.resolve(repoPath);
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

/** sha256(text)[:16] — used for line anchor equality checks. */
export function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/**
 * Turn a git ref into a filesystem-safe slug.
 * "feature/foo" -> "feature__foo", detached HEAD -> "detached-<sha>".
 */
export function branchSlug(branch: string): string {
  const slug = branch.replace(/[^A-Za-z0-9._-]/g, "__");
  return slug || "__unknown__";
}

/** Bucket used when a directory isn't inside a git repo at all. */
export const NO_GIT_BRANCH = "__no-git__";

/** Absolute path to the directory holding one project+branch's store. */
export function storeDir(repoPath: string, branch: string): string {
  return path.join(inlineHome(), "projects", repoHash(repoPath), branchSlug(branch));
}

/** Absolute path to the comments.json for a project+branch. */
export function storeFile(repoPath: string, branch: string): string {
  return path.join(storeDir(repoPath, branch), "comments.json");
}

/** Absolute path to the reverse-lookup index (repoHash -> repoPath). */
export function indexFile(): string {
  return path.join(inlineHome(), "index.json");
}
