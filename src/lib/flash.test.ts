import { beforeEach, describe, expect, it } from 'vitest';
import { QUESTIONS } from '../content';
import { endFlash, flashMove, rateFlash, startFlash } from './actions';
import { CARD_BY_ID, DECK, deckStats, familiarity, filterDeck, maskName } from './deck';
import { buildFlashSession, type FlashOptions, nextSrs, previewLabel, smartScore, taskWeakness, weakTopics } from './flash';
import { makeRng } from './random';
import { defaultState, getState, replaceState, sanitize } from './store';
import type { AppState } from './types';

const base = (over: Partial<FlashOptions> = {}): FlashOptions => ({
  mode: 'smart', filter: { domain: 'all', kind: 'all', category: 'All' }, size: 20, direction: 'forward', shuffle: false, hideKnown: false, ...over,
});
const NOW = 1_700_000_000_000;
const DAY = 86_400_000;

beforeEach(() => {
  localStorage.clear();
  replaceState(defaultState());
});

describe('deck', () => {
  it('combines services and concepts with unique ids', () => {
    expect(new Set(DECK.map((c) => c.id)).size).toBe(DECK.length);
    expect(DECK.some((c) => c.kind === 'service')).toBe(true);
    expect(DECK.some((c) => c.kind === 'concept')).toBe(true);
    for (const c of DECK) {
      expect(CARD_BY_ID.get(c.id)).toBe(c);
      expect([1, 2, 3, 4]).toContain(c.domain);
    }
  });
  it('filters by domain, task, type, and category', () => {
    expect(filterDeck({ domain: 2, kind: 'all', category: 'All' }).every((c) => c.domain === 2)).toBe(true);
    expect(filterDeck({ domain: 'all', task: '3.4', kind: 'all', category: 'All' }).every((c) => c.tasks.includes('3.4'))).toBe(true);
    expect(filterDeck({ domain: 'all', kind: 'concept', category: 'All' }).every((c) => c.kind === 'concept')).toBe(true);
    expect(filterDeck({ domain: 'all', kind: 'all', category: 'Database' }).every((c) => c.category === 'Database')).toBe(true);
  });
  it('masks a service name in its own description', () => {
    expect(maskName('DynamoDB is a serverless NoSQL database.', 'Amazon DynamoDB')).toBe('▢▢▢ is a serverless NoSQL database.');
    expect(maskName('Runs batch jobs at any scale.', 'AWS Batch')).toBe('Runs ▢▢▢ jobs at any scale.');
  });
  it('classifies familiarity and counts the deck', () => {
    expect(familiarity(undefined)).toBe('new');
    expect(familiarity({ due: 0, interval: 1, reps: 1 })).toBe('learning');
    expect(familiarity({ due: 0, interval: 6, reps: 3 })).toBe('familiar');
    expect(familiarity({ due: 0, interval: 30, reps: 5 })).toBe('mastered');
    const s = defaultState();
    const [a, b] = DECK;
    s.atlas.srs[a!.id] = { due: NOW - 1, interval: 2, reps: 1 };
    s.atlas.srs[b!.id] = { due: NOW + DAY, interval: 30, reps: 4 };
    const st = deckStats(s, DECK, NOW);
    expect(st).toMatchObject({ total: DECK.length, learning: 1, mastered: 1, due: 1, new: DECK.length - 2 });
  });
});

describe('spaced repetition', () => {
  it('schedules by rating and keeps the v1 first steps', () => {
    expect(nextSrs(undefined, 'again', NOW)).toMatchObject({ due: NOW + 600_000, interval: 1, lapses: 1, reps: 1 });
    expect(nextSrs(undefined, 'good', NOW).interval).toBe(2);
    expect(nextSrs(undefined, 'easy', NOW).interval).toBe(4);
    expect(nextSrs(undefined, 'hard', NOW).interval).toBe(1);
  });
  it('grows intervals, adjusts ease within bounds, and counts lapses', () => {
    let c = nextSrs(undefined, 'good', NOW);
    c = nextSrs(c, 'good', NOW);
    expect(c.interval).toBe(5); // ceil(2 * 2.2)
    const hard = nextSrs(c, 'hard', NOW);
    expect(hard.interval).toBe(6);
    expect(hard.ease).toBeCloseTo(2.1);
    let low = c;
    for (let i = 0; i < 20; i++) low = nextSrs(low, 'again', NOW);
    expect(low.ease).toBeGreaterThanOrEqual(1.3);
    expect(low.lapses).toBe(20);
    let high = c;
    for (let i = 0; i < 20; i++) high = nextSrs(high, 'easy', NOW);
    expect(high.ease).toBeLessThanOrEqual(3);
  });
  it('previews button labels', () => {
    expect(previewLabel(undefined, 'again')).toBe('10 min');
    expect(previewLabel(undefined, 'good')).toBe('2 days');
    expect(previewLabel(undefined, 'hard')).toBe('1 day');
  });
  it('loads old saved cards that only have due/interval/reps', () => {
    const s = sanitize({ atlas: { known: [], srs: { ec2: { due: 5, interval: 4, reps: 2 }, lambda: { due: 1, interval: 2, reps: 1, ease: 99, last: 'wat', lapses: 2 } } } });
    expect(s.atlas.srs.ec2).toEqual({ due: 5, interval: 4, reps: 2 });
    expect(s.atlas.srs.lambda).toMatchObject({ ease: 3, lapses: 2 });
    expect(s.atlas.srs.lambda?.last).toBeUndefined();
  });
});

