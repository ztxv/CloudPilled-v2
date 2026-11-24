import { DOMAINS, questionById, type DomainId, type Question } from '../content';
import { ymd } from './dates';
import { newId } from './random';
import { isCorrect } from './scoring';
import { defaultState, getState, replaceState, sanitize, update } from './store';
import type { AppState, DomainTally, MockSession, PracticeSession, SessionResult, SrsCard, ThemePref } from './types';

const bump = (s: AppState, n = 1): AppState => {
  const k = ymd();
  return { ...s, activity: { ...s.activity, [k]: (s.activity[k] ?? 0) + n } };
};

const emptyByDomain = (): Record<DomainId, DomainTally> =>
  Object.fromEntries(DOMAINS.map((d) => [d.id, { total: 0, correct: 0 }])) as Record<DomainId, DomainTally>;

function recordAttempt(s: AppState, q: Question, ok: boolean): AppState {
  const prev = s.q[q.id];
  return {
    ...s,
    q: { ...s.q, [q.id]: { seen: (prev?.seen ?? 0) + 1, correct: (prev?.correct ?? 0) + (ok ? 1 : 0), last: ok, at: Date.now() } },
  };
}

// ───────── lessons ─────────
export const openLesson = (id: string) =>
  update((s) => {
    const cur = s.lessons[id];
    if (cur) return s;
    return { ...s, lessons: { ...s.lessons, [id]: { opened: Date.now(), checks: {} } } };
  });

export const setLessonDone = (id: string, done: boolean) =>
  update((s) => {
    const cur = s.lessons[id] ?? { opened: Date.now(), checks: {} };
    const next = { ...cur };
    if (done) next.done = Date.now();
    else delete next.done;
    const out = { ...s, lessons: { ...s.lessons, [id]: next } };
    return done && !cur.done ? bump(out) : out;
  });

export const answerCheck = (lessonId: string, qid: string, ok: boolean) =>
  update((s) => {
    const cur = s.lessons[lessonId] ?? { opened: Date.now(), checks: {} };
    return bump({ ...s, lessons: { ...s.lessons, [lessonId]: { ...cur, checks: { ...cur.checks, [qid]: ok } } } });
  });

export const resetChecks = (lessonId: string) =>
  update((s) => {
    const cur = s.lessons[lessonId];
    return cur ? { ...s, lessons: { ...s.lessons, [lessonId]: { ...cur, checks: {} } } } : s;
  });

// ───────── practice ─────────
export const startPractice = (session: PracticeSession) => update((s) => ({ ...s, practice: session }));

export const pickPractice = (qid: string, picked: number[]) =>
  update((s) => (s.practice && !s.practice.checked[qid] ? { ...s, practice: { ...s.practice, answers: { ...s.practice.answers, [qid]: picked } } } : s));

export function checkPractice(qid: string): void {
  update((s) => {
    const p = s.practice;
    const q = questionById(qid);
    if (!p || !q || p.checked[qid]) return s;
    const ok = isCorrect(q, p.answers[qid] ?? []);
    return bump(recordAttempt({ ...s, practice: { ...p, checked: { ...p.checked, [qid]: true } } }, q, ok));
  });
}

export const setPracticeIndex = (index: number) => update((s) => (s.practice ? { ...s, practice: { ...s.practice, index } } : s));

export const abandonPractice = () => update((s) => ({ ...s, practice: null }));

export function finishPractice(): SessionResult | null {
  const s = getState();
  const p = s.practice;
  if (!p) return null;
  const byDomain = emptyByDomain();
  const missed: string[] = [];
  let correct = 0;
  let total = 0;
  for (const id of p.questionIds) {
    if (!p.checked[id]) continue;
    const q = questionById(id);
    if (!q) continue;
    const ok = isCorrect(q, p.answers[id] ?? []);
    total++;
    byDomain[q.domain].total++;
    if (ok) {
      correct++;
      byDomain[q.domain].correct++;
    } else missed.push(id);
  }
  const result: SessionResult = {
    id: p.id,
    kind: 'practice',
    at: Date.now(),
    label: p.label,
    total,
    correct,
    unanswered: p.questionIds.length - total,
    byDomain,
    missed,
    durationMs: Date.now() - p.startedAt,
    questionIds: p.questionIds,
    answers: p.answers,
  };
  update((cur) => ({ ...cur, practice: null, results: [...cur.results, result].slice(-60) }));
  return result;
}

// ───────── mock exams ─────────
export const startMock = (session: MockSession) => update((s) => ({ ...s, mock: session }));

