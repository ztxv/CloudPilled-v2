import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { FlashCard } from '../components/FlashCard';
import { Bar, Ring } from '../components/ui';
import { endFlash, flashMove, rateFlash, startFlash, toggleKnown } from '../lib/actions';
import { cardOf, buildFlashSession, previewLabel } from '../lib/flash';
import { useAppState } from '../lib/store';
import { percent } from '../lib/scoring';
import type { FlashRating } from '../lib/types';

const RATINGS: { id: FlashRating; label: string; key: string; hint: string }[] = [
  { id: 'again', label: 'Again', key: '1', hint: 'Missed it' },
  { id: 'hard', label: 'Hard', key: '2', hint: 'Got it, barely' },
  { id: 'good', label: 'Good', key: '3', hint: 'Got it' },
  { id: 'easy', label: 'Easy', key: '4', hint: 'Instant' },
];

/** A card id that no longer exists (the deck changed since the session started): skip past it. */
function SkipMissingCard() {
  useEffect(() => {
    flashMove(1);
  }, []);
  return null;
}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function FlashSessionPage() {
  const state = useAppState();
  const nav = useNavigate();
  const f = state.flash;
  const [flipped, setFlipped] = useState(false);
  const [leaving, setLeaving] = useState<FlashRating | null>(null);
  const [gone, setGone] = useState(false);
  const busy = useRef(false);

  const id = f?.queue[f.index];
  const card = cardOf(id);
  const done = !!f && f.index >= f.queue.length;
  const browse = f?.mode === 'browse';

  const rate = useCallback(
    (r: FlashRating) => {
      if (busy.current) return;
      busy.current = true;
      setLeaving(r);
      window.setTimeout(
        () => {
          rateFlash(r);
          setFlipped(false);
          setLeaving(null);
          busy.current = false;
        },
        prefersReduced() ? 0 : 240,
      );
    },
    [],
  );

  const move = useCallback((d: number) => {
    flashMove(d);
    setFlipped(false);
  }, []);

  useEffect(() => {
    if (!f || done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest('select, textarea, input[type="text"], dialog')) return;
      const k = e.key;
      if (k === ' ' || (k === 'Enter' && !t.closest('button, a'))) {
        if (t.closest('button, a') && k === ' ') return; // let a focused button use Space natively
        e.preventDefault();
        setFlipped((v) => !v);
      } else if (flipped && /^[1-4]$/.test(k)) {
        e.preventDefault();
        rate(RATINGS[Number(k) - 1]!.id);
      } else if (browse && k === 'ArrowRight') {
        e.preventDefault();
        move(1);
      } else if (browse && k === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
      } else if ((k === 'k' || k === 'K') && id) {
        toggleKnown(id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [f, done, flipped, browse, id, rate, move]);

  if (!f) return gone ? null : <Navigate to="/flashcards" replace />;

  const leave = () => {
    setGone(true);
    endFlash();
    nav('/flashcards', { replace: true });
  };

  if (done) {
    const total = f.stats.again + f.stats.hard + f.stats.good + f.stats.easy;
    const knew = f.stats.good + f.stats.easy;
    const pct = percent(knew, total);
    const struggled = f.struggled.map((x) => cardOf(x)).filter((c) => !!c);
    const topTask = (() => {
      const counts = new Map<string, number>();
      for (const c of struggled) for (const t of c!.tasks) counts.set(t, (counts.get(t) ?? 0) + 1);
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    })();
    return (
      <div className="container narrow">
        <header className="results-head card">
          <Ring value={browse ? 100 : pct} size={132} label={browse ? `${f.queue.length}` : `${pct}%`} sub={browse ? 'cards' : 'felt solid'} domain={3} />
          <div>
            <p className="eyebrow">{f.label}</p>
            <h1 style={{ marginBottom: 6 }}>{browse ? 'End of the deck' : struggled.length === 0 ? 'Clean round' : 'Round complete'}</h1>
            <p className="lead" style={{ marginBottom: 0 }}>
              {total} {total === 1 ? 'card' : 'cards'} rated · {f.reviewed.length} distinct
              {struggled.length > 0 ? ` · ${struggled.length} to see again` : ''}
            </p>
          </div>
        </header>

        <section className="grid cols-4 stagger" aria-label="Ratings" style={{ marginTop: 'var(--s-5)' }}>
          {RATINGS.map((r, i) => (
            <div key={r.id} className="card flat tile" style={{ ['--i' as string]: i }}>
              <p className="eyebrow">{r.label}</p>
              <p className="tile-v">{f.stats[r.id]}</p>
            </div>
          ))}
        </section>

        {struggled.length > 0 && (
          <section className="section card" aria-labelledby="again-h">
            <h2 id="again-h" style={{ fontSize: '1.2rem' }}>Cards that gave you trouble</h2>
            <ul className="struggled">
              {struggled.map((c) => <li key={c!.id}><span className="chip mono">{c!.tasks[0]}</span> {c!.kind === 'concept' ? c!.concept!.front : c!.title}</li>)}
            </ul>
            <p className="small muted" style={{ marginBottom: 0 }}>They are scheduled to come back soon, and Smart flashcards will favor them.</p>
          </section>
        )}

        <section className="section card" aria-labelledby="after-h">
          <p className="eyebrow">What to do next</p>
          <h2 id="after-h" style={{ fontSize: '1.3rem' }}>Keep the momentum</h2>
          <div className="btn-row">
            <button
              type="button"
              className="btn lg"
              onClick={() => {
                const next = buildFlashSession({ mode: 'smart', filter: { domain: 'all', kind: 'all', category: 'All' }, size: 20, direction: 'mixed', shuffle: false, hideKnown: false }, { ...state, flash: null });
                if (next) { setFlipped(false); startFlash(next); }
              }}
            >
              <Icon name="bulb" /> Another smart round
            </button>
            {topTask && <Link to={`/practice?task=${topTask}`} className="btn secondary"><Icon name="target" /> Practice questions on task {topTask}</Link>}
            <button type="button" className="btn ghost" onClick={leave}>Done</button>
          </div>
        </section>
      </div>
    );
  }

  if (!card || !id) return <SkipMissingCard />;

  const srs = state.atlas.srs[id];
  const known = state.atlas.known.includes(id);
  const total = f.queue.length;

  return (
    <div className="container narrow">
      <h1 className="sr-only">Flashcards</h1>
      <div className="session-head">
        <div>
          <p className="eyebrow">{f.label}</p>
          <p className="small muted" style={{ margin: 0 }} aria-live="polite">Card {f.index + 1} of {total} · {f.reviewed.length} reviewed</p>
        </div>
        <button type="button" className="btn ghost sm" onClick={leave}>End session</button>
      </div>
      <Bar value={percent(f.index, total)} label="Session progress" />

      <div className="fc-stage" key={`${id}-${f.index}`}>
        <FlashCard card={card} reversed={f.reversed.includes(id)} flipped={flipped} onFlip={() => setFlipped(true)} leaving={leaving} known={known} onToggleKnown={() => toggleKnown(id)} />
      </div>

      <div className="fc-controls">
        {!flipped ? (
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            {browse && <button type="button" className="btn secondary" disabled={f.index === 0} onClick={() => move(-1)}><Icon name="back" /> Previous</button>}
            <button type="button" className="btn lg" onClick={() => setFlipped(true)}>Show answer</button>
            {browse && <button type="button" className="btn secondary" onClick={() => move(1)}>Skip <Icon name="arrow" /></button>}
          </div>
        ) : (
          <div className="rate-row stagger" role="group" aria-label="How well did you know it?">
            {RATINGS.map((r, i) => (
              <button key={r.id} type="button" className="rate" data-r={r.id} style={{ ['--i' as string]: i }} onClick={() => rate(r.id)}>
                <span className="rate-top"><b>{r.label}</b><kbd>{r.key}</kbd></span>
                <span className="rate-when">{previewLabel(srs, r.id)}</span>
              </button>
            ))}
          </div>
        )}
        <p className="small muted kbd-hint" style={{ textAlign: 'center', marginTop: 12 }}>
          <kbd>Space</kbd> flip · <kbd>1</kbd>–<kbd>4</kbd> rate · <kbd>K</kbd> mark known{browse ? <> · <kbd>←</kbd> <kbd>→</kbd> move</> : null}
        </p>
      </div>
    </div>
  );
}
