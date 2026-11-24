import { describe, expect, it } from 'vitest';
import { ATLAS, DOMAINS, LESSONS, QUESTIONS, REFS, TASKS, domainMix, questionById, type Question } from './index';

const ALL_CHECKS = LESSONS.flatMap((l) => l.checks);
const EVERYTHING: Question[] = [...QUESTIONS, ...ALL_CHECKS];
const norm = (s: string) => s.toLowerCase().replace(/[“”"’']/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

describe('exam structure (CLF-C02 exam guide v1.0)', () => {
  it('has four domains whose weights sum to 100', () => {
    expect(DOMAINS.map((d) => d.weight)).toEqual([24, 30, 34, 12]);
    expect(DOMAINS.reduce((n, d) => n + d.weight, 0)).toBe(100);
  });
  it('has the 19 official task statements', () => {
    expect(TASKS).toHaveLength(19);
    for (const t of TASKS) expect(t.id.startsWith(`${t.domain}.`)).toBe(true);
  });
  it('splits a 65-question mock by weight', () => {
    expect(domainMix(65)).toEqual({ 1: 16, 2: 19, 3: 22, 4: 8 });
    expect(domainMix(20)).toEqual({ 1: 5, 2: 6, 3: 7, 4: 2 });
  });
});

describe('questions', () => {
  it('has unique ids', () => {
    const ids = EVERYTHING.map((q) => q.id);
    expect(ids.length - new Set(ids).size).toBe(0);
  });

  it.each(EVERYTHING.map((q) => [q.id, q] as const))('%s is well formed', (_id, q) => {
    expect(TASKS.find((t) => t.id === q.task), 'task exists').toBeTruthy();
    expect(q.domain, 'domain tag matches task').toBe(Number(q.task.split('.')[0]));
    const correct = q.options.filter((o) => o.correct);
    if (q.type === 'single') {
      expect(q.options).toHaveLength(4);
      expect(correct, 'exactly one correct option').toHaveLength(1);
    } else {
      expect(q.options.length).toBeGreaterThanOrEqual(5);
      expect(correct.length).toBeGreaterThanOrEqual(2);
      expect(correct.length).toBeLessThan(q.options.length - 1);
    }
    for (const o of q.options) {
      expect(o.text.length, 'option text').toBeGreaterThan(1);
      if (!o.correct) expect(o.why.length, `distractor explanation for "${o.text}"`).toBeGreaterThan(12);
    }
    const texts = q.options.map((o) => norm(o.text));
    expect(new Set(texts).size, 'no duplicate options').toBe(texts.length);
    expect(q.options.some((o) => /all of the above|none of the above/i.test(o.text))).toBe(false);
    expect(q.rationale.length).toBeGreaterThan(12);
    expect(q.clue.length).toBeGreaterThan(3);
    expect(q.refs.length, 'has an official reference').toBeGreaterThan(0);
    for (const r of q.refs) expect(REFS[r], `ref ${r}`).toBeTruthy();
    expect(/[?.:)]\s*$/.test(q.stem.trim()), 'stem ends with punctuation').toBe(true);
    if (q.type === 'multi') expect(q.stem).toMatch(/\(Select (TWO|THREE)\.\)/);
  });

  it('quotes a real phrase from the stem as the key clue', () => {
    const bad = EVERYTHING.filter((q) => {
      const stem = norm(q.stem);
      return q.clue.split('…').some((part) => part.trim() && !stem.includes(norm(part)));
    }).map((q) => `${q.id}: "${q.clue}"`);
    expect(bad).toEqual([]);
  });

  it('has no repeated or near-duplicate stems', () => {
    const toks = EVERYTHING.map((q) => ({ id: q.id, s: new Set(norm(q.stem).split(' ').filter((w) => w.length > 3)) }));
    const dupes: string[] = [];
    for (let i = 0; i < toks.length; i++) {
      for (let j = i + 1; j < toks.length; j++) {
        const a = toks[i]!;
        const b = toks[j]!;
        const inter = [...a.s].filter((w) => b.s.has(w)).length;
        const jac = inter / (a.s.size + b.s.size - inter || 1);
        if (jac > 0.8) dupes.push(`${a.id} ~ ${b.id} (${jac.toFixed(2)})`);
      }
    }
    expect(dupes).toEqual([]);
  });

  it('covers every task statement with practice questions', () => {
    for (const t of TASKS) {
      const n = QUESTIONS.filter((q) => q.task === t.id).length;
      expect(n, `questions for task ${t.id}`).toBeGreaterThanOrEqual(6);
    }
  });

  it('supports a full-length mock in the published domain mix', () => {
    const mix = domainMix(65);
    for (const d of DOMAINS) expect(QUESTIONS.filter((q) => q.domain === d.id).length).toBeGreaterThanOrEqual(mix[d.id]);
  });

  it('includes multiple-response items in every domain', () => {
    for (const d of DOMAINS) expect(QUESTIONS.some((q) => q.domain === d.id && q.type === 'multi')).toBe(true);
  });

  it('can look every question up by id', () => {
    for (const q of EVERYTHING) expect(questionById(q.id)).toBe(q);
  });
});

describe('lessons', () => {
  it('has unique ids, valid tasks, and matching domains', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const l of LESSONS) {
      expect(l.tasks.length).toBeGreaterThan(0);
      for (const t of l.tasks) {
        const task = TASKS.find((x) => x.id === t);
        expect(task, `${l.id} task ${t}`).toBeTruthy();
        expect(task?.domain, `${l.id} domain`).toBe(l.domain);
      }
      expect(l.blocks.length).toBeGreaterThan(3);
      expect(l.objectives.length).toBeGreaterThanOrEqual(2);
      expect(l.checks.length).toBeGreaterThanOrEqual(3);
      expect(l.minutes).toBeGreaterThan(0);
      for (const r of l.refs) expect(REFS[r], `${l.id} ref ${r}`).toBeTruthy();
      for (const c of l.checks) expect(l.tasks).toContain(c.task);
    }
  });
  it('covers every task statement', () => {
    for (const t of TASKS) expect(LESSONS.some((l) => l.tasks.includes(t.id)), `lesson for ${t.id}`).toBe(true);
  });
  it('uses only the inline markup the renderer supports (no stray asterisks)', () => {
    const strip = (s: string) => s.replace(/\*\*[^*]+\*\*/g, '').replace(/\*[^*]+\*/g, '');
    const strings: string[] = [];
    for (const l of LESSONS) {
      for (const b of l.blocks) {
        if (b.t === 'p' || b.t === 'h' || b.t === 'callout') strings.push(b.x);
        if (b.t === 'ul' || b.t === 'ol') strings.push(...b.items);
        if (b.t === 'compare') strings.push(...b.rows.flat());
        if (b.t === 'terms') strings.push(...b.items.flat());
      }
    }
    const bad = strings.filter((s) => strip(s).includes('*'));
    expect(bad).toEqual([]);
  });
  it('has well-formed comparison tables', () => {
    for (const l of LESSONS) for (const b of l.blocks) if (b.t === 'compare') for (const r of b.rows) expect(r.length, `${l.id}: ${b.title}`).toBe(b.cols.length);
  });
});

