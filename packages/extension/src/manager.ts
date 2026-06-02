import * as path from "path";
import * as vscode from "vscode";
import { readStore, resolveRepo, storeFile, RepoContext } from "@inline/shared";
import { renderComment } from "./render";

/**
 * Owns the inline comments for a single workspace folder: resolves the
 * repo+branch, renders the matching store, and reloads when either the store
 * file or the checked-out branch changes.
 */
export class FolderManager {
  private repo: RepoContext;
  private threads: vscode.CommentThread[] = [];
  private storeWatcher?: vscode.FileSystemWatcher;
  private readonly headWatcher?: vscode.FileSystemWatcher;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly folder: vscode.WorkspaceFolder,
    private readonly controller: vscode.CommentController
  ) {
    this.repo = resolveRepo(folder.uri.fsPath);

    // Watch .git/HEAD so switching branches swaps the active comment set.
    if (this.repo.isGit) {
      const headGlob = new vscode.RelativePattern(
        vscode.Uri.file(path.join(this.repo.repoPath, ".git")),
        "HEAD"
      );
      this.headWatcher = vscode.workspace.createFileSystemWatcher(headGlob);
      this.headWatcher.onDidChange(() => this.onBranchMaybeChanged());
      this.disposables.push(this.headWatcher);
    }

    this.reload();
  }

  /** Re-resolve branch, repoint the store watcher, and re-render. */
  reload(): void {
    this.repo = resolveRepo(this.folder.uri.fsPath);
    this.setupStoreWatcher();
    this.render();
  }

  private onBranchMaybeChanged(): void {
    const next = resolveRepo(this.folder.uri.fsPath);
    if (next.branch !== this.repo.branch) {
      this.reload();
    }
  }

  /** (Re)create the watcher bound to the current branch's store file. */
  private setupStoreWatcher(): void {
    this.storeWatcher?.dispose();
    const file = storeFile(this.repo.repoPath, this.repo.branch);
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(vscode.Uri.file(path.dirname(file)), path.basename(file))
    );
    watcher.onDidChange(() => this.render());
    watcher.onDidCreate(() => this.render());
    watcher.onDidDelete(() => this.render());
    this.storeWatcher = watcher;
  }

  /** Clear existing threads and rebuild from the store on disk. */
  private render(): void {
    this.clearThreads();
    const store = readStore(this.repo.repoPath, this.repo.branch);
    for (const c of store.comments) {
      const thread = renderComment(this.controller, this.repo.repoPath, c);
      if (thread) this.threads.push(thread);
    }
  }

  private clearThreads(): void {
    for (const t of this.threads) t.dispose();
    this.threads = [];
  }

  dispose(): void {
    this.clearThreads();
    this.storeWatcher?.dispose();
    for (const d of this.disposables) d.dispose();
  }
}
