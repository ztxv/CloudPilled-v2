import { DOMAINS, LESSONS, QUESTIONS, TASKS, lessonsForDomain, questionsForDomain, questionsForTask, type DomainId } from '../content';
import { currentStreak, longestStreak, ymd } from './dates';
import { missedIds } from './sessions';
import type { AppState, QStat } from './types';

export type Readiness = 'new' | 'building' | 'solid' | 'weak';

export interface Tally {
  bank: number;
  seen: number; // distinct questions attempted
  attempts: number;
  correct: number;
  accuracy: number | null; // 0..100, null until there is data
  readiness: Readiness;
  missed: number;
}

const MIN_ATTEMPTS = 5;

function tally(ids: string[], q: Record<string, QStat>): Tally {
  let seen = 0;
  let attempts = 0;
  let correct = 0;
  let missed = 0;
  for (const id of ids) {
    const s = q[id];
    if (!s || s.seen === 0) continue;
    seen++;
    attempts += s.seen;
    correct += s.correct;
    if (!s.last) missed++;
  }
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : null;
  let readiness: Readiness = 'new';
  if (attempts >= MIN_ATTEMPTS && accuracy !== null) readiness = accuracy >= 80 ? 'solid' : accuracy >= 60 ? 'building' : 'weak';
  else if (attempts > 0) readiness = 'building';
  return { bank: ids.length, seen, attempts, correct, accuracy, readiness, missed };
}

export const domainTally = (state: AppState, d: DomainId): Tally => tally(questionsForDomain(d).map((x) => x.id), state.q);
export const taskTally = (state: AppState, task: string): Tally => tally(questionsForTask(task).map((x) => x.id), state.q);

export const lessonDone = (state: AppState, id: string): boolean => !!state.lessons[id]?.done;

export function domainLessonProgress(state: AppState, d: DomainId): { done: number; total: number } {
  const ls = lessonsForDomain(d);
  return { done: ls.filter((l) => lessonDone(state, l.id)).length, total: ls.length };
}

export function overall(state: AppState) {
  const done = LESSONS.filter((l) => lessonDone(state, l.id)).length;
  const t = tally(QUESTIONS.map((x) => x.id), state.q);
  return { lessonsDone: done, lessonsTotal: LESSONS.length, ...t };
}

export function nextLesson(state: AppState) {
  return LESSONS.find((l) => !lessonDone(state, l.id));
}

/** Domain with the lowest accuracy among those with enough data, weighted toward bigger domains on ties. */
export function weakestDomain(state: AppState): { domain: DomainId; tally: Tally } | null {
  const rows = DOMAINS.map((d) => ({ domain: d.id, tally: domainTally(state, d.id), weight: d.weight }))
    .filter((r) => r.tally.accuracy !== null && r.tally.attempts >= MIN_ATTEMPTS)
    .sort((a, b) => (a.tally.accuracy ?? 100) - (b.tally.accuracy ?? 100) || b.weight - a.weight);
  const first = rows[0];
  return first && (first.tally.accuracy ?? 100) < 80 ? { domain: first.domain, tally: first.tally } : null;
}

/** Domain with no or very little practice, used to suggest a first practice set. */
export function leastPracticedDomain(state: AppState): DomainId {
  const rows = DOMAINS.map((d) => ({ id: d.id, attempts: domainTally(state, d.id).attempts, weight: d.weight })).sort(
    (a, b) => a.attempts / a.weight - b.attempts / b.weight,
  );
  return (rows[0]?.id ?? 1) as DomainId;
}

export function todayCount(state: AppState): number {
  return state.activity[ymd()] ?? 0;
}

export const streak = (state: AppState) => ({ current: currentStreak(state.activity), longest: longestStreak(state.activity) });

export const missedCount = (state: AppState): number => missedIds(state).length;

export function taskRows(state: AppState) {
  return TASKS.map((t) => {
    const lessons = LESSONS.filter((l) => l.tasks.includes(t.id));
    return {
      task: t,
      lessonsDone: lessons.filter((l) => lessonDone(state, l.id)).length,
      lessonsTotal: lessons.length,
      tally: taskTally(state, t.id),
    };
  });
}

export const hasAnyActivity = (state: AppState): boolean =>
  Object.keys(state.lessons).length > 0 || Object.keys(state.q).length > 0 || state.results.length > 0 || !!state.practice || !!state.mock;
