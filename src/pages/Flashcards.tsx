import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DOMAINS, TASKS, taskById, type DomainId } from '../content';
import { Icon, type IconName } from '../components/Icon';
import { ConfirmDialog } from '../components/ui';
import { endFlash, startFlash } from '../lib/actions';
import { DECK, DECK_CATEGORIES, deckStats, filterDeck, isDue, type DeckFilter } from '../lib/deck';
import { buildFlashSession, taskTitle, weakTopics } from '../lib/flash';
import { useAppState } from '../lib/store';
import type { FlashDirection, FlashMode } from '../lib/types';

const MODES: { id: FlashMode; title: string; icon: IconName; badge?: string; desc: string }[] = [
  { id: 'smart', title: 'Smart flashcards', icon: 'bulb', badge: 'Recommended', desc: 'Shows more of what you have not met or keep missing, mixes in cards due for review, and brings “Again” cards back within the session.' },
  { id: 'due', title: 'Review due', icon: 'clock', desc: 'Only cards whose review time has come. The classic spaced-repetition routine.' },
  { id: 'browse', title: 'Browse the deck', icon: 'cards', desc: 'Flip through every card in order or shuffled, at your own pace, with arrow keys.' },
];

const DIRECTIONS: { id: FlashDirection; label: string }[] = [
  { id: 'forward', label: 'Name → description' },
  { id: 'reverse', label: 'Description → name' },
  { id: 'mixed', label: 'Mixed' },
];

