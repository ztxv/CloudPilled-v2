export const ymd = (d: Date = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (d: Date, delta: number): Date => {
  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  n.setDate(n.getDate() + delta);
  return n;
};

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function timeAgo(at: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/** Consecutive active days ending today (or yesterday, so a streak survives until midnight). */
export function currentStreak(activity: Record<string, number>, today: Date = new Date()): number {
  let cursor = today;
  if (!(activity[ymd(cursor)] ?? 0)) cursor = addDays(cursor, -1);
  let n = 0;
  while ((activity[ymd(cursor)] ?? 0) > 0) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function longestStreak(activity: Record<string, number>): number {
  const days = Object.keys(activity)
    .filter((k) => (activity[k] ?? 0) > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const [y, m, d] = k.split('-').map(Number) as [number, number, number];
    const cur = new Date(y, m - 1, d);
    run = prev && ymd(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}
