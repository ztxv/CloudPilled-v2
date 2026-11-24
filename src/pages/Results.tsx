import { Link, useParams } from 'react-router-dom';
import { DOMAINS, EXAM, domainById, questionById, type DomainId } from '../content';
import { Icon } from '../components/Icon';
import { QuestionCard } from '../components/QuestionCard';
import { Bar, DomainChip, Ring } from '../components/ui';
import { formatClock } from '../lib/dates';
import { percent } from '../lib/scoring';
import { useAppState } from '../lib/store';
import type { SessionResult } from '../lib/types';
import { NotFound } from './NotFound';

export function ReviewList({ ids, answers, empty }: { ids: string[]; answers?: Record<string, number[]> | undefined; empty: string }) {
  if (ids.length === 0) return <p className="muted">{empty}</p>;
  return (
    <div className="review-list">
      {ids.map((id, i) => {
        const q = questionById(id);
        if (!q) return null;
        const picked = answers?.[id] ?? [];
        return (
          <details key={id} className="review-item">
            <summary>
              <span className="n">{i + 1}</span>
              <span className="stem">{q.stem}</span>
              <DomainChip domain={q.domain} short />
            </summary>
            <div className="review-body">
              <QuestionCard q={q} order={q.options.map((_, k) => k)} picked={picked} revealed showMeta={false} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function DomainBreakdown({ r }: { r: SessionResult }) {
  return (
    <div className="breakdown">
      {DOMAINS.map((d) => {
        const t = r.byDomain[d.id];
        if (!t || t.total === 0) return null;
        const pct = percent(t.correct, t.total);
        return (
          <div key={d.id} className="bd-row" data-domain={d.id}>
            <div className="row spread">
              <span className="row"><span className="dot" /> <b>{d.name}</b> <span className="chip mono">{d.weight}%</span></span>
              <span><b>{t.correct}</b>/{t.total} · {pct}%</span>
            </div>
            <Bar value={pct} domain={d.id} label={`${d.name} score`} />
          </div>
        );
      })}
    </div>
  );
}

export function ResultsPage() {
  const { id = '' } = useParams();
  const state = useAppState();
  const r = state.results.find((x) => x.id === id);
  if (!r) return <NotFound />;

  const pct = percent(r.correct, r.total);
  const isExam = r.kind !== 'practice';
  const weakest = (Object.entries(r.byDomain) as unknown as [string, { total: number; correct: number }][])
    .filter(([, t]) => t.total > 0)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)[0];
  const weakDomain = weakest ? (Number(weakest[0]) as DomainId) : undefined;
  const missedStill = r.missed.filter((m) => state.q[m] && !state.q[m]?.last).length;
  const verdict = pct >= 80 ? 'Strong result' : pct >= 65 ? 'Solid progress' : 'A useful baseline';

  return (
    <div className="container narrow">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to={isExam ? '/mock' : '/practice'}>{isExam ? 'Mock exams' : 'Practice'}</Link> <span aria-hidden="true">/</span> <span aria-current="page">Results</span>
      </nav>
      <header className="results-head card">
        <Ring value={pct} size={132} label={`${pct}%`} sub="correct" domain={pct >= 70 ? 3 : 4} />
        <div>
          <p className="eyebrow">{r.label}</p>
          <h1 style={{ marginBottom: 6 }}>{verdict}</h1>
          <p className="lead" style={{ marginBottom: 8 }}>
            {r.correct} of {r.total} correct
            {r.unanswered > 0 && r.kind !== 'practice' ? ` · ${r.unanswered} unanswered` : ''}
            {r.durationMs ? ` · ${formatClock(r.durationMs)} used` : ''}
            {r.timedOut ? ' · time ran out' : ''}
          </p>
          {weakDomain && weakest && weakest[1].correct < weakest[1].total && (
            <p className="muted" style={{ margin: 0 }}>Weakest area this time: <b>{domainById(weakDomain).name}</b>.</p>
          )}
        </div>
      </header>

      {isExam && (
        <aside className="callout note" role="note">
          <div className="title"><Icon name="alert" /> How to read this score</div>
          <p>
            This is the share of questions you answered correctly on CloudPilled’s own practice bank. It is <b>not</b> an AWS scaled score and it does not predict whether you would pass. The real {EXAM.code} exam reports a {EXAM.scaleMin}–{EXAM.scaleMax.toLocaleString()} scaled score (passing is {EXAM.passingScaled}), is equated across exam forms, and includes {EXAM.unscoredQuestions} unscored questions that you cannot identify.
          </p>
        </aside>
      )}

      <section className="section" aria-labelledby="bd-h" style={{ marginTop: 'var(--s-6)' }}>
        <h2 id="bd-h" style={{ fontSize: '1.3rem' }}>By domain</h2>
        <div className="card"><DomainBreakdown r={r} /></div>
        {isExam && <p className="small muted" style={{ marginTop: 8 }}>The percentages next to each domain are its share of scored exam content.</p>}
      </section>

      <section className="section card" aria-labelledby="next-h">
        <p className="eyebrow">What to do next</p>
        <h2 id="next-h" style={{ fontSize: '1.3rem' }}>
          {r.missed.length === 0 ? 'Nothing missed. Try a harder scope.' : `Turn ${r.missed.length} ${r.missed.length === 1 ? 'miss' : 'misses'} into points`}
        </h2>
        <div className="btn-row">
          {missedStill > 0 && <Link to="/practice?mode=missed" className="btn lg"><Icon name="refresh" /> Practice missed ({missedStill})</Link>}
          {weakDomain && weakest && weakest[1].correct < weakest[1].total && (
            <Link to="/study" className="btn secondary" onClick={() => undefined}>Re-read Domain {weakDomain} lessons</Link>
          )}
          <Link to={isExam ? '/mock' : '/practice'} className={`btn ${missedStill > 0 ? 'secondary' : 'lg'}`}>{isExam ? 'Back to mock exams' : 'New practice set'}</Link>
        </div>
      </section>

      <section className="section" aria-labelledby="rev-h">
        <h2 id="rev-h" style={{ fontSize: '1.3rem' }}>Review the questions you missed</h2>
        <p className="muted small">Open any question to see your answer, the correct one, and why each option is right or wrong.</p>
        <ReviewList ids={r.missed} answers={r.answers} empty="No misses in this session." />
      </section>

      {r.questionIds && r.questionIds.length > r.missed.length && (
        <details className="section all-q">
          <summary className="btn secondary sm">Show all {r.questionIds.length} questions</summary>
          <div style={{ marginTop: 16 }}>
            <ReviewList ids={r.questionIds} answers={r.answers} empty="" />
          </div>
        </details>
      )}
    </div>
  );
}
