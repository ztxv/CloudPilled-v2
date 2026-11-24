import { DOMAINS, EXAM, QUESTIONS, domainMix, type DomainId, type Question } from '../content';
import { type Rng, makeRng, newId, shuffle } from './random';
import { optionOrder } from './scoring';
import type { AppState, MockSession, PracticeMode, PracticeSession } from './types';

export interface PracticeOptions {
  domain: DomainId | 'all';
  task?: string;
  mode: PracticeMode;
  count: number;
}

const poolFor = (opts: Pick<PracticeOptions, 'domain' | 'task'>, bank: Question[]): Question[] =>
  bank.filter((q) => (opts.domain === 'all' || q.domain === opts.domain) && (!opts.task || q.task === opts.task));

/** How much a question deserves attention right now. Higher = sooner. */
export function priority(q: Question, state: AppState): number {
  const s = state.q[q.id];
  if (!s) return 2; // unseen
  if (!s.last) return 4; // missed most recently
  const acc = s.seen ? s.correct / s.seen : 1;
  return acc < 0.6 ? 3 : 0.5;
}

export function missedIds(state: AppState): string[] {
  return Object.entries(state.q)
    .filter(([, s]) => !s.last)
    .sort((a, b) => b[1].at - a[1].at)
    .map(([id]) => id)
    .filter((id) => QUESTIONS.some((q) => q.id === id));
}

export function labelFor(opts: PracticeOptions): string {
  const scope = opts.task ? `Task ${opts.task}` : opts.domain === 'all' ? 'All domains' : `Domain ${opts.domain}`;
  const kind = opts.mode === 'missed' ? 'Missed questions' : opts.mode === 'weak' ? 'Focus on weak spots' : 'Practice set';
  return `${kind} · ${scope}`;
}

export function buildPractice(opts: PracticeOptions, state: AppState, rng: Rng = makeRng(Date.now()), bank: Question[] = QUESTIONS): PracticeSession | null {
  let pool = poolFor(opts, bank);
  if (opts.mode === 'missed') {
    const missed = new Set(missedIds(state));
    pool = pool.filter((q) => missed.has(q.id));
  }
  if (pool.length === 0) return null;

  let chosen: Question[];
  if (opts.mode === 'mixed' && opts.domain === 'all' && !opts.task) {
    // Follow the exam's domain weighting, preferring questions the learner has not seen.
    const mix = domainMix(Math.min(opts.count, pool.length));
    chosen = DOMAINS.flatMap((d) => pickByPriority(pool.filter((q) => q.domain === d.id), mix[d.id], state, rng, false));
    if (chosen.length < Math.min(opts.count, pool.length)) {
      const have = new Set(chosen.map((q) => q.id));
      chosen = chosen.concat(pickByPriority(pool.filter((q) => !have.has(q.id)), opts.count - chosen.length, state, rng, false));
    }
  } else {
    chosen = pickByPriority(pool, opts.count, state, rng, opts.mode === 'weak');
  }
  chosen = shuffle(chosen, rng);

  return {
    id: newId('p'),
    startedAt: Date.now(),
    label: labelFor(opts),
    mode: opts.mode,
    domain: opts.domain,
    ...(opts.task ? { task: opts.task } : {}),
    questionIds: chosen.map((q) => q.id),
    order: Object.fromEntries(chosen.map((q) => [q.id, optionOrder(q, rng)])),
    answers: {},
    checked: {},
    index: 0,
  };
}

/** Prefer higher priority (weak first) or, when `useWeak` is off, simply unseen-before-seen. */
function pickByPriority(pool: Question[], n: number, state: AppState, rng: Rng, useWeak: boolean): Question[] {
  const scored = pool.map((q) => {
    const s = state.q[q.id];
    const base = useWeak ? priority(q, state) : s ? 0 : 1;
    return { q, score: base + rng() * 0.9 };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.q);
}

export const MOCK_SIZES = {
  mock: EXAM.totalQuestions,
  mini: 20,
} as const;

export const mockMinutes = (kind: 'mini' | 'mock'): number =>
  kind === 'mock' ? EXAM.minutes : Math.round((EXAM.minutes * MOCK_SIZES.mini) / EXAM.totalQuestions);

export interface MockPlan {
  questions: Question[];
  /** Questions the bank could not supply for the requested domain mix. */
  shortfall: number;
}

export function planMock(kind: 'mini' | 'mock', state: AppState, rng: Rng, bank: Question[] = QUESTIONS): MockPlan {
  const want = MOCK_SIZES[kind];
  const mix = domainMix(want);
  const picked: Question[] = [];
  for (const d of DOMAINS) {
    picked.push(...pickByPriority(bank.filter((q) => q.domain === d.id), mix[d.id], state, rng, false));
  }
  let shortfall = want - picked.length;
  if (shortfall > 0) {
    const have = new Set(picked.map((q) => q.id));
    const extra = pickByPriority(bank.filter((q) => !have.has(q.id)), shortfall, state, rng, false);
    picked.push(...extra);
    shortfall = want - picked.length;
  }
  return { questions: shuffle(picked, rng), shortfall: Math.max(0, shortfall) };
}

export function buildMock(kind: 'mini' | 'mock', state: AppState, rng: Rng = makeRng(Date.now()), bank: Question[] = QUESTIONS): MockSession {
  const { questions } = planMock(kind, state, rng, bank);
  return {
    id: newId('m'),
    kind,
    startedAt: Date.now(),
    durationMs: mockMinutes(kind) * 60_000,
    questionIds: questions.map((q) => q.id),
    order: Object.fromEntries(questions.map((q) => [q.id, optionOrder(q, rng)])),
    answers: {},
    flagged: [],
    index: 0,
  };
}
