import { ATLAS, CONCEPTS, TASKS, domainById, type AtlasEntry, type ConceptCard, type DomainId } from '../content';
import type { AppState, SrsCard } from './types';

export type CardKind = 'service' | 'concept';

export interface Flashcard {
  id: string;
  kind: CardKind;
  /** Service name, or the concept question. */
  title: string;
  /** Atlas category, or "Concepts". */
  category: string;
  tasks: string[];
  domain: DomainId;
  ref: string;
  entry?: AtlasEntry;
  concept?: ConceptCard;
}

const taskDomain = (task: string): DomainId => (TASKS.find((t) => t.id === task)?.domain ?? Number(task[0])) as DomainId;

export const DECK: Flashcard[] = [
  ...ATLAS.map<Flashcard>((e) => ({
    id: e.id, kind: 'service', title: e.name, category: e.category, tasks: e.tasks, domain: taskDomain(e.tasks[0] ?? '3.3'), ref: e.ref, entry: e,
  })),
  ...CONCEPTS.map<Flashcard>((c) => ({
    id: c.id, kind: 'concept', title: c.front, category: 'Concepts', tasks: [c.task], domain: taskDomain(c.task), ref: c.ref, concept: c,
  })),
];

export const CARD_BY_ID = new Map(DECK.map((c) => [c.id, c]));
export const DECK_CATEGORIES = [...new Set(DECK.map((c) => c.category))].sort((a, b) => (a === 'Concepts' ? -1 : b === 'Concepts' ? 1 : a.localeCompare(b)));

export type Familiarity = 'new' | 'learning' | 'familiar' | 'mastered';

export const familiarity = (c: SrsCard | undefined): Familiarity => {
  if (!c || c.reps === 0) return 'new';
  if (c.interval >= 21) return 'mastered';
  if (c.interval >= 4) return 'familiar';
  return 'learning';
};

export const isDue = (c: SrsCard | undefined, now: number): boolean => !!c && c.due <= now;

export interface DeckStats {
  total: number;
  new: number;
  learning: number;
  familiar: number;
  mastered: number;
  due: number;
  known: number;
}

export function deckStats(state: AppState, cards: Flashcard[] = DECK, now: number = Date.now()): DeckStats {
  const out: DeckStats = { total: cards.length, new: 0, learning: 0, familiar: 0, mastered: 0, due: 0, known: 0 };
  const known = new Set(state.atlas.known);
  for (const c of cards) {
    const s = state.atlas.srs[c.id];
    out[familiarity(s)]++;
    if (isDue(s, now)) out.due++;
    if (known.has(c.id)) out.known++;
  }
  return out;
}

export interface DeckFilter {
  domain: DomainId | 'all';
  task?: string | undefined;
  kind: 'all' | CardKind;
  category: string;
}

export const filterDeck = (f: DeckFilter, cards: Flashcard[] = DECK): Flashcard[] =>
  cards.filter(
    (c) =>
      (f.domain === 'all' || c.domain === f.domain) &&
      (!f.task || c.tasks.includes(f.task)) &&
      (f.kind === 'all' || c.kind === f.kind) &&
      (f.category === 'All' || c.category === f.category),
  );

const GENERIC = new Set(['amazon', 'aws', 'service', 'services', 'the', 'and', 'for', 'family', 'tool', 'manager', 'management', 'storage', 'instances', 'plans']);

/** Hide the service's own name in its description so the reverse card does not give itself away. */
export function maskName(text: string, name: string): string {
  const tokens = name
    .split(/[^A-Za-z0-9+.]+/)
    .filter((t) => t.length > 3 && !GENERIC.has(t.toLowerCase()));
  let out = text;
  for (const t of tokens) out = out.replace(new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), '▢▢▢');
  return out;
}

export const domainLabel = (d: DomainId): string => `Domain ${d} · ${domainById(d).short}`;
