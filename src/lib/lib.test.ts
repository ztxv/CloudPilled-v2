import { beforeEach, describe, expect, it } from 'vitest';
import { DOMAINS, QUESTIONS, questionById, type Question } from '../content';
import { abandonMock, checkPractice, finishPractice, pickMock, pickPractice, setLessonDone, startMock, startPractice, submitMock, importData, exportData } from './actions';
import { currentStreak, longestStreak, ymd, addDays, formatClock } from './dates';
import { nextSrs } from './flash';
import { importLegacy } from './legacy';
import { nextStep } from './nextStep';
import { domainTally, missedCount, weakestDomain } from './progress';
import { makeRng } from './random';
import { correctIndexes, isCorrect } from './scoring';
import { MOCK_SIZES, buildMock, buildPractice, mockMinutes, planMock } from './sessions';
import { STORAGE_KEY, defaultState, getState, loadState, replaceState, sanitize } from './store';

const single = QUESTIONS.find((q) => q.type === 'single') as Question;
const multi = QUESTIONS.find((q) => q.type === 'multi') as Question;
const wrongIdx = (q: Question) => q.options.findIndex((o) => !o.correct);

beforeEach(() => {
  localStorage.clear();
  replaceState(defaultState());
});

describe('scoring', () => {
  it('scores single-answer questions', () => {
    expect(isCorrect(single, correctIndexes(single))).toBe(true);
    expect(isCorrect(single, [wrongIdx(single)])).toBe(false);
    expect(isCorrect(single, [])).toBe(false);
  });
  it('scores multiple-response questions all-or-nothing', () => {
    const right = correctIndexes(multi);
    expect(right.length).toBeGreaterThanOrEqual(2);
    expect(isCorrect(multi, right)).toBe(true);
    expect(isCorrect(multi, [...right].reverse())).toBe(true); // order does not matter
    expect(isCorrect(multi, right.slice(0, 1))).toBe(false); // partial
    expect(isCorrect(multi, [...right, wrongIdx(multi)])).toBe(false); // extra pick
    expect(isCorrect(multi, [right[0] as number, right[0] as number])).toBe(false); // duplicates do not count twice
  });
});

describe('session building', () => {
  it('draws a full mock in the published domain mix with no repeats', () => {
    const plan = planMock('mock', defaultState(), makeRng(7));
    expect(plan.shortfall).toBe(0);
    expect(plan.questions).toHaveLength(MOCK_SIZES.mock);
    expect(new Set(plan.questions.map((q) => q.id)).size).toBe(65);
    const byDomain = Object.fromEntries(DOMAINS.map((d) => [d.id, plan.questions.filter((q) => q.domain === d.id).length]));
    expect(byDomain).toEqual({ 1: 16, 2: 19, 3: 22, 4: 8 });
  });
  it('times a mini mock proportionally', () => {
    expect(mockMinutes('mock')).toBe(90);
    expect(mockMinutes('mini')).toBe(28);
    expect(buildMock('mini', defaultState(), makeRng(1)).questionIds).toHaveLength(20);
  });
  it('prefers unseen questions in mixed practice', () => {
    const s = defaultState();
    const seenIds = QUESTIONS.filter((q) => q.domain === 1).slice(0, 30).map((q) => q.id);
    for (const id of seenIds) s.q[id] = { seen: 1, correct: 1, last: true, at: 1 };
    const p = buildPractice({ domain: 1, mode: 'mixed', count: 5 }, s, makeRng(3));
    expect(p?.questionIds.every((id) => !seenIds.includes(id))).toBe(true);
  });
  it('puts missed questions first in weak-spot mode and only them in missed mode', () => {
    const s = defaultState();
    const missed = QUESTIONS.filter((q) => q.domain === 2).slice(0, 3).map((q) => q.id);
    for (const id of missed) s.q[id] = { seen: 2, correct: 0, last: false, at: 5 };
    const weak = buildPractice({ domain: 2, mode: 'weak', count: 3 }, s, makeRng(9));
    expect([...(weak?.questionIds ?? [])].sort()).toEqual([...missed].sort());
    const only = buildPractice({ domain: 'all', mode: 'missed', count: 10 }, s, makeRng(9));
    expect([...(only?.questionIds ?? [])].sort()).toEqual([...missed].sort());
    expect(buildPractice({ domain: 'all', mode: 'missed', count: 10 }, defaultState())).toBeNull();
  });
  it('scopes practice to a task statement', () => {
    const p = buildPractice({ domain: 3, task: '3.4', mode: 'mixed', count: 30 }, defaultState(), makeRng(2));
    expect(p?.questionIds.every((id) => questionById(id)?.task === '3.4')).toBe(true);
  });
  it('gives every question a permutation of its options', () => {
    const p = buildPractice({ domain: 'all', mode: 'mixed', count: 20 }, defaultState(), makeRng(11));
    for (const id of p?.questionIds ?? []) {
      const q = questionById(id) as Question;
      expect([...(p?.order[id] ?? [])].sort()).toEqual(q.options.map((_, i) => i));
    }
  });
});

