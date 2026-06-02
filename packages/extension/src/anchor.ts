import { Comment, hashText } from "@inline/shared";

export interface Resolved {
  /** 0-based line index in the current document. */
  index: number;
  /** True when relocated by content rather than the raw line number. */
  relocated: boolean;
  /** True when neither content nor a valid line number matched. */
  drifted: boolean;
}

/**
 * Decide which line a comment points at *now*, given the file's current lines.
 *
 * Strategy (content-first, line fallback):
 *   1. If the original line still hashes to anchorHash, use it.
 *   2. Otherwise find the nearest line whose hash matches — handles inserts /
 *      deletions above the anchor.
 *   3. Otherwise fall back to the original line number, clamped, and flag drift.
 */
export function resolveAnchor(comment: Comment, lines: string[]): Resolved {
  const orig = comment.line - 1; // to 0-based
  const lastIndex = Math.max(0, lines.length - 1);

  // 1. exact line still matches
  if (orig >= 0 && orig < lines.length && hashText(lines[orig]) === comment.anchorHash) {
    return { index: orig, relocated: false, drifted: false };
  }

  // 2. nearest line with matching content
  const nearest = nearestMatch(lines, orig, comment.anchorHash);
  if (nearest !== -1) {
    return { index: nearest, relocated: true, drifted: false };
  }

  // 3. fall back to the original line number, clamped
  const clamped = Math.min(Math.max(orig, 0), lastIndex);
  return { index: clamped, relocated: false, drifted: true };
}

/** Find the line whose hash matches, closest to `from` (0-based). */
function nearestMatch(lines: string[], from: number, hash: string): number {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < lines.length; i++) {
    if (hashText(lines[i]) === hash) {
      const dist = Math.abs(i - from);
      if (dist < bestDist) {
        best = i;
        bestDist = dist;
      }
    }
  }
  return best;
}
