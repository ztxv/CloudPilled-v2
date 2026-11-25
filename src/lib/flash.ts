import { TASKS, taskById } from '../content';
import { CARD_BY_ID, DECK, familiarity, filterDeck, isDue, type DeckFilter, type Flashcard } from './deck';
import { taskTally } from './progress';
import { missedIds } from './sessions';
import { questionById } from '../content';
import { type Rng, makeRng, newId, shuffle } from './random';
import type { AppState, FlashDirection, FlashMode, FlashRating, FlashSession, SrsCard } from './types';

const DAY = 86_400_000;
const AGAIN_DELAY = 10 * 60_000;
export const DEFAULT_EASE = 2.2;

/**
 * Next review state for a card.
 * Again: back in ~10 minutes, interval resets, ease drops. Hard: small step. Good: grows by the ease factor.
 * Easy: grows faster and nudges ease up. First reviews keep v1's steps (good: 2 days, easy: 4 days).
 */
export function nextSrs(prev: SrsCard | undefined, rating: FlashRating, now: number): SrsCard {
  const ease0 = prev?.ease ?? DEFAULT_EASE;
  const p = prev?.interval ?? 0;
  let interval: number;
  let ease = ease0;
  let lapses = prev?.lapses ?? 0;
  switch (rating) {
    case 'again':
      interval = 1;
      ease = Math.max(1.3, ease0 - 0.2);
      lapses += 1;
      break;
    case 'hard':
      interval = p ? Math.max(1, Math.ceil(p * 1.2)) : 1;
      ease = Math.max(1.3, ease0 - 0.1);
      break;
    case 'good':
      interval = p ? Math.max(2, Math.ceil(p * ease0)) : 2;
      break;
    case 'easy':
      interval = p ? Math.max(4, Math.ceil(p * ease0 * 1.3)) : 4;
      ease = Math.min(3, ease0 + 0.1);
      break;
  }
  const due = rating === 'again' ? now + AGAIN_DELAY : now + interval * DAY;
  return { due, interval, reps: (prev?.reps ?? 0) + 1, ease, lapses, last: rating, at: now };
}

/** The label on a rating button: when the card would come back. */
export function previewLabel(prev: SrsCard | undefined, rating: FlashRating): string {
  if (rating === 'again') return '10 min';
  const d = nextSrs(prev, rating, 0).interval;
  return d === 1 ? '1 day' : d < 30 ? `${d} days` : `${Math.round(d / 30)} mo`;
}

/** Extra attention for tasks where practice questions are going badly. */
export function taskWeakness(state: AppState): Record<string, number> {
  const missed = missedIds(state);
  const out: Record<string, number> = {};
  for (const t of TASKS) {
    const tally = taskTally(state, t.id);
    let w = 0;
    if (tally.attempts >= 3 && tally.accuracy !== null) w += tally.accuracy < 60 ? 1.5 : tally.accuracy < 80 ? 0.7 : 0;
    const m = missed.filter((id) => questionById(id)?.task === t.id).length;
    w += Math.min(2, m) * 0.5;
    out[t.id] = w;
  }
  return out;
}

/** How much a card deserves to be shown right now. */
export function smartScore(card: Flashcard, state: AppState, weak: Record<string, number>, now: number): number {
  const s = state.atlas.srs[card.id];
  const known = state.atlas.known.includes(card.id);
  const topic = Math.max(0, ...card.tasks.map((t) => weak[t] ?? 0));
  let score: number;
  if (!s || s.reps === 0) {
    score = 3; // never seen
  } else if (isDue(s, now)) {
    const overdueDays = Math.min(7, (now - s.due) / DAY);
    score = 2.5 + overdueDays * 0.15;
  } else {
    score = 0.3; // scheduled for later: only shown for reinforcement
  }
  if (s) {
    score += Math.min(3, s.lapses ?? 0) * 0.8;
    if (s.last === 'again' && now - (s.at ?? 0) < DAY) score += 1.5;
    if (s.last === 'hard') score += 0.5;
    if (familiarity(s) === 'mastered') score *= 0.5;
  }
  score += topic;
  if (known && (!s || !isDue(s, now))) score *= 0.25;
  return score;
}

export interface FlashOptions {
  mode: FlashMode;
  filter: DeckFilter;
  size: number;
  direction: FlashDirection;
  shuffle: boolean;
  /** Browse mode: skip cards marked "I know this". */
  hideKnown: boolean;
}

