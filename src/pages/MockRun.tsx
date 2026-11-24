import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { questionById } from '../content';
import { Icon } from '../components/Icon';
import { QuestionCard } from '../components/QuestionCard';
import { ConfirmDialog } from '../components/ui';
import { abandonMock, pickMock, setMockIndex, submitMock, toggleFlag } from '../lib/actions';
import { formatClock } from '../lib/dates';
import { getState, useAppState } from '../lib/store';

export function MockRun() {
  const state = useAppState();
  const nav = useNavigate();
  const m = state.mock;
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const spent = useRef(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const cur = getState().mock;
      if (!cur) return;
      const secs = Math.round((cur.startedAt + cur.durationMs - n) / 1000);
      if (secs === 600 || secs === 300 || secs === 60) setAnnounce(`${secs / 60} minute${secs === 60 ? '' : 's'} remaining`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const left = m ? m.startedAt + m.durationMs - now : 0;

  const submit = (timedOut: boolean) => {
    if (spent.current) return;
    spent.current = true;
    setGone(true);
    const r = submitMock(timedOut);
    nav(r ? `/results/${r.id}` : '/mock', { replace: true });
  };

  useEffect(() => {
    if (m && left <= 0) submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left <= 0, !!m]);

  const q = m ? questionById(m.questionIds[m.index] ?? '') : undefined;
  const idx = m?.index ?? 0;
  const total = m?.questionIds.length ?? 0;
  const answered = m ? m.questionIds.filter((id) => (m.answers[id] ?? []).length > 0).length : 0;

  useEffect(() => {
    if (!m) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest('dialog, select, textarea')) return;
      const k = e.key.toLowerCase();
      if (k === 'n' && idx < total - 1) setMockIndex(idx + 1);
      else if (k === 'p' && idx > 0) setMockIndex(idx - 1);
      else if (k === 'f' && q) toggleFlag(q.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [m, idx, total, q]);

  if (!m || !q) return gone ? null : <Navigate to="/mock" replace />;

  const order = m.order[q.id] ?? q.options.map((_, i) => i);
  const picked = m.answers[q.id] ?? [];
  const flagged = m.flagged.includes(q.id);
  const unanswered = total - answered;
  const low = left <= 5 * 60000;

  const go = (i: number) => { setMockIndex(i); setNavOpen(false); };

  return (
    <div className="container mock-run">
      <h1 className="sr-only">Mock exam in progress</h1>
      <div className="mock-bar">
        <div className="row">
          <span className={`timer${low ? ' low' : ''}`} role="timer" aria-label={`Time remaining ${formatClock(left)}`}>
            <Icon name="clock" /> {formatClock(left)}
          </span>
          <span className="small muted">{answered}/{total} answered</span>
        </div>
        <div className="row">
          <button type="button" className="btn secondary sm nav-toggle" onClick={() => setNavOpen((o) => !o)} aria-expanded={navOpen} aria-controls="qnav">
            <Icon name="list" /> Questions
          </button>
          <button type="button" className="btn sm" onClick={() => setSubmitting(true)}>Submit exam</button>
        </div>
      </div>
      <div className="sr-only" aria-live="polite">{announce}</div>

      <div className="mock-layout">
        <section className="card q-card" key={q.id} aria-label={`Question ${idx + 1} of ${total}`}>
          <QuestionCard
            q={q}
            order={order}
            picked={picked}
            onPick={(next) => pickMock(q.id, next)}
            shortcuts
            heading={<span className="chip">Question {idx + 1} of {total}</span>}
          />
          <div className="btn-row q-actions spread">
            <div className="btn-row">
              <button type="button" className="btn secondary" disabled={idx === 0} onClick={() => go(idx - 1)}><Icon name="back" /> Previous</button>
              {idx < total - 1 ? (
                <button type="button" className="btn" onClick={() => go(idx + 1)}>Next <Icon name="arrow" /></button>
              ) : (
                <button type="button" className="btn accent" onClick={() => setSubmitting(true)}>Review &amp; submit</button>
              )}
            </div>
            <button type="button" className={`btn ghost${flagged ? ' flagged' : ''}`} aria-pressed={flagged} onClick={() => toggleFlag(q.id)}>
              <Icon name="flag" /> {flagged ? 'Flagged' : 'Flag for review'}
            </button>
          </div>
          <p className="small muted kbd-hint">Keys: <kbd>1</kbd>–<kbd>5</kbd> select · <kbd>N</kbd> next · <kbd>P</kbd> previous · <kbd>F</kbd> flag</p>
        </section>

        <aside id="qnav" className={`qnav card${navOpen ? ' open' : ''}`} aria-label="Question navigator">
          <p className="eyebrow">Navigator</p>
          <div className="qgrid">
            {m.questionIds.map((id, i) => {
              const a = (m.answers[id] ?? []).length > 0;
              const f = m.flagged.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`qcell${a ? ' a' : ''}${f ? ' f' : ''}${i === idx ? ' cur' : ''}`}
                  onClick={() => go(i)}
                  aria-label={`Question ${i + 1}${a ? ', answered' : ', unanswered'}${f ? ', flagged' : ''}`}
                  aria-current={i === idx ? 'true' : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <ul className="legend small muted">
            <li><i className="qcell a" /> Answered</li>
            <li><i className="qcell" /> Unanswered</li>
            <li><i className="qcell f" /> Flagged</li>
          </ul>
          <button type="button" className="btn ghost sm" onClick={() => setLeaving(true)}>Abandon exam</button>
        </aside>
      </div>

      <ConfirmDialog
        open={submitting}
        title="Submit your exam?"
        confirmLabel="Submit and see results"
        onCancel={() => setSubmitting(false)}
        onConfirm={() => { setSubmitting(false); submit(false); }}
      >
        {unanswered > 0 ? <><b>{unanswered} unanswered</b> question{unanswered === 1 ? '' : 's'} will count as incorrect. </> : 'All questions are answered. '}
        {m.flagged.length > 0 && `${m.flagged.length} flagged for review. `}
        You cannot change answers after submitting.
      </ConfirmDialog>
      <ConfirmDialog
        open={leaving}
        title="Abandon this exam?"
        confirmLabel="Abandon"
        danger
        onCancel={() => setLeaving(false)}
        onConfirm={() => { setLeaving(false); setGone(true); abandonMock(); nav('/mock', { replace: true }); }}
      >
        Your answers will be discarded and nothing will be scored.
      </ConfirmDialog>
    </div>
  );
}
