import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DOMAINS, QUESTIONS, TASKS, taskById, type DomainId } from '../content';
import { Icon } from '../components/Icon';
import { ConfirmDialog, DomainChip } from '../components/ui';
import { startPractice } from '../lib/actions';
import { missedCount } from '../lib/progress';
import { buildPractice } from '../lib/sessions';
import { useAppState } from '../lib/store';
import type { PracticeMode } from '../lib/types';

const MODES: { id: PracticeMode; title: string; desc: string }[] = [
  { id: 'mixed', title: 'Mixed set', desc: 'New questions first, balanced to the exam’s domain weights when you pick all domains.' },
  { id: 'weak', title: 'Weak spots first', desc: 'Prioritizes questions you missed or answer unreliably, then ones you have not seen.' },
  { id: 'missed', title: 'Missed only', desc: 'Only questions whose latest answer was wrong. Get one right and it leaves the queue.' },
];

export function PracticeSetup() {
  const state = useAppState();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const qTask = params.get('task');
  const qDomain = params.get('domain');
  const qMode = params.get('mode');

  const initialDomain: DomainId | 'all' = qTask && taskById(qTask) ? (Number(qTask[0]) as DomainId) : qDomain && ['1', '2', '3', '4'].includes(qDomain) ? (Number(qDomain) as DomainId) : 'all';
  const [domain, setDomain] = useState<DomainId | 'all'>(initialDomain);
  const [task, setTask] = useState<string>(qTask && taskById(qTask) ? qTask : '');
  const [mode, setMode] = useState<PracticeMode>(qMode === 'weak' || qMode === 'missed' || qMode === 'mixed' ? qMode : 'mixed');
  const [count, setCount] = useState(10);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState('');

  const missed = missedCount(state);
  const tasks = TASKS.filter((t) => domain === 'all' || t.domain === domain);

  const poolSize = useMemo(() => {
    const missedSet = new Set(Object.entries(state.q).filter(([, s]) => !s.last).map(([id]) => id));
    return QUESTIONS.filter((q) => (domain === 'all' || q.domain === domain) && (!task || q.task === task) && (mode !== 'missed' || missedSet.has(q.id))).length;
  }, [domain, task, mode, state.q]);

  const effective = Math.min(count, poolSize);

  const begin = () => {
    const session = buildPractice({ domain, task: task || undefined, mode, count }, state);
    if (!session) {
      setMsg(mode === 'missed' ? 'No missed questions match this scope. Nice work — or widen the scope.' : 'No questions match this scope.');
      return;
    }
    startPractice(session);
    nav('/practice/session');
  };

  const onStart = () => (state.practice ? setConfirm(true) : begin());

  return (
    <div className="container narrow">
      <header className="page-head">
        <p className="eyebrow">Practice</p>
        <h1>Build a practice set</h1>
        <p className="lead">Immediate feedback after every question, with the reason behind the answer and why the other options fall short.</p>
      </header>

      {state.practice && (
        <div className="card resume-banner" role="region" aria-label="Practice in progress">
          <div>
            <b>You have a set in progress.</b>
            <p className="muted small" style={{ margin: 0 }}>{state.practice.label} · {Object.keys(state.practice.checked).length} of {state.practice.questionIds.length} checked</p>
          </div>
          <Link className="btn" to="/practice/session">Resume <Icon name="arrow" /></Link>
        </div>
      )}

      <div className="card setup">
        <div className="field">
          <span className="lbl" id="scope-l">Scope</span>
          <div className="segmented" role="group" aria-labelledby="scope-l">
            <button type="button" aria-pressed={domain === 'all'} onClick={() => { setDomain('all'); setTask(''); }}>All domains</button>
            {DOMAINS.map((d) => (
              <button key={d.id} type="button" aria-pressed={domain === d.id} onClick={() => { setDomain(d.id); setTask(''); }}>
                D{d.id} · {d.short}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="lbl" htmlFor="task-sel">Task statement <span className="muted" style={{ fontWeight: 500 }}>(optional)</span></label>
          <select id="task-sel" className="select" value={task} onChange={(e) => { setTask(e.target.value); if (e.target.value) setDomain(Number(e.target.value[0]) as DomainId); }}>
            <option value="">Any topic{domain === 'all' ? '' : ` in Domain ${domain}`}</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.id} — {t.title}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="lbl" id="mode-l">Mode</span>
          <div className="mode-grid" role="radiogroup" aria-labelledby="mode-l">
            {MODES.map((m) => {
              const disabled = m.id === 'missed' && missed === 0;
              return (
                <label key={m.id} className={`mode-card${mode === m.id ? ' on' : ''}${disabled ? ' off' : ''}`}>
                  <input type="radio" className="sr-only" name="mode" checked={mode === m.id} disabled={disabled} onChange={() => setMode(m.id)} />
                  <b>{m.title}{m.id === 'missed' && ` (${missed})`}</b>
                  <span className="small muted">{m.desc}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="field">
          <span className="lbl" id="len-l">Length</span>
          <div className="segmented" role="group" aria-labelledby="len-l">
            {[10, 20, 30].map((n) => (
              <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)}>{n} questions</button>
            ))}
          </div>
          <p className="hint">
            {poolSize === 0 ? 'No questions match this scope.' : `${poolSize} ${poolSize === 1 ? 'question matches' : 'questions match'} this scope${effective < count ? `, so this set will have ${effective}` : ''}.`}
          </p>
        </div>

        {msg && <p role="alert" className="chip warn" style={{ marginBottom: 12 }}>{msg}</p>}
        <div className="btn-row">
          <button type="button" className="btn lg" onClick={onStart} disabled={poolSize === 0}>
            <Icon name="play" /> Start {effective > 0 ? `${effective}-question ` : ''}set
          </button>
          <Link to="/review" className="btn ghost">Review missed ({missed})</Link>
        </div>
      </div>

      <section className="section" aria-labelledby="bank-h">
        <h2 id="bank-h" style={{ fontSize: '1.2rem' }}>What is in the question bank</h2>
        <div className="grid cols-4">
          {DOMAINS.map((d) => {
            const qs = QUESTIONS.filter((q) => q.domain === d.id);
            const multi = qs.filter((q) => q.type === 'multi').length;
            return (
              <div key={d.id} className="card flat" data-domain={d.id}>
                <DomainChip domain={d.id} short />
                <p style={{ fontSize: '1.9rem', fontFamily: 'var(--font-display)', fontWeight: 800, margin: '8px 0 0', lineHeight: 1 }}>{qs.length}</p>
                <p className="small muted">{multi} multiple-response</p>
              </div>
            );
          })}
        </div>
      </section>

      <ConfirmDialog
        open={confirm}
        title="Replace your set in progress?"
        confirmLabel="Start new set"
        onCancel={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); begin(); }}
      >
        Starting a new set discards the one you have in progress. Questions you already checked keep their results.
      </ConfirmDialog>
    </div>
  );
}
