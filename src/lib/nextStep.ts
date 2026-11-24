import { DOMAINS, domainById, lessonById, type Lesson } from '../content';
import { formatClock } from './dates';
import { hasAnyActivity, leastPracticedDomain, missedCount, nextLesson, weakestDomain } from './progress';
import type { AppState } from './types';

export interface NextStep {
  kind: 'resume-mock' | 'resume-practice' | 'resume-lesson' | 'start' | 'review' | 'weak' | 'lesson' | 'mini';
  eyebrow: string;
  title: string;
  detail: string;
  to: string;
  cta: string;
}

/** One clear recommendation for the dashboard's primary card. */
export function nextStep(state: AppState, now: number = Date.now()): NextStep {
  if (state.mock) {
    const left = state.mock.startedAt + state.mock.durationMs - now;
    const answered = Object.values(state.mock.answers).filter((a) => a.length > 0).length;
    return {
      kind: 'resume-mock',
      eyebrow: 'In progress',
      title: state.mock.kind === 'mock' ? 'Resume your mock exam' : 'Resume your mini mock',
      detail: `${answered} of ${state.mock.questionIds.length} answered · ${left > 0 ? `${formatClock(left)} left` : 'time is up — submit to see results'}`,
      to: '/mock/run',
      cta: 'Resume exam',
    };
  }
  if (state.practice) {
    const done = Object.keys(state.practice.checked).length;
    return {
      kind: 'resume-practice',
      eyebrow: 'In progress',
      title: 'Pick up your practice set',
      detail: `${state.practice.label} · ${done} of ${state.practice.questionIds.length} checked`,
      to: '/practice/session',
      cta: 'Resume practice',
    };
  }
  const last = state.last?.path.match(/^\/lesson\/(.+)$/);
  const lastLesson: Lesson | undefined = last ? lessonById(last[1] as string) : undefined;
  if (lastLesson && !state.lessons[lastLesson.id]?.done) {
    return { kind: 'resume-lesson', eyebrow: 'Continue reading', title: lastLesson.title, detail: `Domain ${lastLesson.domain} · about ${lastLesson.minutes} min`, to: `/lesson/${lastLesson.id}`, cta: 'Continue lesson' };
  }
  if (!hasAnyActivity(state)) {
    const first = nextLesson(state);
    return {
      kind: 'start',
      eyebrow: 'Start here',
      title: first ? first.title : 'Take a warm-up practice set',
      detail: first ? 'Lesson 1 of the Cloud Concepts path. About ' + first.minutes + ' minutes, with quick checks at the end.' : 'Ten mixed questions across all four domains.',
      to: first ? `/lesson/${first.id}` : '/practice',
      cta: first ? 'Start lesson 1' : 'Start practice',
    };
  }
  const missed = missedCount(state);
  if (missed >= 3) {
    return { kind: 'review', eyebrow: 'Review queue', title: `Revisit ${missed} missed questions`, detail: 'Re-reading why an answer was wrong is where most of the learning happens.', to: '/review', cta: 'Review missed' };
  }
  const weak = weakestDomain(state);
  if (weak) {
    const d = domainById(weak.domain);
    return { kind: 'weak', eyebrow: 'Needs practice', title: `Practice Domain ${d.id}: ${d.name}`, detail: `You are at ${weak.tally.accuracy}% here across ${weak.tally.attempts} answers.`, to: `/practice?domain=${d.id}&mode=weak`, cta: 'Practice this domain' };
  }
  const lesson = nextLesson(state);
  if (lesson) {
    return { kind: 'lesson', eyebrow: 'Up next', title: lesson.title, detail: `Domain ${lesson.domain} · about ${lesson.minutes} min`, to: `/lesson/${lesson.id}`, cta: 'Open lesson' };
  }
  const dom = leastPracticedDomain(state);
  void DOMAINS;
  return { kind: 'mini', eyebrow: 'Ready for a check', title: 'Try a mini mock', detail: 'Twenty questions in the exam’s domain mix, timed. A good checkpoint before a full-length mock.', to: '/mock', cta: 'Open mock exams' + (dom ? '' : '') };
}