export const pickMock = (qid: string, picked: number[]) =>
  update((s) => (s.mock ? { ...s, mock: { ...s.mock, answers: { ...s.mock.answers, [qid]: picked } } } : s));

export const toggleFlag = (qid: string) =>
  update((s) => {
    if (!s.mock) return s;
    const has = s.mock.flagged.includes(qid);
    return { ...s, mock: { ...s.mock, flagged: has ? s.mock.flagged.filter((x) => x !== qid) : [...s.mock.flagged, qid] } };
  });

export const setMockIndex = (index: number) => update((s) => (s.mock ? { ...s, mock: { ...s.mock, index } } : s));

export const abandonMock = () => update((s) => ({ ...s, mock: null }));

export function submitMock(timedOut = false): SessionResult | null {
  const s = getState();
  const m = s.mock;
  if (!m) return null;
  const byDomain = emptyByDomain();
  const missed: string[] = [];
  let correct = 0;
  let unanswered = 0;
  let next = s;
  for (const id of m.questionIds) {
    const q = questionById(id);
    if (!q) continue;
    const picked = m.answers[id] ?? [];
    byDomain[q.domain].total++;
    if (picked.length === 0) {
      unanswered++;
      missed.push(id);
      continue;
    }
    const ok = isCorrect(q, picked);
    next = recordAttempt(next, q, ok);
    if (ok) {
      correct++;
      byDomain[q.domain].correct++;
    } else missed.push(id);
  }
  const result: SessionResult = {
    id: m.id,
    kind: m.kind,
    at: Date.now(),
    label: m.kind === 'mock' ? 'Full-length mock exam' : 'Mini mock',
    total: m.questionIds.length,
    correct,
    unanswered,
    byDomain,
    missed,
    durationMs: Math.min(Date.now() - m.startedAt, m.durationMs),
    questionIds: m.questionIds,
    answers: m.answers,
    ...(timedOut ? { timedOut: true } : {}),
  };
  update(() => bump({ ...next, mock: null, results: [...next.results, result].slice(-60) }, m.questionIds.length - unanswered));
  return result;
}

// ───────── atlas / flashcards ─────────
export const toggleKnown = (id: string) =>
  update((s) => ({ ...s, atlas: { ...s.atlas, known: s.atlas.known.includes(id) ? s.atlas.known.filter((x) => x !== id) : [...s.atlas.known, id] } }));

export type CardRating = 'again' | 'good' | 'easy';

export function nextSrs(prev: SrsCard | undefined, rating: CardRating, now: number): SrsCard {
  const interval = rating === 'again' ? 1 : rating === 'easy' ? Math.max(4, Math.ceil((prev?.interval ?? 1) * 2.8)) : Math.max(2, Math.ceil((prev?.interval ?? 1) * 2));
  // "Again" comes back within the same sitting; others are scheduled in days.
  const due = rating === 'again' ? now + 10 * 60_000 : now + interval * 86_400_000;
  return { due, interval, reps: (prev?.reps ?? 0) + 1 };
}

export const rateCard = (id: string, rating: CardRating) =>
  update((s) => {
    const card = nextSrs(s.atlas.srs[id], rating, Date.now());
    const known = rating === 'again' ? s.atlas.known.filter((x) => x !== id) : s.atlas.known.includes(id) ? s.atlas.known : [...s.atlas.known, id];
    return bump({ ...s, atlas: { known, srs: { ...s.atlas.srs, [id]: card } } });
  });

// ───────── prefs, navigation memory, data ─────────
export const setTheme = (theme: ThemePref) => update((s) => ({ ...s, prefs: { ...s.prefs, theme } }));
export const setDailyGoal = (n: number) => update((s) => ({ ...s, prefs: { ...s.prefs, dailyGoal: Math.min(200, Math.max(1, Math.round(n) || 10)) } }));
export const rememberPath = (path: string) => update((s) => ({ ...s, last: { path, at: Date.now() } }));
export const resetProgress = () => replaceState({ ...defaultState(), prefs: getState().prefs });

export const exportData = (): string => JSON.stringify({ app: 'CloudPilled', exportedAt: new Date().toISOString(), data: getState() }, null, 2);

export function importData(text: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(text);
    const data = parsed?.data ?? parsed;
    if (!data || typeof data !== 'object' || data.v !== 2) return { ok: false, error: 'This file is not a CloudPilled v2 export.' };
    replaceState(sanitize(data));
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not read that file as JSON.' };
  }
}

export const newSessionId = (p: string) => newId(p);
