import * as vscode from "vscode";
import { FolderManager } from "./manager";

let controller: vscode.CommentController | undefined;
const managers = new Map<string, FolderManager>();

export function activate(context: vscode.ExtensionContext): void {
  controller = vscode.comments.createCommentController("inline", "inline");
  context.subscriptions.push(controller);

  const sync = () => syncManagers(controller!);
  sync();

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(sync),
    vscode.commands.registerCommand("inline.refresh", () => {
      for (const m of managers.values()) m.reload();
    }),
    new vscode.Disposable(() => disposeAll())
  );
}

/** Create a FolderManager per workspace folder; drop ones that went away. */
function syncManagers(ctrl: vscode.CommentController): void {
  const folders = vscode.workspace.workspaceFolders ?? [];
  const present = new Set(folders.map((f) => f.uri.toString()));

  for (const [key, mgr] of managers) {
    if (!present.has(key)) {
      mgr.dispose();
      managers.delete(key);
    }
  }

  for (const folder of folders) {
    const key = folder.uri.toString();
    if (!managers.has(key)) {
      managers.set(key, new FolderManager(folder, ctrl));
    }
  }
}

function disposeAll(): void {
  for (const m of managers.values()) m.dispose();
  managers.clear();
}

export function deactivate(): void {
  disposeAll();
}
