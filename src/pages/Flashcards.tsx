import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ATLAS, refFor } from '../content';
import { Empty, ExtLink } from '../components/ui';
import { rateCard, type CardRating } from '../lib/actions';
import { makeRng, shuffle } from '../lib/random';
import { useAppState } from '../lib/store';

const SESSION_SIZE = 12;

export function FlashcardsPage() {
  const state = useAppState();
  // Build the queue once per visit so rating a card does not reshuffle the deck underneath you.
  const [queue] = useState(() => {
    const now = Date.now();
    const due = ATLAS.filter((e) => (state.atlas.srs[e.id]?.due ?? Infinity) <= now);
    const fresh = ATLAS.filter((e) => !state.atlas.srs[e.id]);
    const rng = makeRng(now);
    return [...shuffle(due, rng), ...shuffle(fresh, rng)].slice(0, SESSION_SIZE).map((e) => e.id);
  });
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [again, setAgain] = useState(0);

  const card = useMemo(() => ATLAS.find((e) => e.id === queue[i]), [queue, i]);

  if (!card) {
    return (
      <div className="container narrow">
        <Empty title={queue.length ? 'Deck complete' : 'Nothing due right now'} action={<Link to="/atlas" className="btn">Back to the atlas</Link>}>
          {queue.length ? `You reviewed ${queue.length} cards${again ? `, ${again} to see again soon` : ''}. Cards you rate “Again” return in about ten minutes; others come back in a few days.` : 'Every card has been reviewed recently. Come back later, or browse the atlas.'}
        </Empty>
      </div>
    );
  }

  const rate = (r: CardRating) => {
    if (r === 'again') setAgain((n) => n + 1);
    rateCard(card.id, r);
    setFlipped(false);
    setI((n) => n + 1);
  };

  return (
    <div className="container narrow">
      <nav className="crumbs"><Link to="/atlas">Atlas</Link> <span aria-hidden="true">/</span> <span aria-current="page">Flashcards</span></nav>
      <p className="small muted" aria-live="polite">Card {i + 1} of {queue.length}</p>
      <div className="card flash" aria-live="polite">
        <span className="chip">{card.category}</span>
        <h1 className="flash-name">{card.name}</h1>
        {!flipped ? (
          <>
            <p className="muted">What does it do, and when would you pick it? Say it out loud before you look.</p>
            <button type="button" className="btn lg" onClick={() => setFlipped(true)}>Show answer</button>
          </>
        ) : (
          <>
            <p className="lead" style={{ marginBottom: 8 }}>{card.does}</p>
            <p><b>Choose it when:</b> {card.pick}</p>
            {card.vs && <p><b>Often confused with:</b> {card.vs}</p>}
            {card.note && <p className="chip warn" style={{ whiteSpace: 'normal' }}>{card.note}</p>}
            <p className="small"><ExtLink href={refFor(card.ref).url}>{refFor(card.ref).title}</ExtLink></p>
            <div className="btn-row">
              <button type="button" className="btn secondary" onClick={() => rate('again')}>Again</button>
              <button type="button" className="btn" onClick={() => rate('good')}>Got it</button>
              <button type="button" className="btn secondary" onClick={() => rate('easy')}>Easy</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