describe('smart flashcards', () => {
  const withSrs = (s: AppState, id: string, patch: Partial<AppState['atlas']['srs'][string]>) => {
    s.atlas.srs[id] = { due: NOW + 10 * DAY, interval: 8, reps: 3, ...patch };
  };
  it('ranks unseen, overdue, and lapsed cards above comfortable ones', () => {
    const s = defaultState();
    const [unseen, comfy, overdue, lapsed] = DECK.slice(0, 4) as [typeof DECK[number], typeof DECK[number], typeof DECK[number], typeof DECK[number]];
    withSrs(s, comfy.id, {});
    withSrs(s, overdue.id, { due: NOW - 3 * DAY });
    withSrs(s, lapsed.id, { lapses: 3, last: 'again', at: NOW - 1000 });
    const w = taskWeakness(s);
    const score = (c: typeof unseen) => smartScore(c, s, {}, NOW);
    expect(score(unseen)).toBeGreaterThan(score(comfy));
    expect(score(overdue)).toBeGreaterThan(score(comfy));
    expect(score(lapsed)).toBeGreaterThan(score(overdue));
    expect(w).toBeTypeOf('object');
  });
  it('de-prioritizes cards marked known unless they are due', () => {
    const s = defaultState();
    const c = DECK[0]!;
    const before = smartScore(c, s, {}, NOW);
    s.atlas.known = [c.id];
    expect(smartScore(c, s, {}, NOW)).toBeLessThan(before);
    s.atlas.srs[c.id] = { due: NOW - DAY, interval: 2, reps: 1 };
    expect(smartScore(c, s, {}, NOW)).toBeGreaterThan(2);
  });
  it('favors topics where practice questions are going badly', () => {
    const s = defaultState();
    for (const q of QUESTIONS.filter((x) => x.task === '3.4').slice(0, 6)) s.q[q.id] = { seen: 1, correct: 0, last: false, at: 1 };
    const w = taskWeakness(s);
    expect(w['3.4']).toBeGreaterThan(1);
    expect(w['1.1']).toBe(0);
    const inTask = DECK.find((c) => c.tasks.includes('3.4'))!;
    const other = DECK.find((c) => c.tasks.every((t) => t.startsWith('1')))!;
    expect(smartScore(inTask, s, w, NOW)).toBeGreaterThan(smartScore(other, s, w, NOW));
  });
  it('builds a session of the requested size that leans toward unfamiliar cards', () => {
    const s = defaultState();
    const familiar = DECK.slice(0, 60);
    for (const c of familiar) withSrs(s, c.id, {});
    const session = buildFlashSession(base({ size: 20 }), s, makeRng(4), NOW)!;
    expect(session.queue).toHaveLength(20);
    expect(new Set(session.queue).size).toBe(20);
    const famIds = new Set(familiar.map((c) => c.id));
    expect(session.queue.filter((id) => famIds.has(id)).length).toBeLessThanOrEqual(2);
  });
  it('does not let new cards fill an entire session when there are due ones', () => {
    const s = defaultState();
    const due = DECK.slice(0, 12);
    for (const c of due) s.atlas.srs[c.id] = { due: NOW - DAY, interval: 2, reps: 1 };
    const session = buildFlashSession(base({ size: 20 }), s, makeRng(2), NOW)!;
    const dueIds = new Set(due.map((c) => c.id));
    expect(session.queue.filter((id) => dueIds.has(id)).length).toBeGreaterThanOrEqual(9); // size minus the 55% cap on brand-new cards
  });
  it('lists weak topics', () => {
    const s = defaultState();
    expect(weakTopics(s, NOW).length).toBe(3);
  });
});

