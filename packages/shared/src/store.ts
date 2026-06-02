import * as fs from "fs";
import * as path from "path";
import { Comment, CommentStore, emptyStore } from "./schema";
import { indexFile, inlineHome, repoHash, storeFile } from "./paths";

/** Read a store for a repo+branch, returning an empty one if none exists. */
export function readStore(repoPath: string, branch: string): CommentStore {
  const file = storeFile(repoPath, branch);
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw) as CommentStore;
    if (!Array.isArray(parsed.comments)) return emptyStore(repoPath, branch);
    return parsed;
  } catch {
    return emptyStore(repoPath, branch);
  }
}

/** Atomically write a store, creating parent dirs and updating the index. */
export function writeStore(store: CommentStore): void {
  const file = storeFile(store.repoPath, store.branch);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  // Atomic replace: write to a temp file in the same dir, then rename.
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
  fs.renameSync(tmp, file);

  updateIndex(store.repoPath);
}

/** Append a comment to the appropriate store. Returns the saved store. */
export function addComment(repoPath: string, branch: string, comment: Comment): CommentStore {
  const store = readStore(repoPath, branch);
  store.comments.push(comment);
  writeStore(store);
  return store;
}

/** Maintain repoHash -> repoPath so the data dir is human-debuggable. */
function updateIndex(repoPath: string): void {
  const idxFile = indexFile();
  let index: Record<string, { repoPath: string; lastSeen: string }> = {};
  try {
    index = JSON.parse(fs.readFileSync(idxFile, "utf8"));
  } catch {
    // first write — start fresh
  }
  index[repoHash(repoPath)] = { repoPath, lastSeen: new Date().toISOString() };
  fs.mkdirSync(inlineHome(), { recursive: true });
  fs.writeFileSync(idxFile, JSON.stringify(index, null, 2));
}