export function FlashcardsHub() {
  const state = useAppState();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const qTask = params.get('task');
  const [now] = useState(() => Date.now());

  const [mode, setMode] = useState<FlashMode>('smart');
  const [domain, setDomain] = useState<DomainId | 'all'>(qTask && taskById(qTask) ? (Number(qTask[0]) as DomainId) : 'all');
  const [task, setTask] = useState(qTask && taskById(qTask) ? qTask : '');
  const [kind, setKind] = useState<DeckFilter['kind']>('all');
  const [category, setCategory] = useState('All');
  const [size, setSize] = useState(20);
  const [direction, setDirection] = useState<FlashDirection>('mixed');
  const [shuffleOn, setShuffleOn] = useState(false);
  const [hideKnown, setHideKnown] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState('');

  const stats = deckStats(state, DECK, now);
  const filter: DeckFilter = { domain, task: task || undefined, kind, category };
  const pool = useMemo(() => filterDeck(filter), [domain, task, kind, category]); // eslint-disable-line react-hooks/exhaustive-deps
  const poolDue = pool.filter((c) => isDue(state.atlas.srs[c.id], now)).length;
  const available = mode === 'due' ? poolDue : mode === 'browse' && hideKnown ? pool.filter((c) => !state.atlas.known.includes(c.id)).length : pool.length;
  const count = mode === 'browse' ? available : Math.min(size, available);
  const topics = weakTopics(state, now);
  const active = state.flash && state.flash.index < state.flash.queue.length ? state.flash : null;

  const begin = () => {
    const s = buildFlashSession({ mode, filter, size, direction, shuffle: shuffleOn, hideKnown }, state);
    if (!s) {
      setMsg(mode === 'due' ? 'Nothing is due in this scope right now. Try Smart flashcards, or widen the scope.' : 'No cards match this scope.');
      return;
    }
    startFlash(s);
    nav('/flashcards/session');
  };

  const total = Math.max(1, stats.total);
  const seg = [
    { k: 'new', label: 'New', n: stats.new },
    { k: 'learning', label: 'Learning', n: stats.learning },
    { k: 'familiar', label: 'Familiar', n: stats.familiar },
    { k: 'mastered', label: 'Mastered', n: stats.mastered },
  ] as const;

  return (
    <div className="container narrow">
      <header className="page-head">
        <p className="eyebrow">Flashcards</p>
        <h1>Make it stick</h1>
        <p className="lead">
          {stats.total} cards: every in-scope service plus {DECK.filter((c) => c.kind === 'concept').length} concept cards for the comparisons the exam loves. Flip, rate how it felt, and the schedule does the rest.
        </p>
      </header>

      {active && (
        <div className="card resume-banner" role="region" aria-label="Flashcard session in progress">
          <div>
            <b>{active.label} in progress.</b>
            <p className="muted small" style={{ margin: 0 }}>Card {active.index + 1} of {active.queue.length} · {active.reviewed.length} reviewed</p>
          </div>
          <Link className="btn" to="/flashcards/session">Resume <Icon name="arrow" /></Link>
        </div>
      )}

      <section className="card deck-card" aria-labelledby="deck-h">
        <div className="row spread">
          <div>
            <p className="eyebrow">Your deck</p>
            <h2 id="deck-h" style={{ fontSize: '1.3rem', margin: 0 }}>{stats.due > 0 ? `${stats.due} due for review` : stats.new === stats.total ? 'A fresh deck' : 'Nothing due right now'}</h2>
          </div>
          <span className="chip good"><Icon name="check" /> {stats.known} known</span>
        </div>
        <div className="stack-bar" role="img" aria-label={seg.map((s) => `${s.n} ${s.label.toLowerCase()}`).join(', ')}>
          {seg.map((s) => (
            <i key={s.k} data-k={s.k} style={{ ['--w' as string]: `${(s.n / total) * 100}%` }} />
          ))}
        </div>
        <ul className="deck-legend">
          {seg.map((s) => (
            <li key={s.k}><span className="swatch" data-k={s.k} /> <b>{s.n}</b> <span className="muted">{s.label}</span></li>
          ))}
        </ul>
      </section>

      <section className="card setup section" style={{ marginTop: 'var(--s-5)' }} aria-labelledby="start-h">
        <h2 id="start-h" style={{ fontSize: '1.3rem' }}>Start a session</h2>

        <div className="field">
          <span className="lbl" id="fmode-l">Mode</span>
          <div className="mode-grid" role="radiogroup" aria-labelledby="fmode-l">
            {MODES.map((m) => {
              const n = m.id === 'due' ? stats.due : 0;
              const off = m.id === 'due' && n === 0;
              return (
                <label key={m.id} className={`mode-card fmode${mode === m.id ? ' on' : ''}${off ? ' dim' : ''}`}>
                  <input type="radio" className="sr-only" name="fmode" checked={mode === m.id} onChange={() => setMode(m.id)} />
                  <span className="row spread" style={{ width: '100%' }}>
                    <span className="mode-ic"><Icon name={m.icon} /></span>
                    {m.badge && <span className="chip primary">{m.badge}</span>}
                    {m.id === 'due' && <span className={`chip ${n ? 'warn' : ''}`}>{n} due</span>}
                  </span>
                  <b>{m.title}</b>
                  <span className="small muted">{m.desc}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="field">
          <span className="lbl" id="fscope-l">Scope</span>
          <div className="segmented" role="group" aria-labelledby="fscope-l">
            <button type="button" aria-pressed={domain === 'all'} onClick={() => { setDomain('all'); setTask(''); }}>All domains</button>
            {DOMAINS.map((d) => (
              <button key={d.id} type="button" aria-pressed={domain === d.id} onClick={() => { setDomain(d.id); setTask(''); }}>D{d.id} · {d.short}</button>
            ))}
          </div>
        </div>

        <div className="grid cols-3" style={{ marginBottom: 'var(--s-5)' }}>
          <div>
            <label className="lbl small" htmlFor="f-task" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Task statement</label>
            <select id="f-task" className="select" value={task} onChange={(e) => { setTask(e.target.value); if (e.target.value) setDomain(Number(e.target.value[0]) as DomainId); }}>
              <option value="">Any topic</option>
              {TASKS.filter((t) => domain === 'all' || t.domain === domain).map((t) => <option key={t.id} value={t.id}>{t.id} — {t.title}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl small" htmlFor="f-kind" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Card type</label>
            <select id="f-kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as DeckFilter['kind'])}>
              <option value="all">Services and concepts</option>
              <option value="service">Services only</option>
              <option value="concept">Concepts only</option>
            </select>
          </div>
          <div>
            <label className="lbl small" htmlFor="f-cat" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Category</label>
            <select id="f-cat" className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="All">All categories</option>
              {DECK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid cols-2">
          <div className="field">
            <span className="lbl" id="fdir-l">Service cards show</span>
            <div className="segmented" role="group" aria-labelledby="fdir-l">
              {DIRECTIONS.map((d) => <button key={d.id} type="button" aria-pressed={direction === d.id} onClick={() => setDirection(d.id)}>{d.label}</button>)}
            </div>
          </div>
          {mode !== 'browse' ? (
            <div className="field">
              <span className="lbl" id="fsize-l">Session size</span>
              <div className="segmented" role="group" aria-labelledby="fsize-l">
                {[10, 20, 30].map((n) => <button key={n} type="button" aria-pressed={size === n} onClick={() => setSize(n)}>{n} cards</button>)}
              </div>
            </div>
          ) : (
            <div className="field">
              <span className="lbl" id="fbr-l">Deck options</span>
              <div className="segmented" role="group" aria-labelledby="fbr-l">
                <button type="button" aria-pressed={shuffleOn} onClick={() => setShuffleOn((v) => !v)}>Shuffle</button>
                <button type="button" aria-pressed={hideKnown} onClick={() => setHideKnown((v) => !v)}>Hide cards I know</button>
              </div>
            </div>
          )}
        </div>

        <p className="hint" style={{ marginTop: 0 }} aria-live="polite">
          {available === 0 ? 'No cards match this scope.' : `${available} ${available === 1 ? 'card matches' : 'cards match'} this scope${mode !== 'browse' && count < available ? `; this session will have ${count}` : ''}.`}
        </p>
        {msg && <p role="alert" className="chip warn" style={{ margin: '8px 0', whiteSpace: 'normal' }}>{msg}</p>}
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button type="button" className="btn lg" disabled={available === 0} onClick={() => (active ? setConfirm(true) : begin())}>
            <Icon name="play" /> Start {mode === 'smart' ? 'smart session' : mode === 'due' ? 'review' : 'browsing'}{count > 0 ? ` · ${count} cards` : ''}
          </button>
          <Link to="/atlas" className="btn ghost">Open the service atlas</Link>
        </div>
      </section>

      {topics.length > 0 && (
        <section className="section" aria-labelledby="picks-h">
          <p className="eyebrow">Smart picks</p>
          <h2 id="picks-h" style={{ fontSize: '1.3rem' }}>Topics worth a few minutes</h2>
          <p className="muted small">Ranked by cards you have not seen, are overdue, or keep missing, plus how practice questions have gone.</p>
          <ul className="picks">
            {topics.map((t) => (
              <li key={t.task.id} className="card flat">
                <div>
                  <span className="chip mono">Task {t.task.id}</span>
                  <p style={{ margin: '6px 0 2px', fontWeight: 650 }}>{taskTitle(t.task.id)}</p>
                  <p className="small muted" style={{ margin: 0 }}>{t.fresh} new · {t.due} due · {t.shaky} shaky · {t.cards} cards</p>
                </div>
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => {
                    const s = buildFlashSession({ mode: 'smart', filter: { domain: Number(t.task.id[0]) as DomainId, task: t.task.id, kind: 'all', category: 'All' }, size: 15, direction, shuffle: false, hideKnown: false }, state);
                    if (s) { startFlash(s); nav('/flashcards/session'); }
                  }}
                >
                  Study <Icon name="arrow" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={confirm}
        title="Replace your session in progress?"
        confirmLabel="Start new session"
        onCancel={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); endFlash(); begin(); }}
      >
        Starting a new session discards the unfinished one. Cards you already rated keep their new review schedule.
      </ConfirmDialog>
    </div>
  );
}
