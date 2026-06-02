import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { Comment } from "@inline/shared";
import { resolveAnchor } from "./anchor";

/** Read a file's lines, preferring an open (possibly unsaved) document. */
function currentLines(absPath: string): string[] | null {
  const open = vscode.workspace.textDocuments.find(
    (d) => d.uri.scheme === "file" && d.uri.fsPath === absPath
  );
  if (open) return open.getText().split("\n");
  try {
    return fs.readFileSync(absPath, "utf8").split("\n");
  } catch {
    return null;
  }
}

/** Build a vscode.Comment view object from a stored comment. */
function toThreadComment(c: Comment): vscode.Comment {
  return {
    body: new vscode.MarkdownString(c.body),
    mode: vscode.CommentMode.Preview,
    author: { name: c.author },
    label: new Date(c.createdAt).toLocaleString(),
  };
}

/**
 * Create a CommentThread for one stored comment, relocating it to the line it
 * points at now. Returns undefined if the file no longer exists.
 */
export function renderComment(
  controller: vscode.CommentController,
  repoPath: string,
  c: Comment
): vscode.CommentThread | undefined {
  const abs = path.join(repoPath, c.file);
  const lines = currentLines(abs);
  if (lines === null) return undefined;

  const anchor = resolveAnchor(c, lines);
  const uri = vscode.Uri.file(abs);
  const range = new vscode.Range(anchor.index, 0, anchor.index, 0);

  const thread = controller.createCommentThread(uri, range, [toThreadComment(c)]);
  thread.canReply = false;
  thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
  thread.label = anchor.drifted ? "inline · line may have moved" : "inline";
  return thread;
}
