import { useSyncExternalStore } from 'react';
import { importLegacy } from './legacy';
import type { AppState } from './types';

export const STORAGE_KEY = 'cloudpilled:v2';

export const defaultState = (): AppState => ({
  v: 2,
  prefs: { theme: 'system', dailyGoal: 10 },
  lessons: {},
  q: {},
  results: [],
  practice: null,
  mock: null,
  flash: null,
  activity: {},
  atlas: { known: [], srs: {} },
  last: null,
  legacyImported: false,
});

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

/**
 * Merge whatever was stored onto the defaults, dropping anything with the wrong shape.
 * This keeps old or partially written data from crashing the app.
 */
export function sanitize(raw: unknown): AppState {
  const base = defaultState();
  if (!isObj(raw)) return base;
  const out: AppState = { ...base };

  if (isObj(raw.prefs)) {
    const t = raw.prefs.theme;
    if (t === 'system' || t === 'light' || t === 'dark') out.prefs.theme = t;
    const g = Number(raw.prefs.dailyGoal);
    if (Number.isFinite(g) && g >= 1 && g <= 200) out.prefs.dailyGoal = Math.round(g);
  }
  if (isObj(raw.lessons)) {
    for (const [id, v] of Object.entries(raw.lessons)) {
      if (!isObj(v)) continue;
      out.lessons[id] = {
        opened: Number(v.opened) || 0,
        ...(Number(v.done) ? { done: Number(v.done) } : {}),
        checks: isObj(v.checks) ? Object.fromEntries(Object.entries(v.checks).map(([k, c]) => [k, c === true])) : {},
      };
    }
  }
  if (isObj(raw.q)) {
    for (const [id, v] of Object.entries(raw.q)) {
      if (!isObj(v)) continue;
      const seen = Math.max(0, Number(v.seen) || 0);
      out.q[id] = { seen, correct: Math.min(seen, Math.max(0, Number(v.correct) || 0)), last: v.last === true, at: Number(v.at) || 0 };
    }
  }
  if (Array.isArray(raw.results)) out.results = raw.results.filter((r) => isObj(r) && typeof r.id === 'string').slice(-60) as unknown as AppState['results'];
  if (isObj(raw.practice) && Array.isArray(raw.practice.questionIds)) out.practice = raw.practice as unknown as AppState['practice'];
  if (isObj(raw.mock) && Array.isArray(raw.mock.questionIds)) out.mock = raw.mock as unknown as AppState['mock'];
  if (isObj(raw.flash) && Array.isArray(raw.flash.queue) && typeof raw.flash.index === 'number' && typeof raw.flash.id === 'string') {
    const f = raw.flash as unknown as NonNullable<AppState['flash']>;
    const strs = (x: unknown): string[] => (Array.isArray(x) ? x.filter((y): y is string => typeof y === 'string') : []);
    const st: Record<string, unknown> = isObj(f.stats) ? f.stats : {};
    out.flash = {
      id: f.id,
      mode: f.mode === 'due' || f.mode === 'browse' ? f.mode : 'smart',
      label: typeof f.label === 'string' ? f.label : 'Flashcards',
      startedAt: Number(f.startedAt) || 0,
      queue: strs(f.queue),
      index: Math.max(0, Math.floor(f.index)),
      reversed: strs(f.reversed),
      requeues: isObj(f.requeues) ? Object.fromEntries(Object.entries(f.requeues).map(([k, v]) => [k, Number(v) || 0])) : {},
      stats: { again: Number(st.again) || 0, hard: Number(st.hard) || 0, good: Number(st.good) || 0, easy: Number(st.easy) || 0 },
      struggled: strs(f.struggled),
      reviewed: strs(f.reviewed),
      tasks: strs(f.tasks),
    };
  }
  if (isObj(raw.activity)) {
    for (const [k, v] of Object.entries(raw.activity)) if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number(v) > 0) out.activity[k] = Number(v);
  }
  if (isObj(raw.atlas)) {
    if (Array.isArray(raw.atlas.known)) out.atlas.known = raw.atlas.known.filter((x): x is string => typeof x === 'string');
    if (isObj(raw.atlas.srs)) {
      for (const [id, c] of Object.entries(raw.atlas.srs)) {
        if (!isObj(c)) continue;
        const last = c.last;
        out.atlas.srs[id] = {
          due: Number(c.due) || 0,
          interval: Math.max(1, Number(c.interval) || 1),
          reps: Math.max(0, Number(c.reps) || 0),
          ...(Number(c.ease) ? { ease: Math.min(3, Math.max(1.3, Number(c.ease))) } : {}),
          ...(Number(c.lapses) ? { lapses: Math.max(0, Math.floor(Number(c.lapses))) } : {}),
          ...(last === 'again' || last === 'hard' || last === 'good' || last === 'easy' ? { last } : {}),
          ...(Number(c.at) ? { at: Number(c.at) } : {}),
        };
      }
    }
  }
  if (isObj(raw.last) && typeof raw.last.path === 'string') out.last = { path: raw.last.path, at: Number(raw.last.at) || 0 };
  out.legacyImported = raw.legacyImported === true;
  return out;
}

/** Storage access that never throws (private mode, quota, blocked cookies). */
const memory = new Map<string, string>();
const safeGet = (k: string): string | null => {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return memory.get(k) ?? null;
  }
};
const safeSet = (k: string, v: string): boolean => {
  try {
    window.localStorage.setItem(k, v);
    return true;
  } catch {
    memory.set(k, v);
    return false;
  }
};

export function loadState(read: (k: string) => string | null = safeGet): AppState {
  const raw = read(STORAGE_KEY);
  if (raw) {
    try {
      return sanitize(JSON.parse(raw));
    } catch {
      // Corrupt JSON: keep a copy for recovery rather than silently destroying it.
      safeSet(`${STORAGE_KEY}:corrupt`, raw);
    }
  }
  const fresh = defaultState();
  const legacy = importLegacy(read);
  if (legacy) {
    const merged = sanitize({ ...fresh, ...legacy, prefs: { ...fresh.prefs, ...(legacy.prefs ?? {}) }, legacyImported: true });
    return merged;
  }
  return fresh;
}

let state: AppState = typeof window === 'undefined' ? defaultState() : loadState();
let persistOk = true;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function persist() {
  persistOk = safeSet(STORAGE_KEY, JSON.stringify(state));
}

export const getState = (): AppState => state;
export const isPersisting = (): boolean => persistOk;

export function update(fn: (s: AppState) => AppState): void {
  state = fn(state);
  persist();
  emit();
}

/** Replace everything (used by import and reset). */
export function replaceState(next: AppState): void {
  state = next;
  persist();
  emit();
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

if (typeof window !== 'undefined') {
  // Keep multiple tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = sanitize(JSON.parse(e.newValue));
        emit();
      } catch {
        /* ignore */
      }
    }
  });
  // First visit after a legacy import: write v2 so the import happens once.
  if (state.legacyImported && !safeGet(STORAGE_KEY)) persist();
}
