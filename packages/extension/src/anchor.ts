import type { Comment } from "@inline/shared";

export interface Resolved {
  /** 0-based line index in the current document. */
  index: number;
  /** True when relocated away from the original line number. */
  relocated: boolean;
  /** True when nothing matched well enough — fell back to the raw number. */
  drifted: boolean;
  /** Match score of the chosen line (diagnostics; higher is better). */
  score: number;
}

// Scoring weights. A line matching exactly counts double a whitespace-only
// (trimmed) match; the anchor line itself weighs more than a context line.
const EXACT = 2;
const TRIMMED = 1;
const ANCHOR_WEIGHT = 3;

/** Minimum context score to accept a relocation when the anchor line itself
 *  no longer matches (≈ two surrounding lines). Guards against coincidence. */
const CONTEXT_CONFIDENCE = 3;

/** Similarity of two lines: exact > trimmed-equal > nothing. */
function lineSim(a: string | undefined, b: string | undefined): number {
  if (a === undefined || b === undefined) return 0;
  if (a === b) return EXACT;
  const ta = a.trim();
  if (ta !== "" && ta === b.trim()) return TRIMMED;
  return 0;
}

/**
 * Decide which line a comment points at *now*, using the surrounding context
 * captured at comment time. Strategy:
 *
 *   - Score every line as a candidate anchor: the anchor line (weighted) plus
 *     each captured context line aligned to its expected offset.
 *   - Pick the highest score, tie-breaking toward the original line number.
 *   - Accept it if the anchor line matched, or enough context matched; else
 *     fall back to the original line number and flag drift.
 *
 * Comments without captured context degrade gracefully to anchor-line matching.
 */
export function resolveAnchor(comment: Comment, lines: string[]): Resolved {
  const orig = comment.line - 1; // to 0-based
  const before = comment.contextBefore ?? [];
  const after = comment.contextAfter ?? [];

  /** Score for placing the anchor at candidate index `i`. */
  const scoreAt = (i: number): number => {
    let s = ANCHOR_WEIGHT * lineSim(lines[i], comment.anchorText);
    // contextBefore is in file order, so its last element sits directly above.
    for (let j = 1; j <= before.length; j++) {
      s += lineSim(lines[i - j], before[before.length - j]);
    }
    // contextAfter's first element sits directly below.
    for (let j = 1; j <= after.length; j++) {
      s += lineSim(lines[i + j], after[j - 1]);
    }
    return s;
  };

  let best = -1;
  let bestScore = -Infinity;
  let bestDist = Infinity;
  for (let i = 0; i < lines.length; i++) {
    const s = scoreAt(i);
    const dist = Math.abs(i - orig);
    if (s > bestScore || (s === bestScore && dist < bestDist)) {
      best = i;
      bestScore = s;
      bestDist = dist;
    }
  }

  if (best !== -1) {
    const anchorMatched = lineSim(lines[best], comment.anchorText) > 0;
    const contextScore = bestScore - (anchorMatched ? ANCHOR_WEIGHT * lineSim(lines[best], comment.anchorText) : 0);
    if (anchorMatched || contextScore >= CONTEXT_CONFIDENCE) {
      return { index: best, relocated: best !== orig, drifted: false, score: bestScore };
    }
  }

  // Nothing matched confidently — keep the original line number, clamped.
  const clamped = Math.min(Math.max(orig, 0), Math.max(0, lines.length - 1));
  return { index: clamped, relocated: false, drifted: true, score: best === -1 ? 0 : bestScore };
}
