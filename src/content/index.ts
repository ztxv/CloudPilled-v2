import { DOMAIN1_LESSONS } from './lessons/domain1';
import { DOMAIN2_LESSONS } from './lessons/domain2';
import { DOMAIN3A_LESSONS } from './lessons/domain3a';
import { DOMAIN3B_LESSONS } from './lessons/domain3b';
import { DOMAIN4_LESSONS } from './lessons/domain4';
import { DOMAIN2_QUESTIONS } from './questions/domain2';
import { DOMAIN3_QUESTIONS } from './questions/domain3';
import { DOMAIN4_QUESTIONS } from './questions/domain4';
import { DOMAIN1_QUESTIONS } from './questions/domain1';
import type { DomainId, Lesson, Question } from './types';

export * from './types';
export * from './domains';
export { REFS, refFor } from './refs';
export { ATLAS } from './atlas';

export const LESSONS: Lesson[] = [...DOMAIN1_LESSONS, ...DOMAIN2_LESSONS, ...DOMAIN3A_LESSONS, ...DOMAIN3B_LESSONS, ...DOMAIN4_LESSONS];

export const QUESTIONS: Question[] = [...DOMAIN1_QUESTIONS, ...DOMAIN2_QUESTIONS, ...DOMAIN3_QUESTIONS, ...DOMAIN4_QUESTIONS];

export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
export const questionById = (id: string): Question | undefined => QUESTIONS_BY_ID.get(id);
export const lessonsForDomain = (d: DomainId): Lesson[] => LESSONS.filter((l) => l.domain === d);
export const lessonsForTask = (task: string): Lesson[] => LESSONS.filter((l) => l.tasks.includes(task));
export const questionsForDomain = (d: DomainId): Question[] => QUESTIONS.filter((q) => q.domain === d);
export const questionsForTask = (task: string): Question[] => QUESTIONS.filter((q) => q.task === task);

const QUESTIONS_BY_ID = new Map<string, Question>(
  [...QUESTIONS, ...LESSONS.flatMap((l) => l.checks)].map((q) => [q.id, q]),
);
