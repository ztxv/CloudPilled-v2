import { useCallback, useEffect, useId, type ReactNode } from 'react';
import { domainById, refFor, type Question } from '../content';
import { isCorrect, requiredPicks } from '../lib/scoring';
import { DomainChip, ExtLink } from './ui';
import { Icon } from './Icon';
import { RichText } from './RichText';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  q: Question;
  /** Display order as indexes into q.options. */
  order: number[];
  picked: number[];
  onPick?: (next: number[]) => void;
  /** Reveal correctness and explanations. */
  revealed?: boolean;
  /** Disable changing the answer without revealing it (exam mode after submit, etc.). */
  locked?: boolean;
  /** Listen for 1–5 / A–E keys to select options. */
  shortcuts?: boolean;
  showMeta?: boolean;
  heading?: ReactNode;
  autoFocusFirst?: boolean;
}

export function QuestionCard({ q, order, picked, onPick, revealed = false, locked = false, shortcuts = false, showMeta = true, heading }: Props) {
  const gid = useId();
  const multi = q.type === 'multi';
  const need = requiredPicks(q);
  const disabled = revealed || locked || !onPick;

  const toggle = useCallback(
    (optIndex: number) => {
      if (disabled || !onPick) return;
      if (multi) onPick(picked.includes(optIndex) ? picked.filter((i) => i !== optIndex) : [...picked, optIndex]);
      else onPick([optIndex]);
    },
    [disabled, multi, onPick, picked],
  );

  useEffect(() => {
    if (!shortcuts || disabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === 'INPUT' && (t as HTMLInputElement).type === 'text' ? true : t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      const k = e.key.toLowerCase();
      const idx = /^[1-6]$/.test(k) ? Number(k) - 1 : LETTERS.findIndex((l) => l.toLowerCase() === k);
      if (idx >= 0 && idx < order.length) {
        e.preventDefault();
        toggle(order[idx] as number);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcuts, disabled, order, toggle]);

  const ok = revealed && isCorrect(q, picked);

  return (
    <div className={multi ? 'multi' : 'single'}>
      {showMeta && (
        <div className="q-meta">
          <DomainChip domain={q.domain} />
          <span className="chip mono">Task {q.task}</span>
          {multi && <span className="chip warn">Multiple response</span>}
          {heading}
        </div>
      )}
      <div role={multi ? 'group' : 'radiogroup'} aria-labelledby={`${gid}-stem`}>
        <p className="q-stem" id={`${gid}-stem`}>{q.stem}</p>
        <p className="q-instruct" id={`${gid}-i`}>
          {multi ? `Select ${need}. All correct options are required; there is no partial credit.` : 'Select one.'}
        </p>
        <div className="options" role="presentation">
          {order.map((optIndex, pos) => {
            const o = q.options[optIndex];
            if (!o) return null;
            const isPicked = picked.includes(optIndex);
            let cls = 'option';
            if (isPicked && !revealed) cls += ' is-picked';
            if (disabled) cls += ' is-locked';
            if (revealed) {
              if (o.correct && isPicked) cls += ' is-correct';
              else if (o.correct) cls += multi && picked.length ? ' is-missed' : ' is-correct';
              else if (isPicked) cls += ' is-wrong';
            }
            const verdict = revealed ? (o.correct ? (isPicked ? 'Correct.' : multi && picked.length ? 'Also correct — you missed this one.' : 'Correct answer.') : isPicked ? 'Not quite.' : 'Why not:') : '';
            return (
              <label key={optIndex} className={cls}>
                <input
                  className="sr-only"
                  type={multi ? 'checkbox' : 'radio'}
                  name={`${gid}-opt`}
                  checked={isPicked}
                  disabled={disabled}
                  onChange={() => toggle(optIndex)}
                  aria-describedby={`${gid}-i`}
                />
                <span className="key" aria-hidden="true">{LETTERS[pos]}</span>
                <span className="text"><RichText text={o.text} /></span>
                <span className="mark" aria-hidden="true">
                  {revealed && o.correct && <Icon name="check" />}
                  {revealed && !o.correct && isPicked && <Icon name="x" />}
                </span>
                {revealed && (
                  <span className="why">
                    <span className="verdict">{verdict}</span> {o.why || (o.correct ? '' : '')}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
      {revealed && <Feedback q={q} ok={ok} neutral={picked.length === 0} />}
    </div>
  );
}

export function Feedback({ q, ok, neutral = false }: { q: Question; ok: boolean; neutral?: boolean }) {
  return (
    <div className={`feedback ${neutral ? '' : ok ? 'ok' : 'no'}`} role={neutral ? undefined : 'status'}>
      <div className="fb-title">
        {!neutral && <Icon name={ok ? 'check' : 'x'} width={20} height={20} />}
        {neutral ? 'Why this is the answer' : ok ? 'Correct' : 'Not this time'}
      </div>
      <p style={{ margin: 0 }}><RichText text={q.rationale} /></p>
      <div className="clue">
        <b>Key clue in the question</b>
        “{q.clue}”
      </div>
      {q.note && <div className="note"><strong>Currency note:</strong> {q.note}</div>}
      <ul className="refs">
        {q.refs.map((k) => {
          const r = refFor(k);
          return (
            <li key={k}>
              <ExtLink href={r.url}>{r.title}</ExtLink>
            </li>
          );
        })}
      </ul>
      <p className="small muted" style={{ margin: '10px 0 0' }}>
        {domainById(q.domain).name} · Task {q.task}
      </p>
    </div>
  );
}
