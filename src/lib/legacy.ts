import { ATLAS } from '../content';
import type { AppState, SrsCard, ThemePref } from './types';

/**
 * CloudPilled v1 stored a few things in localStorage under `aws-ccp-*` keys.
 * v2 imports what still makes sense and leaves the old keys untouched:
 *  - theme            → prefs.theme
 *  - streak/daily     → activity (per-day action counts) and the daily goal
 *  - known services   → atlas.known
 *  - flashcard SRS    → atlas.srs
 * v1 quiz statistics were keyed on question text and a different category scheme,
 * so they cannot be mapped onto exam domains and are intentionally not imported.
 */
const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

function atlasIdFor(legacyName: string): string | undefined {
  const n = norm(legacyName);
  return ATLAS.find((e) => norm(e.id) === n || norm(e.name) === n || (e.legacy ?? []).some((l) => norm(l) === n))?.id;
}

function readJson(read: (k: string) => string | null, key: string): unknown {
  try {
    const raw = read(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function importLegacy(read: (k: string) => string | null): Partial<AppState> | null {
  let found = false;
  const out: Partial<AppState> = {};

  try {
    const theme = read('aws-ccp-theme');
    if (theme === 'light' || theme === 'dark') {
      out.prefs = { theme: theme as ThemePref, dailyGoal: 10 };
      found = true;
    }
  } catch {
    /* ignore */
  }

  const streak = readJson(read, 'aws-ccp-streak') as { daily?: Record<string, { actions?: number }>; dailyGoal?: number } | null;
  if (streak && typeof streak === 'object') {
    const activity: Record<string, number> = {};
    for (const [day, row] of Object.entries(streak.daily ?? {})) {
      const n = Number(row?.actions ?? 0);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && n > 0) activity[day] = n;
    }
    if (Object.keys(activity).length) {
      out.activity = activity;
      found = true;
    }
    const goal = Number(streak.dailyGoal);
    if (Number.isFinite(goal) && goal >= 1 && goal <= 200) {
      out.prefs = { theme: out.prefs?.theme ?? 'system', dailyGoal: Math.round(goal) };
      found = true;
    }
  }

  const known = readJson(read, 'aws-ccp-known');
  const srs = readJson(read, 'aws-ccp-srs') as Record<string, { interval?: number; nextDue?: number; reps?: number }> | null;
  const atlas: AppState['atlas'] = { known: [], srs: {} };
  if (Array.isArray(known)) {
    for (const k of known) {
      const id = typeof k === 'string' ? atlasIdFor(k) : undefined;
      if (id && !atlas.known.includes(id)) atlas.known.push(id);
    }
  }
  if (srs && typeof srs === 'object') {
    for (const [name, card] of Object.entries(srs)) {
      const id = atlasIdFor(name);
      if (!id || !card) continue;
      const c: SrsCard = {
        due: Number(card.nextDue) || Date.now(),
        interval: Math.max(1, Number(card.interval) || 1),
        reps: Math.max(0, Number(card.reps) || 0),
      };
      atlas.srs[id] = c;
    }
  }
  if (atlas.known.length || Object.keys(atlas.srs).length) {
    out.atlas = atlas;
    found = true;
  }

  return found ? out : null;
}
