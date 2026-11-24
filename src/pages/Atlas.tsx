import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ATLAS, lessonsForTask, refFor } from '../content';
import { Icon } from '../components/Icon';
import { ExtLink } from '../components/ui';
import { toggleKnown } from '../lib/actions';
import { useAppState } from '../lib/store';

const CATEGORIES = [...new Set(ATLAS.map((e) => e.category))].sort();

export function AtlasPage() {
  const state = useAppState();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ATLAS.filter((e) => (cat === 'All' || e.category === cat) && (!q || `${e.name} ${e.id} ${e.does} ${e.pick} ${e.vs ?? ''} ${e.category}`.toLowerCase().includes(q))).sort((a, b) => a.name.localeCompare(b.name));
  }, [query, cat]);

  const known = new Set(state.atlas.known);
  const due = Object.values(state.atlas.srs).filter((c) => c.due <= now).length;

  return (
    <div className="container narrow">
      <header className="page-head">
        <p className="eyebrow">Service atlas</p>
        <h1>Every in-scope service, in one sentence</h1>
        <p className="lead">A quick-reference for the services named in the exam guide: what each does, when to choose it, and what it is often confused with.</p>
        <div className="btn-row">
          <Link to="/atlas/flashcards" className="btn"><Icon name="cards" /> Flashcards{due > 0 ? ` (${due} due)` : ''}</Link>
          <span className="chip">{known.size} of {ATLAS.length} marked “I know this”</span>
        </div>
      </header>

      <div className="search">
        <Icon name="search" />
        <input className="input" type="search" placeholder="Search services, e.g. “queue”, “encryption”, “DNS”" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search services" />
      </div>
      <div className="chips-scroll" role="group" aria-label="Filter by category">
        {['All', ...CATEGORIES].map((c) => (
          <button key={c} type="button" className={`chip filter${cat === c ? ' on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <p className="small muted" aria-live="polite">{items.length} {items.length === 1 ? 'service' : 'services'}</p>

      <ul className="atlas-list">
        {items.map((e) => {
          const isOpen = open === e.id;
          const lesson = e.tasks.map((t) => lessonsForTask(t)[0]).find(Boolean);
          return (
            <li key={e.id} className={`card flat atlas-item${isOpen ? ' open' : ''}`}>
              <button type="button" className="atlas-head" aria-expanded={isOpen} aria-controls={`a-${e.id}`} onClick={() => setOpen(isOpen ? null : e.id)}>
                <span className="atlas-name">
                  <b>{e.name}</b>
                  <span className="muted small">{e.does}</span>
                </span>
                <span className="row">
                  {known.has(e.id) && <span className="chip good"><Icon name="check" /> Known</span>}
                  <span className="chip">{e.category}</span>
                </span>
              </button>
              {isOpen && (
                <div id={`a-${e.id}`} className="atlas-body">
                  <p><b>Choose it when:</b> {e.pick}</p>
                  {e.vs && <p><b>Often confused with:</b> {e.vs}</p>}
                  {e.note && <p className="chip warn" style={{ whiteSpace: 'normal' }}>{e.note}</p>}
                  <div className="row">
                    <span className="chip mono">{e.tasks.map((t) => `Task ${t}`).join(' · ')}</span>
                    <ExtLink href={refFor(e.ref).url}>{refFor(e.ref).title}</ExtLink>
                    {lesson && <Link to={`/lesson/${lesson.id}`}>Open the lesson</Link>}
                  </div>
                  <button type="button" className="btn secondary sm" aria-pressed={known.has(e.id)} onClick={() => toggleKnown(e.id)}>
                    <Icon name="check" /> {known.has(e.id) ? 'Marked as known' : 'Mark “I know this”'}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {items.length === 0 && <p className="muted">No services match. Try a broader search or the “All” filter.</p>}
    </div>
  );
}
