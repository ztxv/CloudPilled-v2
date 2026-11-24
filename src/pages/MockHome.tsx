import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DOMAINS, EXAM, domainMix } from '../content';
import { Icon } from '../components/Icon';
import { ConfirmDialog, DomainChip } from '../components/ui';
import { formatClock, timeAgo } from '../lib/dates';
import { startMock } from '../lib/actions';
import { MOCK_SIZES, buildMock, mockMinutes, planMock } from '../lib/sessions';
import { makeRng } from '../lib/random';
import { percent } from '../lib/scoring';
import { useAppState } from '../lib/store';

export function MockHome() {
  const state = useAppState();
  const nav = useNavigate();
  const [confirm, setConfirm] = useState<'mini' | 'mock' | null>(null);
  const [now] = useState(() => Date.now());

  const plans = useMemo(
    () => ({ mock: planMock('mock', state, makeRng(1)), mini: planMock('mini', state, makeRng(1)) }),
    [state],
  );
  const history = [...state.results].filter((r) => r.kind !== 'practice').reverse();
  const left = state.mock ? state.mock.startedAt + state.mock.durationMs - now : 0;

  const begin = (kind: 'mini' | 'mock') => {
    startMock(buildMock(kind, state));
    nav('/mock/run');
  };
  const choose = (kind: 'mini' | 'mock') => (state.mock ? setConfirm(kind) : begin(kind));

  return (
    <div className="container narrow">
      <header className="page-head">
        <p className="eyebrow">Mock exams</p>
        <h1>Test yourself under exam conditions</h1>
        <p className="lead">
          The real {EXAM.code} exam has {EXAM.totalQuestions} questions in {EXAM.minutes} minutes, with multiple-choice and multiple-response items. These mocks follow that shape using CloudPilled’s own questions.
        </p>
      </header>

      {state.mock && (
        <div className="card resume-banner" role="region" aria-label="Mock in progress">
          <div>
            <b>{state.mock.kind === 'mock' ? 'Full-length mock' : 'Mini mock'} in progress.</b>
            <p className="muted small" style={{ margin: 0 }}>{left > 0 ? `${formatClock(left)} remaining` : 'Time is up — open it to submit.'} · {Object.values(state.mock.answers).filter((a) => a.length).length} of {state.mock.questionIds.length} answered</p>
          </div>
          <Link className="btn" to="/mock/run">Resume <Icon name="arrow" /></Link>
        </div>
      )}

      <div className="grid cols-2 mock-options">
        {(['mock', 'mini'] as const).map((kind) => {
          const mix = domainMix(MOCK_SIZES[kind]);
          const plan = plans[kind];
          return (
            <article key={kind} className="card mock-card">
              <p className="eyebrow">{kind === 'mock' ? 'Full-length mock exam' : 'Mini mock'}</p>
              <h2>{MOCK_SIZES[kind]} questions · {mockMinutes(kind)} minutes</h2>
              <p className="muted small">
                {kind === 'mock'
                  ? 'Matches the real exam’s length and time limit. Questions are drawn in the published domain proportions.'
                  : 'A shorter, proportionally timed checkpoint. A mini mock is not a full exam, so treat the percentage as a rough signal only.'}
              </p>
              <ul className="mix">
                {DOMAINS.map((d) => (
                  <li key={d.id} data-domain={d.id}><DomainChip domain={d.id} short /> <b>{mix[d.id]}</b> <span className="muted small">questions</span></li>
                ))}
              </ul>
              {plan.shortfall > 0 && (
                <p className="chip warn" style={{ whiteSpace: 'normal' }}>The question bank is {plan.shortfall} short of this length, so the mock will be smaller.</p>
              )}
              <button type="button" className={`btn ${kind === 'mock' ? 'lg' : 'secondary lg'}`} onClick={() => choose(kind)}>
                <Icon name="timer" /> Start {kind === 'mock' ? 'full mock' : 'mini mock'}
              </button>
            </article>
          );
        })}
      </div>

      <section className="section card tint" aria-labelledby="fair-h">
        <h2 id="fair-h" style={{ fontSize: '1.2rem' }}>What a mock result does and does not tell you</h2>
        <ul>
          <li>Your result is the <b>percentage of questions you answered correctly</b> on this practice bank, with a per-domain breakdown.</li>
          <li>It is <b>not</b> an AWS scaled score. The real exam scores {EXAM.scaleMin}–{EXAM.scaleMax.toLocaleString()} with {EXAM.passingScaled} to pass, equates scores across exam forms, and includes {EXAM.unscoredQuestions} unscored questions.</li>
          <li>Multiple-response questions here are all-or-nothing, and unanswered questions count as incorrect, as the exam guide describes for unanswered items.</li>
          <li>Questions are original and written to the published objectives. They are not real exam questions.</li>
        </ul>
      </section>

      <section className="section" aria-labelledby="hist-h">
        <h2 id="hist-h" style={{ fontSize: '1.3rem' }}>Your mock history</h2>
        {history.length === 0 ? (
          <p className="muted">No mock exams yet. Your attempts and domain breakdowns will be listed here.</p>
        ) : (
          <ul className="history">
            {history.map((r) => (
              <li key={r.id}>
                <Link to={`/results/${r.id}`} className="card card-link flat">
                  <span><b>{r.label}</b> <span className="muted small">· {timeAgo(r.at)}</span></span>
                  <span className="row"><span className="muted small">{r.correct}/{r.total}</span><span className={`chip ${percent(r.correct, r.total) >= 70 ? 'good' : 'warn'}`}>{percent(r.correct, r.total)}%</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirm !== null}
        title="Replace the exam in progress?"
        confirmLabel="Start new exam"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => { const k = confirm; setConfirm(null); if (k) begin(k); }}
      >
        Starting a new mock discards the one you have in progress. Its answers will not be scored or saved.
      </ConfirmDialog>
    </div>
  );
}
