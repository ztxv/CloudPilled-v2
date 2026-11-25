import { refFor } from '../content';
import { lessonsForTask } from '../content';
import { Link } from 'react-router-dom';
import { maskName, type Flashcard } from '../lib/deck';
import { Icon } from './Icon';
import { RichText } from './RichText';
import { ExtLink } from './ui';

interface Props {
  card: Flashcard;
  reversed: boolean;
  flipped: boolean;
  onFlip: () => void;
  /** Exit animation applied while a rating is being committed. */
  leaving?: 'again' | 'hard' | 'good' | 'easy' | null;
  known?: boolean;
  onToggleKnown?: () => void;
}

const CATEGORY_DOMAIN_HINT = 'Tap or press Space to reveal';

function Front({ card, reversed }: { card: Flashcard; reversed: boolean }) {
  if (card.kind === 'concept') {
    return (
      <>
        <span className="fc-tag">Concept · Task {card.tasks[0]}</span>
        <p className="fc-question">{card.concept?.front}</p>
      </>
    );
  }
  const e = card.entry!;
  if (reversed) {
    return (
      <>
        <span className="fc-tag">Which service? · {e.category}</span>
        <p className="fc-question">{maskName(e.does, e.name)}</p>
        <p className="fc-sub">Choose it when: {maskName(e.pick, e.name)}</p>
      </>
    );
  }
  return (
    <>
      <span className="fc-tag">{e.category}</span>
      <h2 className="fc-name">{e.name}</h2>
      <p className="fc-sub">What does it do, and when would you pick it?</p>
    </>
  );
}

function Back({ card, reversed }: { card: Flashcard; reversed: boolean }) {
  const ref = refFor(card.ref);
  const lesson = card.tasks.map((t) => lessonsForTask(t)[0]).find(Boolean);
  if (card.kind === 'concept') {
    const c = card.concept!;
    return (
      <>
        <span className="fc-tag">Answer</span>
        <p className="fc-answer"><RichText text={c.back} /></p>
        {c.points && (
          <ul className="fc-points">
            {c.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
        <p className="fc-links small">
          <ExtLink href={ref.url}>{ref.title}</ExtLink>
          {lesson && <Link to={`/lesson/${lesson.id}`}>Open the lesson</Link>}
        </p>
      </>
    );
  }
  const e = card.entry!;
  return (
    <>
      <span className="fc-tag">{reversed ? 'Answer' : e.category}</span>
      <h2 className="fc-name sm">{e.name}</h2>
      <p className={`fc-answer${reversed ? ' small-answer' : ''}`}><RichText text={e.does} /></p>
      <p><b>Choose it when:</b> {e.pick}</p>
      {e.vs && <p><b>Often confused with:</b> {e.vs}</p>}
      {e.note && <p className="fc-note">{e.note}</p>}
      <p className="fc-links small">
        <ExtLink href={ref.url}>{ref.title}</ExtLink>
        {lesson && <Link to={`/lesson/${lesson.id}`}>Open the lesson</Link>}
      </p>
    </>
  );
}

export function FlashCard({ card, reversed, flipped, onFlip, leaving, known, onToggleKnown }: Props) {
  return (
    <div className={`fc${flipped ? ' is-flipped' : ''}${leaving ? ` leave-${leaving}` : ''}`} data-domain={card.domain}>
      <div className="fc-inner">
        <div className="fc-face fc-front" inert={flipped} aria-hidden={flipped}>
          <button type="button" className="fc-hit" onClick={onFlip} aria-label="Show the answer">
            <span className="sr-only">Show the answer</span>
          </button>
          <Front card={card} reversed={reversed} />
          <span className="fc-hint"><Icon name="refresh" /> {CATEGORY_DOMAIN_HINT}</span>
        </div>
        <div className="fc-face fc-back" inert={!flipped} aria-hidden={!flipped}>
          <div className="fc-scroll">
            <Back card={card} reversed={reversed} />
          </div>
          {onToggleKnown && (
            <button type="button" className={`fc-known${known ? ' on' : ''}`} aria-pressed={known} onClick={onToggleKnown}>
              <Icon name="check" /> {known ? 'Marked as known' : 'I know this'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
