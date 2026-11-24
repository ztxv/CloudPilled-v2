import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LESSONS, domainById, lessonById, lessonsForTask, questionsForTask, refFor, taskById, type Block, type Question } from '../content';
import { Icon } from '../components/Icon';
import { QuestionCard } from '../components/QuestionCard';
import { RichText } from '../components/RichText';
import { DomainChip, ExtLink } from '../components/ui';
import { answerCheck, openLesson, rememberPath, resetChecks, setLessonDone } from '../lib/actions';
import { makeRng } from '../lib/random';
import { isCorrect, optionOrder } from '../lib/scoring';
import { useAppState } from '../lib/store';
import { NotFound } from './NotFound';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CALLOUT_ICON = { tip: 'bulb', confusion: 'alert', example: 'layers', note: 'bulb', warn: 'alert' } as const;
const CALLOUT_TITLE = { tip: 'Exam tip', confusion: 'Easy to confuse', example: 'Example', note: 'Note', warn: 'Heads up' } as const;

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'p':
      return <p><RichText text={b.x} /></p>;
    case 'h':
      return <h2 id={slug(b.x)}>{b.x}</h2>;
    case 'ul':
      return <ul>{b.items.map((i, k) => <li key={k}><RichText text={i} /></li>)}</ul>;
    case 'ol':
      return <ol>{b.items.map((i, k) => <li key={k}><RichText text={i} /></li>)}</ol>;
    case 'callout':
      return (
        <aside className={`callout ${b.kind}`}>
          <div className="title"><Icon name={CALLOUT_ICON[b.kind]} /> {b.title ?? CALLOUT_TITLE[b.kind]}</div>
          <p><RichText text={b.x} /></p>
        </aside>
      );
    case 'compare':
      return (
        <figure className="compare" style={{ margin: 0 }} aria-label={b.title}>
          <div className="compare-title">{b.title}</div>
          <div className="scroll" tabIndex={0} role="region" aria-label={b.title}>
            <table>
              <thead><tr>{b.cols.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
              <tbody>
                {b.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      <td key={j} data-label={b.cols[j]}><RichText text={c} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.caption && <figcaption className="caption">{b.caption}</figcaption>}
        </figure>
      );
    case 'terms':
      return (
        <dl className="terms">
          {b.items.map(([t, d]) => (
            <div key={t}><dt>{t}</dt><dd><RichText text={d} /></dd></div>
          ))}
        </dl>
      );
  }
}

function QuickCheck({ lessonId, q, n, previous }: { lessonId: string; q: Question; n: number; previous: boolean | undefined }) {
  const order = useMemo(() => optionOrder(q, makeRng(q.id.length * 7919 + n)), [q, n]);
  const [picked, setPicked] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const check = () => {
    setRevealed(true);
    answerCheck(lessonId, q.id, isCorrect(q, picked));
  };
  return (
    <div className="card check-card">
      <div className="row spread">
        <span className="chip primary">Quick check {n}</span>
        {previous !== undefined && !revealed && <span className={`chip ${previous ? 'good' : 'warn'}`}>{previous ? 'Got it last time' : 'Missed last time'}</span>}
      </div>
      <QuestionCard q={q} order={order} picked={picked} onPick={setPicked} revealed={revealed} showMeta={false} />
      <div className="btn-row">
        {!revealed ? (
          <button type="button" className="btn" disabled={picked.length === 0} onClick={check}>Check answer</button>
        ) : (
          <button type="button" className="btn secondary" onClick={() => { setPicked([]); setRevealed(false); }}>Try again</button>
        )}
      </div>
    </div>
  );
}

function useReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return p;
}