describe('practice flow', () => {
  it('records attempts, builds a result, and feeds the missed queue', () => {
    const session = buildPractice({ domain: 'all', mode: 'mixed', count: 4 }, getState(), makeRng(5));
    expect(session).not.toBeNull();
    startPractice(session!);
    const [a, b] = session!.questionIds as [string, string];
    const qa = questionById(a) as Question;
    const qb = questionById(b) as Question;
    pickPractice(a, correctIndexes(qa));
    checkPractice(a);
    pickPractice(b, [wrongIdx(qb)]);
    checkPractice(b);
    expect(getState().q[a]).toMatchObject({ seen: 1, correct: 1, last: true });
    expect(getState().q[b]).toMatchObject({ seen: 1, correct: 0, last: false });
    expect(missedCount(getState())).toBe(1);
    // checking twice does not double count
    checkPractice(a);
    expect(getState().q[a]?.seen).toBe(1);
    const r = finishPractice();
    expect(r).toMatchObject({ total: 2, correct: 1 });
    expect(r?.missed).toEqual([b]);
    expect(getState().practice).toBeNull();
    expect(getState().results).toHaveLength(1);
    // answering the missed question correctly later removes it from the queue
    startPractice({ ...session!, id: 'again', answers: {}, checked: {}, questionIds: [b] });
    pickPractice(b, correctIndexes(qb));
    checkPractice(b);
    expect(missedCount(getState())).toBe(0);
  });
  it('ignores picks after a question is checked', () => {
    const session = buildPractice({ domain: 1, mode: 'mixed', count: 1 }, getState(), makeRng(1))!;
    startPractice(session);
    const id = session.questionIds[0] as string;
    const q = questionById(id) as Question;
    pickPractice(id, correctIndexes(q));
    checkPractice(id);
    pickPractice(id, [wrongIdx(q)]);
    expect(getState().practice?.answers[id]).toEqual(correctIndexes(q));
  });
});

describe('mock exam flow', () => {
  it('scores answered and unanswered questions and clears the session', () => {
    const m = buildMock('mini', getState(), makeRng(4));
    startMock(m);
    const ids = m.questionIds;
    // answer the first 10 correctly, the next 5 incorrectly, leave 5 blank
    ids.slice(0, 10).forEach((id) => pickMock(id, correctIndexes(questionById(id) as Question)));
    ids.slice(10, 15).forEach((id) => pickMock(id, [wrongIdx(questionById(id) as Question)]));
    const r = submitMock(false);
    expect(r).toMatchObject({ kind: 'mini', total: 20, correct: 10, unanswered: 5 });
    expect(r?.missed).toHaveLength(10);
    expect(Object.values(r?.byDomain ?? {}).reduce((n, d) => n + d.total, 0)).toBe(20);
    expect(getState().mock).toBeNull();
    expect(Object.keys(getState().q)).toHaveLength(15); // unanswered ones are not recorded as attempts
  });
  it('can be abandoned without a result', () => {
    startMock(buildMock('mock', getState(), makeRng(4)));
    abandonMock();
    expect(getState().mock).toBeNull();
    expect(getState().results).toHaveLength(0);
  });
});

describe('persistence', () => {
  it('survives a reload (serialize → load)', () => {
    setLessonDone('cloud-benefits', true);
    const session = buildPractice({ domain: 1, mode: 'mixed', count: 3 }, getState(), makeRng(1))!;
    startPractice(session);
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const reloaded = loadState();
    expect(reloaded.lessons['cloud-benefits']?.done).toBeTruthy();
    expect(reloaded.practice?.id).toBe(session.id);
  });
  it('sanitizes malformed and partial data instead of crashing', () => {
    expect(sanitize(null)).toEqual(defaultState());
    expect(sanitize('nope')).toEqual(defaultState());
    const s = sanitize({ v: 1, prefs: { theme: 'neon', dailyGoal: -5 }, q: { x: { seen: 'a' }, y: 7 }, lessons: { z: 3 }, activity: { bad: 4, '2025-01-02': 3 }, atlas: { known: ['ec2', 5] } });
    expect(s.prefs).toEqual({ theme: 'system', dailyGoal: 10 });
    expect(s.q.y).toBeUndefined();
    expect(s.q.x?.seen).toBe(0);
    expect(s.lessons.z).toBeUndefined();
    expect(s.activity).toEqual({ '2025-01-02': 3 });
    expect(s.atlas.known).toEqual(['ec2']);
  });
  it('keeps a copy of corrupt JSON and starts fresh', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadState()).toEqual(defaultState());
    expect(localStorage.getItem(`${STORAGE_KEY}:corrupt`)).toBe('{not json');
  });
  it('round-trips through export and import, and rejects other files', () => {
    setLessonDone('well-architected', true);
    const text = exportData();
    replaceState(defaultState());
    expect(importData(text)).toEqual({ ok: true });
    expect(getState().lessons['well-architected']?.done).toBeTruthy();
    expect(importData('{"hello":1}').ok).toBe(false);
    expect(importData('garbage').ok).toBe(false);
  });
});

