import type { Question } from '../content';
import { type Rng, shuffle } from './random';

/** Indexes of the correct options. */
export const correctIndexes = (q: Question): number[] =>
  q.options.flatMap((o, i) => (o.correct ? [i] : []));

/**
 * A response is correct only if the picked set exactly equals the correct set.
 * Multiple-response items have no partial credit (the exam guide does not describe any).
 */
export function isCorrect(q: Question, picked: readonly number[]): boolean {
  const want = correctIndexes(q);
  const got = [...new Set(picked)];
  return want.length === got.length && want.every((i) => got.includes(i));
}

/** A random display order for options, as indexes into q.options. */
export const optionOrder = (q: Question, rng: Rng): number[] => shuffle(q.options.map((_, i) => i), rng);

export const requiredPicks = (q: Question): number => correctIndexes(q).length;

export const percent = (correct: number, total: number): number => (total === 0 ? 0 : Math.round((correct / total) * 100));