describe('session modes', () => {
  it('review-due only includes due cards, oldest first', () => {
    const s = defaultState();
    const [a, b, c] = DECK as [typeof DECK[number], typeof DECK[number], typeof DECK[number]];
    s.atlas.srs[a.id] = { due: NOW - 1000, interval: 2, reps: 1 };
    s.atlas.srs[b.id] = { due: NOW - 5000, interval: 2, reps: 1 };
    s.atlas.srs[c.id] = { due: NOW + DAY, interval: 2, reps: 1 };
    const session = buildFlashSession(base({ mode: 'due' }), s, makeRng(1), NOW)!;
    expect(session.queue).toEqual([b.id, a.id]);
    expect(buildFlashSession(base({ mode: 'due' }), defaultState(), makeRng(1), NOW)).toBeNull();
  });
  it('browse covers the whole filtered deck, optionally hiding known cards and shuffling', () => {
    const s = defaultState();
    s.atlas.known = [DECK[0]!.id];
    const all = buildFlashSession(base({ mode: 'browse' }), s, makeRng(1), NOW)!;
    expect(all.queue).toHaveLength(DECK.length);
    expect(all.queue[0]).toBe(DECK[0]!.id);
    const hidden = buildFlashSession(base({ mode: 'browse', hideKnown: true }), s, makeRng(1), NOW)!;
    expect(hidden.queue).toHaveLength(DECK.length - 1);
    const shuffled = buildFlashSession(base({ mode: 'browse', shuffle: true }), s, makeRng(1), NOW)!;
    expect(shuffled.queue).not.toEqual(all.queue);
    expect([...shuffled.queue].sort()).toEqual([...all.queue].sort());
  });
  it('reverses service cards by direction, never concept cards', () => {
    const rev = buildFlashSession(base({ mode: 'browse', direction: 'reverse' }), defaultState(), makeRng(1), NOW)!;
    for (const id of rev.reversed) expect(CARD_BY_ID.get(id)?.kind).toBe('service');
    expect(rev.reversed.length).toBe(DECK.filter((c) => c.kind === 'service').length);
    const fwd = buildFlashSession(base({ mode: 'browse', direction: 'forward' }), defaultState(), makeRng(1), NOW)!;
    expect(fwd.reversed).toEqual([]);
    const mixed = buildFlashSession(base({ mode: 'browse', direction: 'mixed' }), defaultState(), makeRng(1), NOW)!;
    expect(mixed.reversed.length).toBeGreaterThan(0);
    expect(mixed.reversed.length).toBeLessThan(rev.reversed.length);
  });
  it('returns null for an empty scope', () => {
    expect(buildFlashSession(base({ filter: { domain: 'all', kind: 'all', category: 'No such category' } }), defaultState())).toBeNull();
  });
});

describe('flashcard session flow', () => {
  it('rates cards, reschedules them, re-queues misses, and persists across a reload', () => {
    const session = buildFlashSession(base({ size: 10 }), getState(), makeRng(3))!;
    startFlash(session);
    const [first, second] = session.queue as [string, string];
    rateFlash('again');
    let f = getState().flash!;
    expect(f.index).toBe(1);
    expect(f.queue).toHaveLength(11); // re-inserted a few cards later
    expect(f.queue.slice(2).includes(first)).toBe(true);
    expect(f.struggled).toEqual([first]);
    expect(getState().atlas.srs[first]).toMatchObject({ lapses: 1, last: 'again' });
    expect(f.queue[f.index]).toBe(second);

    rateFlash('easy');
    expect(getState().atlas.known).toContain(second);
    expect(getState().atlas.srs[second]?.interval).toBe(4);

    // saved state survives a reload
    const reloaded = sanitize(JSON.parse(localStorage.getItem('cloudpilled:v2')!));
    expect(reloaded.flash?.index).toBe(2);
    expect(reloaded.flash?.queue).toEqual(getState().flash!.queue);

    // Rating everything Again re-queues each card at most twice, so the session always ends
    const s2 = buildFlashSession(base({ size: 5 }), defaultState(), makeRng(9))!;
    replaceState({ ...defaultState(), flash: s2 });
    for (let i = 0; i < 100 && getState().flash!.index < getState().flash!.queue.length; i++) rateFlash('again');
    f = getState().flash!;
    expect(f.index).toBe(f.queue.length);
    expect(f.queue).toHaveLength(15); // 5 cards x (1 + 2 re-queues)
    for (const id of s2.queue) expect(f.requeues[id]).toBe(2);
  });
  it('counts a study item per rating and clears known on Again', () => {
    const session = buildFlashSession(base({ mode: 'browse' }), getState(), makeRng(1))!;
    const id = session.queue[0]!;
    replaceState({ ...getState(), flash: session, atlas: { known: [id], srs: {} } });
    rateFlash('again');
    expect(getState().atlas.known).not.toContain(id);
    expect(Object.values(getState().activity).reduce((a, b) => a + b, 0)).toBe(1);
  });
  it('does not re-queue in browse mode, and moving does not rate', () => {
    const session = buildFlashSession(base({ mode: 'browse' }), getState(), makeRng(1))!;
    startFlash(session);
    rateFlash('again');
    expect(getState().flash!.queue).toHaveLength(session.queue.length);
    flashMove(1);
    expect(getState().flash!.index).toBe(2);
    flashMove(-5);
    expect(getState().flash!.index).toBe(0);
    flashMove(10_000);
    expect(getState().flash!.index).toBe(session.queue.length);
    expect(Object.keys(getState().atlas.srs)).toHaveLength(1);
  });
  it('ends cleanly', () => {
    startFlash(buildFlashSession(base(), getState(), makeRng(1))!);
    endFlash();
    expect(getState().flash).toBeNull();
  });
  it('sanitizes a malformed saved session to null', () => {
    expect(sanitize({ flash: { queue: 'x', index: 'y' } }).flash).toBeNull();
    expect(sanitize({ flash: { id: 'a', queue: ['ec2', 3], index: 1, mode: 'weird' } }).flash).toMatchObject({ queue: ['ec2'], mode: 'smart', index: 1 });
  });
});