describe('CloudPilled v1 data migration', () => {
  const store: Record<string, string> = {
    'aws-ccp-theme': 'light',
    'aws-ccp-streak': JSON.stringify({ dailyGoal: 15, daily: { '2025-03-01': { actions: 12, met: true }, '2025-03-02': { actions: 0 } } }),
    'aws-ccp-known': JSON.stringify(['EC2', 'S3', 'Storage GW', 'NotAThing']),
    'aws-ccp-srs': JSON.stringify({ Lambda: { interval: 4, nextDue: 1_800_000_000_000, reps: 3 } }),
    'aws-ccp-quiz-stats': JSON.stringify({ byQuestion: { x: { seen: 3, missed: 1 } } }),
  };
  it('imports theme, activity, known services, and flashcard schedule', () => {
    const out = importLegacy((k) => store[k] ?? null);
    expect(out?.prefs).toEqual({ theme: 'light', dailyGoal: 15 });
    expect(out?.activity).toEqual({ '2025-03-01': 12 });
    expect(out?.atlas?.known.sort()).toEqual(['ec2', 'storagegateway', 's3'].sort());
    expect(out?.atlas?.srs.lambda).toMatchObject({ interval: 4, reps: 3 });
  });
  it('returns null when there is nothing to import, and tolerates corrupt values', () => {
    expect(importLegacy(() => null)).toBeNull();
    expect(importLegacy((k) => (k === 'aws-ccp-streak' ? '{{{' : null))).toBeNull();
  });
  it('is applied on first load and flagged', () => {
    const s = loadState((k) => store[k] ?? null);
    expect(s.legacyImported).toBe(true);
    expect(s.prefs.theme).toBe('light');
    expect(Object.keys(s.q)).toHaveLength(0);
  });
});

describe('progress and recommendations', () => {
  it('flags the weakest domain only once there is enough data', () => {
    const s = defaultState();
    expect(weakestDomain(s)).toBeNull();
    for (const q of QUESTIONS.filter((x) => x.domain === 3).slice(0, 8)) s.q[q.id] = { seen: 1, correct: 0, last: false, at: 1 };
    for (const q of QUESTIONS.filter((x) => x.domain === 1).slice(0, 8)) s.q[q.id] = { seen: 1, correct: 1, last: true, at: 1 };
    expect(weakestDomain(s)?.domain).toBe(3);
    expect(domainTally(s, 3).readiness).toBe('weak');
    expect(domainTally(s, 1).readiness).toBe('solid');
  });
  it('recommends a first lesson, then resumes in-progress work', () => {
    expect(nextStep(defaultState()).kind).toBe('start');
    const s = defaultState();
    s.practice = buildPractice({ domain: 1, mode: 'mixed', count: 3 }, s, makeRng(1));
    expect(nextStep(s).kind).toBe('resume-practice');
    s.practice = null;
    s.mock = buildMock('mini', s, makeRng(1));
    expect(nextStep(s).kind).toBe('resume-mock');
  });
});

describe('dates, streaks, and spaced repetition', () => {
  it('computes streaks, allowing a streak to survive until midnight', () => {
    const today = new Date(2025, 5, 10);
    const a: Record<string, number> = {};
    for (let i = 0; i < 4; i++) a[ymd(addDays(today, -i))] = 1;
    expect(currentStreak(a, today)).toBe(4);
    const noToday = { ...a };
    delete noToday[ymd(today)];
    expect(currentStreak(noToday, today)).toBe(3);
    expect(currentStreak({ [ymd(addDays(today, -3))]: 1 }, today)).toBe(0);
    expect(longestStreak({ '2025-01-01': 1, '2025-01-02': 1, '2025-01-04': 1, '2025-01-05': 1, '2025-01-06': 2 })).toBe(3);
  });
  it('formats clocks', () => {
    expect(formatClock(90 * 60_000)).toBe('1:30:00');
    expect(formatClock(65_000)).toBe('1:05');
    expect(formatClock(-5)).toBe('0:00');
  });
  it('schedules flashcards by rating', () => {
    const now = 1_000_000;
    expect(nextSrs(undefined, 'again', now).due).toBe(now + 600_000);
    expect(nextSrs(undefined, 'good', now).interval).toBe(2);
    expect(nextSrs({ due: 0, interval: 2, reps: 1 }, 'easy', now).interval).toBe(6);
  });
});
