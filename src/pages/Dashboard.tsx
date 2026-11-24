import { Link } from 'react-router-dom';
import { DOMAINS, EXAM, LESSONS } from '../content';
import { Icon } from '../components/Icon';
import { Bar, DomainChip, ExtLink, Ring } from '../components/ui';
import { timeAgo } from '../lib/dates';
import { nextStep } from '../lib/nextStep';
import { domainLessonProgress, domainTally, hasAnyActivity, missedCount, overall, streak, todayCount, weakestDomain } from '../lib/progress';
import { useAppState } from '../lib/store';
import { percent } from '../lib/scoring';

const READINESS: Record<string, { label: string; cls: string }> = {
  new: { label: 'Not started', cls: '' },
  building: { label: 'Building', cls: 'warn' },
  solid: { label: 'Solid', cls: 'good' },
  weak: { label: 'Needs practice', cls: 'bad' },
};

export function Dashboard() {
  const state = useAppState();
  const step = nextStep(state);
  const o = overall(state);
  const s = streak(state);
  const today = todayCount(state);
  const goal = state.prefs.dailyGoal;
  const started = hasAnyActivity(state);
  const missed = missedCount(state);
  const weakest = weakestDomain(state);
  const recent = [...state.results].reverse().slice(0, 4);

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{EXAM.name} · {EXAM.code}</p>
          <h1>{started ? 'Welcome back. Keep the streak going.' : 'Learn the cloud. Pass the exam. One concept at a time.'}</h1>
          <p className="lead">
            {started
              ? 'Pick up where you left off, fix what you missed, then test yourself.'
              : 'CloudPilled walks a first-time learner through every exam domain, with short lessons, honest practice questions, and mock exams. Progress stays on this device.'}
          </p>
        </div>
        <div className="next-card card" data-kind={step.kind}>
          <p className="eyebrow">{step.eyebrow}</p>
          <h2>{step.title}</h2>
          <p className="muted">{step.detail}</p>
          <div className="btn-row">
            <Link to={step.to} className="btn lg">
              {step.cta}
              <Icon name="arrow" />
            </Link>
            {!started && (
              <Link to="/practice" className="btn secondary lg">
                Try a warm-up
              </Link>
            )}
          </div>
        </div>
      </section>

      {started && (
        <section className="stats stagger" aria-label="Your progress at a glance">
          <div className="card stat" style={{ ['--i' as string]: 0 }}>
            <Ring value={percent(o.lessonsDone, o.lessonsTotal)} label={`${o.lessonsDone}/${o.lessonsTotal}`} sub="lessons" size={92} />
            <div>
              <h3>Lessons</h3>
              <p className="muted small">{o.lessonsTotal - o.lessonsDone} left across four domains</p>
            </div>
          </div>
          <div className="card stat" style={{ ['--i' as string]: 1 }}>
            <Ring value={o.accuracy ?? 0} label={o.accuracy === null ? '—' : `${o.accuracy}%`} sub="accuracy" size={92} domain={3} />
            <div>
              <h3>Practice accuracy</h3>
              <p className="muted small">{o.attempts === 0 ? 'Answer a few questions to see this' : `${o.seen} of ${o.bank} questions seen`}</p>
            </div>
          </div>
          <div className="card stat" style={{ ['--i' as string]: 2 }}>
            <Ring value={Math.min(100, percent(today, goal))} label={`${today}`} sub="today" size={92} domain={4} />
            <div>
              <h3>Daily goal: {goal}</h3>
              <p className="muted small">{s.current > 0 ? `${s.current}-day streak · best ${s.longest}` : 'Study today to start a streak'}</p>
            </div>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="path-h">
        <header>
          <div>
            <p className="eyebrow">Your path</p>
            <h2 id="path-h">Four domains, weighted like the exam</h2>
          </div>
          <Link to="/progress" className="btn ghost sm">
            Full progress <Icon name="arrow" />
          </Link>
        </header>
        <div className="grid cols-2 stagger">
          {DOMAINS.map((d, i) => {
            const lp = domainLessonProgress(state, d.id);
            const t = domainTally(state, d.id);
            const r = READINESS[t.readiness] as { label: string; cls: string };
            const firstOpen = LESSONS.find((l) => l.domain === d.id && !state.lessons[l.id]?.done);
            return (
              <article key={d.id} className="card domain-card" data-domain={d.id} style={{ ['--i' as string]: i }}>
                <div className="row spread">
                  <DomainChip domain={d.id} short />
                  <span className="chip mono">{d.weight}% of exam</span>
                </div>
                <h3>{d.name}</h3>
                <p className="muted small">{d.blurb}</p>
                <div className="meter">
                  <div className="row spread small">
                    <span>Lessons</span>
                    <b>{lp.done}/{lp.total}</b>
                  </div>
                  <Bar value={percent(lp.done, lp.total)} domain={d.id} label={`Domain ${d.id} lessons completed`} />
                </div>
                <div className="meter">
                  <div className="row spread small">
                    <span>Practice accuracy</span>
                    <b>{t.accuracy === null ? '—' : `${t.accuracy}%`}</b>
                  </div>
                  <Bar value={t.accuracy ?? 0} domain={d.id} label={`Domain ${d.id} practice accuracy`} />
                </div>
                <div className="row spread" style={{ marginTop: 'var(--s-4)' }}>
                  <span className={`chip ${r.cls}`}>{weakest?.domain === d.id ? 'Focus here' : r.label}</span>
                  <div className="btn-row">
                    <Link className="btn secondary sm" to={firstOpen ? `/lesson/${firstOpen.id}` : '/study'}>
                      {lp.done === 0 ? 'Start' : firstOpen ? 'Continue' : 'Review'}
                    </Link>
                    <Link className="btn sm" to={`/practice?domain=${d.id}`}>
                      Practice
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid cols-2 section">
        <section className="card" aria-labelledby="review-h">
          <p className="eyebrow">Review queue</p>
          <h2 id="review-h" style={{ fontSize: '1.3rem' }}>{missed > 0 ? `${missed} missed ${missed === 1 ? 'question' : 'questions'} waiting` : 'Nothing to review yet'}</h2>
          <p className="muted">
            {missed > 0 ? 'Answer each correctly once and it leaves the queue.' : 'Questions you get wrong land here so you can revisit them with the explanation.'}
          </p>
          <div className="btn-row">
            <Link to="/review" className="btn secondary">Open review</Link>
            {missed > 0 && <Link to="/practice?mode=missed" className="btn">Practice missed</Link>}
          </div>
        </section>
        <section className="card" aria-labelledby="recent-h">
          <p className="eyebrow">Recent sessions</p>
          <h2 id="recent-h" style={{ fontSize: '1.3rem' }}>{recent.length ? 'Where you have been' : 'No sessions yet'}</h2>
          {recent.length === 0 ? (
            <p className="muted">Finish a practice set or mock and it shows up here, with domain-by-domain results.</p>
          ) : (
            <ul className="recent">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link to={`/results/${r.id}`}>
                    <span>
                      <b>{r.label}</b>
                      <span className="muted small"> · {timeAgo(r.at)}</span>
                    </span>
                    <span className={`chip ${percent(r.correct, r.total) >= 70 ? 'good' : 'warn'}`}>{r.correct}/{r.total}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="section card tint exam-facts" aria-labelledby="facts-h">
        <div>
          <p className="eyebrow">The exam, verified {EXAM.verifiedOn}</p>
          <h2 id="facts-h" style={{ fontSize: '1.3rem' }}>What you are preparing for</h2>
          <p className="muted small" style={{ maxWidth: '58ch' }}>
            Facts below come from the official exam guide and certification page. AWS can change them, so check the sources before you book.
          </p>
          <p className="small">
            <ExtLink href={EXAM.guideUrl}>Official exam guide (PDF)</ExtLink>
            {'  ·  '}
            <ExtLink href={EXAM.pageUrl}>Certification page</ExtLink>
          </p>
        </div>
        <dl className="facts">
          <div><dt>Exam code</dt><dd>{EXAM.code}</dd></div>
          <div><dt>Questions</dt><dd>{EXAM.totalQuestions} <small>({EXAM.scoredQuestions} scored)</small></dd></div>
          <div><dt>Time</dt><dd>{EXAM.minutes} min</dd></div>
          <div><dt>Passing</dt><dd>{EXAM.passingScaled} <small>on a {EXAM.scaleMin}–{EXAM.scaleMax.toLocaleString()} scale</small></dd></div>
        </dl>
      </section>
    </div>
  );
}
