import assert from "node:assert";
import type { Comment } from "@inline/shared";
import { resolveAnchor } from "../src/anchor";

const ORIGINAL = [
  "function fetchUser(id) {", // 0
  "  const res = retry(() => api.get(`/users/${id}`), 3);", // 1
  "  return res.body;", // 2
  "}", // 3
  "", // 4
  "function fetchOrg(id) {", // 5
  "  const res = retry(() => api.get(`/orgs/${id}`), 3);", // 6
  "  return res.body;", // 7
  "}", // 8
];

/** Build a comment anchored at a 1-based line of the ORIGINAL file. */
function commentAt(line: number, body = "note"): Comment {
  const idx = line - 1;
  return {
    id: "x",
    file: "app.js",
    line,
    anchorText: ORIGINAL[idx],
    anchorHash: "",
    contextBefore: ORIGINAL.slice(Math.max(0, idx - 3), idx),
    contextAfter: ORIGINAL.slice(idx + 1, idx + 4),
    body,
    author: "agent",
    createdAt: "now",
    branch: "main",
  };
}

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

// 1. Unchanged file: resolves to the exact original line.
check("unchanged file → exact line", () => {
  const c = commentAt(2);
  const r = resolveAnchor(c, ORIGINAL.slice());
  assert.equal(r.index, 1);
  assert.equal(r.relocated, false);
  assert.equal(r.drifted, false);
});

// 2. Lines inserted above: the anchor shifts down, relocated (not drifted).
check("insertions above → relocate down", () => {
  const c = commentAt(2);
  const lines = ["// new header", "// more", ...ORIGINAL];
  const r = resolveAnchor(c, lines);
  assert.equal(r.index, 3); // line 1 -> index 3 after two inserts
  assert.equal(r.relocated, true);
  assert.equal(r.drifted, false);
});

// 3. The anchor line itself is edited, but context is intact → relocate to it.
check("anchor line edited, context intact → relocate", () => {
  const c = commentAt(2);
  const lines = ORIGINAL.slice();
  lines[1] = "  const res = await retry(() => api.get(`/users/${id}`), 5); // edited";
  const r = resolveAnchor(c, lines);
  assert.equal(r.index, 1);
  assert.equal(r.drifted, false);
});

// 4. Duplicate line ("  return res.body;") disambiguated by context.
//    A comment on the SECOND occurrence must not snap to the first.
check("duplicate line disambiguated by context", () => {
  const c = commentAt(8); // the second "return res.body;"
  // Sanity: identical text exists at index 2 and 7.
  assert.equal(ORIGINAL[2], ORIGINAL[7]);
  const r = resolveAnchor(c, ORIGINAL.slice());
  assert.equal(r.index, 7);
});

// 5. The whole anchored block is removed → no confident match → drift fallback.
check("block deleted → drift fallback, clamped", () => {
  const c = commentAt(7);
  const lines = ["const unrelated = 1;", "export {};"];
  const r = resolveAnchor(c, lines);
  assert.equal(r.drifted, true);
  assert.ok(r.index >= 0 && r.index < lines.length);
});

// 6. Backward compat: a comment with no captured context still finds a unique
//    anchor line by content.
check("no-context comment → matches unique anchor", () => {
  const c = commentAt(1);
  delete c.contextBefore;
  delete c.contextAfter;
  const lines = ["// header", ...ORIGINAL];
  const r = resolveAnchor(c, lines);
  assert.equal(r.index, 1); // function fetchUser moved down by one
  assert.equal(r.drifted, false);
});

console.log(`\n${passed} anchor test(s) passed.`);