export function LessonPage() {
  const { id = '' } = useParams();
  const lesson = lessonById(id);
  const state = useAppState();
  const progress = useReadingProgress();

  useEffect(() => {
    if (!lesson) return;
    openLesson(lesson.id);
    rememberPath(`/lesson/${lesson.id}`);
  }, [lesson]);

  if (!lesson) return <NotFound />;

  const idx = LESSONS.findIndex((l) => l.id === lesson.id);
  const prev = LESSONS[idx - 1];
  const next = LESSONS[idx + 1];
  const done = !!state.lessons[lesson.id]?.done;
  const d = domainById(lesson.domain);
  const primaryTask = lesson.tasks[0] as string;
  const bankCount = lesson.tasks.reduce((n, t) => n + questionsForTask(t).length, 0);
  const headings = lesson.blocks.flatMap((b) => (b.t === 'h' ? [b.x] : []));
  const checks = lesson.checks;
  const correct = checks.filter((c) => state.lessons[lesson.id]?.checks[c.id]).length;
  void lessonsForTask;

  return (
    <div className="container lesson-wrap" data-domain={lesson.domain}>
      <div className="read-progress" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></div>
      <article className="lesson">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/study">Study</Link> <span aria-hidden="true">/</span>
          <Link to={`/study#domain-${d.id}`}>Domain {d.id}</Link> <span aria-hidden="true">/</span>
          <span aria-current="page">Lesson {idx + 1}</span>
        </nav>
        <header className="lesson-head">
          <div className="row">
            <DomainChip domain={lesson.domain} />
            {lesson.tasks.map((t) => <span key={t} className="chip mono">Task {t}</span>)}
            <span className="chip"><Icon name="clock" /> {lesson.minutes} min</span>
            {done && <span className="chip good"><Icon name="check" /> Completed</span>}
          </div>
          <h1>{lesson.title}</h1>
          <p className="lead">{lesson.summary}</p>
          <div className="card flat objectives">
            <p className="eyebrow">By the end you can</p>
            <ul>
              {lesson.objectives.map((o) => <li key={o}>{o}</li>)}
            </ul>
          </div>
          <p className="small muted">
            Official wording: {lesson.tasks.map((t) => `Task ${t} — ${taskById(t)?.title ?? ''}`).join(' · ')}
          </p>
        </header>

        <div className="prose">
          {lesson.blocks.map((b, i) => <BlockView key={i} b={b} />)}
        </div>

        <section className="checks" aria-labelledby="checks-h">
          <div className="row spread">
            <h2 id="checks-h">Check yourself</h2>
            <span className="chip">{correct} of {checks.length} correct</span>
          </div>
          <p className="muted">Quick checks are not scored in your practice accuracy. They are here to catch a misunderstanding while it is fresh.</p>
          <div className="stack">
            {checks.map((c, i) => <QuickCheck key={c.id} lessonId={lesson.id} q={c} n={i + 1} previous={state.lessons[lesson.id]?.checks[c.id]} />)}
          </div>
          <button type="button" className="btn ghost sm" onClick={() => resetChecks(lesson.id)} style={{ marginTop: 12 }}>
            <Icon name="refresh" /> Clear check results
          </button>
        </section>

        <section className="card lesson-end" aria-labelledby="end-h">
          <p className="eyebrow">Next action</p>
          <h2 id="end-h">{done ? 'Lesson complete. Lock it in with practice.' : 'Finished reading?'}</h2>
          <div className="btn-row">
            {!done ? (
              <button type="button" className="btn lg" onClick={() => setLessonDone(lesson.id, true)}>
                <Icon name="check" /> Mark lesson complete
              </button>
            ) : (
              <button type="button" className="btn ghost" onClick={() => setLessonDone(lesson.id, false)}>Mark as not complete</button>
            )}
            {bankCount > 0 && (
              <Link to={`/practice?task=${primaryTask}`} className={`btn ${done ? 'lg' : 'secondary'}`}>
                <Icon name="target" /> Practice this topic ({bankCount})
              </Link>
            )}
            {next && done && (
              <Link to={`/lesson/${next.id}`} className="btn secondary">Next: {next.title} <Icon name="arrow" /></Link>
            )}
          </div>
          <div className="refs-block">
            <p className="eyebrow">Official AWS references</p>
            <ul>
              {lesson.refs.map((k) => (
                <li key={k}><ExtLink href={refFor(k).url}>{refFor(k).title}</ExtLink></li>
              ))}
            </ul>
          </div>
        </section>

        <nav className="lesson-nav" aria-label="Lesson navigation">
          {prev ? <Link to={`/lesson/${prev.id}`} className="card card-link"><span className="small muted">Previous</span><b>{prev.title}</b></Link> : <span />}
          {next ? <Link to={`/lesson/${next.id}`} className="card card-link" style={{ textAlign: 'right' }}><span className="small muted">Next</span><b>{next.title}</b></Link> : <span />}
        </nav>
      </article>

      <aside className="toc" aria-label="On this page">
        <p className="eyebrow">On this page</p>
        <ul>
          {headings.map((h) => <li key={h}><a href={`#${slug(h)}`}>{h}</a></li>)}
          <li><a href="#checks-h">Check yourself</a></li>
        </ul>
      </aside>
    </div>
  );
}
