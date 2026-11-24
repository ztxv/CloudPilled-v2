import type { DomainId, Question, QuestionOption } from './types';

/**
 * Compact authoring helpers so a question reads like a question, not like a data dump.
 *
 * Option strings use `"Option text :: why this option is right or wrong"`.
 * Distractors must carry a `::` explanation; correct options may omit it.
 */
function opt(raw: string, correct: boolean): QuestionOption {
  const i = raw.indexOf(' :: ');
  if (i === -1) return { text: raw.trim(), correct, why: '' };
  return { text: raw.slice(0, i).trim(), correct, why: raw.slice(i + 4).trim() };
}

const domainOf = (task: string): DomainId => Number(task.split('.')[0]) as DomainId;

/** Single-answer multiple choice: one correct option, three distractors. */
export function S(
  id: string,
  task: string,
  stem: string,
  correct: string,
  wrong: string[],
  clue: string,
  rationale: string,
  refs: string[],
  note?: string,
): Question {
  return {
    id,
    domain: domainOf(task),
    task,
    type: 'single',
    stem,
    options: [opt(correct, true), ...wrong.map((w) => opt(w, false))],
    clue,
    rationale,
    refs,
    ...(note ? { note } : {}),
  };
}

/** Multiple-response: two or more correct options out of five or more. */
export function M(
  id: string,
  task: string,
  stem: string,
  correct: string[],
  wrong: string[],
  clue: string,
  rationale: string,
  refs: string[],
  note?: string,
): Question {
  return {
    id,
    domain: domainOf(task),
    task,
    type: 'multi',
    stem,
    options: [...correct.map((c) => opt(c, true)), ...wrong.map((w) => opt(w, false))],
    clue,
    rationale,
    refs,
    ...(note ? { note } : {}),
  };
}
