export type DomainId = 1 | 2 | 3 | 4;

export interface Domain {
  id: DomainId;
  name: string;
  /** Percent of scored exam content, from the CLF-C02 exam guide. */
  weight: number;
  blurb: string;
  /** Short label used in tight spaces, e.g. mobile tabs. */
  short: string;
}

export interface TaskStatement {
  /** e.g. "2.3" — matches the exam guide numbering. */
  id: string;
  domain: DomainId;
  /** Verbatim task statement title from the exam guide. */
  title: string;
}

export interface Ref {
  title: string;
  url: string;
}

export type Callout = 'tip' | 'confusion' | 'example' | 'note' | 'warn';

export type Block =
  | { t: 'p'; x: string }
  | { t: 'h'; x: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'callout'; kind: Callout; title?: string; x: string }
  | { t: 'compare'; title: string; cols: string[]; rows: string[][]; caption?: string }
  | { t: 'terms'; items: [term: string, definition: string][] };

export interface QuestionOption {
  text: string;
  correct: boolean;
  /** Why this option is right or wrong. Required for distractors. */
  why: string;
}

export interface Question {
  /** Stable id. Never reuse an id for a different question — progress is keyed on it. */
  id: string;
  domain: DomainId;
  /** Task statement id, e.g. "3.4". */
  task: string;
  type: 'single' | 'multi';
  stem: string;
  options: QuestionOption[];
  /** The phrase or idea in the stem that points to the answer. */
  clue: string;
  /** One or two sentences on why the correct answer is correct. */
  rationale: string;
  refs: string[];
  /** Optional caveat, e.g. when AWS has renamed something since the exam guide. */
  note?: string;
}

export interface Lesson {
  id: string;
  domain: DomainId;
  /** Task statements this lesson covers. */
  tasks: string[];
  title: string;
  summary: string;
  minutes: number;
  objectives: string[];
  blocks: Block[];
  /** Quick knowledge checks shown at the end of the lesson. */
  checks: Question[];
  refs: string[];
}

export interface AtlasEntry {
  id: string;
  name: string;
  category: string;
  /** One sentence: what it is. */
  does: string;
  /** Pick it when… */
  pick: string;
  /** Often confused with… */
  vs?: string;
  tasks: string[];
  ref: string;
  /** Caveat, e.g. AWS has retired or restricted the service since the exam guide was published. */
  note?: string;
  /** Names used in older saved data (CloudPilled v1). */
  legacy?: string[];
}
