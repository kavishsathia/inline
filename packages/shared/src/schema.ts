/** Current on-disk schema version for a comment store file. */
export const STORE_VERSION = 1 as const;

/**
 * A single piece of agent commentary anchored to a line in a file.
 *
 * Anchoring is content-first: `anchorText` (and its hash) let the renderer
 * relocate the comment if the line moved, with `line` as the fallback.
 */
export interface Comment {
  /** Stable unique id (uuid v4). */
  id: string;
  /** Repo-relative POSIX path of the file the comment is on. */
  file: string;
  /** 1-based line number at creation time — fallback anchor. */
  line: number;
  /** Exact text of the anchored line at creation time. */
  anchorText: string;
  /** sha256(anchorText)[:16] — cheap equality check for relocation. */
  anchorHash: string;
  /** The comment body (markdown allowed). */
  body: string;
  /** Who left it — e.g. "agent", or a tool/model name. */
  author: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** Git branch the comment was created on (sanity / debugging). */
  branch: string;
}

/** The contents of a single `comments.json` store file. */
export interface CommentStore {
  version: typeof STORE_VERSION;
  /** Absolute repo root this store belongs to (debugging aid). */
  repoPath: string;
  /** Branch this store is scoped to. */
  branch: string;
  comments: Comment[];
}

/** A fresh, empty store for a given repo + branch. */
export function emptyStore(repoPath: string, branch: string): CommentStore {
  return { version: STORE_VERSION, repoPath, branch, comments: [] };
}
