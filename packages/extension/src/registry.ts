import * as vscode from "vscode";

/** Enough to locate the stored comment a thread was rendered from. */
export interface ThreadRef {
  repoPath: string;
  branch: string;
  commentId: string;
}

/**
 * Maps a live CommentThread back to its source comment, so editor actions
 * (e.g. dismiss) can find what to remove from the store. WeakMap so entries
 * vanish when threads are disposed on re-render.
 */
export const threadRefs = new WeakMap<vscode.CommentThread, ThreadRef>();
