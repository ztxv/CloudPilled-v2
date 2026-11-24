import type { DomainId } from '../content';

export type ThemePref = 'system' | 'light' | 'dark';
export type PracticeMode = 'mixed' | 'weak' | 'missed';
export type SessionKind = 'practice' | 'mini' | 'mock';

export interface QStat {
  seen: number;
  correct: number;
  /** Was the most recent attempt correct? Drives the "missed" queue. */
  last: boolean;
  at: number;
}

export interface LessonProgress {
  opened: number;
  done?: number;
  /** Quick-check id → was the latest attempt correct. */
  checks: Record<string, boolean>;
}

export interface PracticeSession {
  id: string;
  startedAt: number;
  label: string;
  mode: PracticeMode;
  domain: DomainId | 'all';
  task?: string;
  questionIds: string[];
  /** Per question: display order as indexes into question.options. */
  order: Record<string, number[]>;
  /** Per question: picked option indexes (indexes into question.options). */
  answers: Record<string, number[]>;
  checked: Record<string, boolean>;
  index: number;
}

export interface MockSession {
  id: string;
  kind: 'mini' | 'mock';
  startedAt: number;
  durationMs: number;
  questionIds: string[];
  order: Record<string, number[]>;
  answers: Record<string, number[]>;
  flagged: string[];
  index: number;
}

export interface DomainTally {
  total: number;
  correct: number;
}

export interface SessionResult {
  id: string;
  kind: SessionKind;
  at: number;
  label: string;
  total: number;
  correct: number;
  unanswered: number;
  byDomain: Record<DomainId, DomainTally>;
  missed: string[];
  durationMs?: number;
  /** Kept for mock/mini results so the review screen can show what was picked. */
  questionIds?: string[];
  answers?: Record<string, number[]>;
  timedOut?: boolean;
}

export interface SrsCard {
  due: number;
  interval: number;
  reps: number;
}

export interface AppState {
  v: 2;
  prefs: { theme: ThemePref; dailyGoal: number };
  lessons: Record<string, LessonProgress>;
  q: Record<string, QStat>;
  results: SessionResult[];
  practice: PracticeSession | null;
  mock: MockSession | null;
  /** YYYY-MM-DD → study actions that day. */
  activity: Record<string, number>;
  atlas: { known: string[]; srs: Record<string, SrsCard> };
  last: { path: string; at: number } | null;
  legacyImported: boolean;
}