describe('references and atlas', () => {
  it('only links to official AWS hosts over https', () => {
    const hosts = new Set(['aws.amazon.com', 'docs.aws.amazon.com', 'd1.awsstatic.com', 'repost.aws']);
    for (const [k, r] of Object.entries(REFS)) {
      const u = new URL(r.url);
      expect(u.protocol, k).toBe('https:');
      expect(hosts.has(u.hostname), `${k} host ${u.hostname}`).toBe(true);
      expect(r.title.length).toBeGreaterThan(3);
    }
  });
  it('has valid atlas entries', () => {
    expect(new Set(ATLAS.map((e) => e.id)).size).toBe(ATLAS.length);
    for (const e of ATLAS) {
      expect(REFS[e.ref], `${e.id} ref`).toBeTruthy();
      for (const t of e.tasks) expect(TASKS.find((x) => x.id === t), `${e.id} task ${t}`).toBeTruthy();
      expect(e.does.length).toBeGreaterThan(10);
      expect(e.pick.length).toBeGreaterThan(10);
    }
  });
  it('reports content counts', () => {
    const rows = DOMAINS.map((d) => ({
      domain: `${d.id} ${d.name}`,
      lessons: LESSONS.filter((l) => l.domain === d.id).length,
      questions: QUESTIONS.filter((q) => q.domain === d.id).length,
      multi: QUESTIONS.filter((q) => q.domain === d.id && q.type === 'multi').length,
      checks: LESSONS.filter((l) => l.domain === d.id).reduce((n, l) => n + l.checks.length, 0),
    }));
    console.table(rows);
    console.log(`total: ${LESSONS.length} lessons, ${QUESTIONS.length} questions, ${ALL_CHECKS.length} quick checks, ${ATLAS.length} atlas entries, ${Object.keys(REFS).length} references`);
    expect(rows.length).toBe(4);
  });
});