export const modeLabel = (m: FlashMode): string => (m === 'smart' ? 'Smart flashcards' : m === 'due' ? 'Review due' : 'Browse deck');

function pickSmart(pool: Flashcard[], size: number, state: AppState, rng: Rng, now: number): Flashcard[] {
  const weak = taskWeakness(state);
  const scored = pool
    .map((c) => {
      const base = smartScore(c, state, weak, now);
      return { c, base, score: base + rng() * 0.9 };
    })
    .sort((a, b) => b.score - a.score);
  // Do not let brand-new cards crowd out everything else in one sitting.
  const newCap = Math.max(3, Math.ceil(size * 0.55));
  const picked: Flashcard[] = [];
  const skipped: Flashcard[] = [];
  const filler: Flashcard[] = [];
  let fresh = 0;
  for (const { c, base } of scored) {
    if (picked.length >= size) break;
    const isNew = !state.atlas.srs[c.id] || state.atlas.srs[c.id]?.reps === 0;
    if (isNew && fresh >= newCap) skipped.push(c);
    else if (!isNew && base < 1) filler.push(c); // comfortable and not due: only worth showing if nothing better is left
    else {
      picked.push(c);
      if (isNew) fresh++;
    }
  }
  for (const c of [...skipped, ...filler]) if (picked.length < size) picked.push(c);
  // Shuffle inside small windows: the hardest cards come early, but the order is not a flat ranking.
  const out: Flashcard[] = [];
  for (let i = 0; i < picked.length; i += 4) out.push(...shuffle(picked.slice(i, i + 4), rng));
  return out;
}

export function buildFlashSession(opts: FlashOptions, state: AppState, rng: Rng = makeRng(Date.now()), now: number = Date.now(), deck: Flashcard[] = DECK): FlashSession | null {
  const pool = filterDeck(opts.filter, deck);
  let cards: Flashcard[];
  if (opts.mode === 'smart') {
    cards = pickSmart(pool, opts.size, state, rng, now);
  } else if (opts.mode === 'due') {
    cards = pool
      .filter((c) => isDue(state.atlas.srs[c.id], now))
      .sort((a, b) => (state.atlas.srs[a.id]?.due ?? 0) - (state.atlas.srs[b.id]?.due ?? 0))
      .slice(0, opts.size);
  } else {
    const known = new Set(state.atlas.known);
    cards = pool.filter((c) => !(opts.hideKnown && known.has(c.id)));
    if (opts.shuffle) cards = shuffle(cards, rng);
  }
  if (cards.length === 0) return null;

  const reversed = cards.filter((c) => c.kind === 'service' && (opts.direction === 'reverse' || (opts.direction === 'mixed' && rng() < 0.5))).map((c) => c.id);
  return {
    id: newId('f'),
    mode: opts.mode,
    label: modeLabel(opts.mode),
    startedAt: now,
    queue: cards.map((c) => c.id),
    index: 0,
    reversed,
    requeues: {},
    stats: { again: 0, hard: 0, good: 0, easy: 0 },
    struggled: [],
    reviewed: [],
    tasks: [...new Set(cards.flatMap((c) => c.tasks))],
  };
}

/** Topics where the learner has the most to gain from flashcards, for the hub's "smart picks". */
export function weakTopics(state: AppState, now: number = Date.now(), limit = 3) {
  const weak = taskWeakness(state);
  const rows = TASKS.map((t) => {
    const cards = DECK.filter((c) => c.tasks.includes(t.id));
    let fresh = 0;
    let due = 0;
    let shaky = 0;
    for (const c of cards) {
      const s = state.atlas.srs[c.id];
      if (!s || s.reps === 0) fresh++;
      else {
        if (isDue(s, now)) due++;
        if ((s.lapses ?? 0) > 0 || s.last === 'again') shaky++;
      }
    }
    const need = cards.length ? (fresh * 1 + due * 1.2 + shaky * 1.5) / cards.length : 0;
    return { task: t, cards: cards.length, fresh, due, shaky, score: need + (weak[t.id] ?? 0) * 0.6 };
  })
    .filter((r) => r.cards > 0 && r.score > 0.05)
    .sort((a, b) => b.score - a.score);
  return rows.slice(0, limit);
}

export const cardOf = (id: string | undefined): Flashcard | undefined => (id ? CARD_BY_ID.get(id) : undefined);
export const taskTitle = (id: string): string => taskById(id)?.title ?? id;
