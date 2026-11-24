import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { questionById } from '../content';
import { Icon } from '../components/Icon';
import { QuestionCard } from '../components/QuestionCard';
import { Bar, ConfirmDialog } from '../components/ui';
import { abandonPractice, checkPractice, finishPractice, pickPractice, setPracticeIndex } from '../lib/actions';
import { isCorrect, percent, requiredPicks } from '../lib/scoring';
import { useAppState } from '../lib/store';

export function PracticeSessionPage() {
  const state = useAppState();
  const nav = useNavigate();
  const [ending, setEnding] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const p = state.practice;

  const q = p ? questionById(p.questionIds[p.index] ?? '') : undefined;
  const picked = (p && q && p.answers[q.id]) || [];
  const revealed = !!(p && q && p.checked[q.id]);
  const checkedCount = p ? Object.keys(p.checked).length : 0;
  const correctCount = useMemo(
    () => (p ? p.questionIds.filter((id) => p.checked[id] && isCorrect(questionById(id)!, p.answers[id] ?? [])).length : 0),
    [p],
  );
  const isLast = !!p && p.index >= p.questionIds.length - 1;
  const ready = !!q && picked.length >= (q.type === 'multi' ? requiredPicks(q) : 1);

  const finish = () => {
    setLeaving(true);
    const r = finishPractice();
    nav(r && r.total > 0 ? `/results/${r.id}` : '/practice', { replace: true });
  };
  const advance = () => {
    if (!p) return;
    if (isLast) finish();
    else setPracticeIndex(p.index + 1);
  };
  const check = () => q && ready && checkPractice(q.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || ending) return;
      const t = e.target as HTMLElement;
      if (t.closest('button, a, select, dialog')) return;
      e.preventDefault();
      if (revealed) advance();
      else check();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!p || !q) return leaving ? null : <Navigate to="/practice" replace />;
  const order = p.order[q.id] ?? q.options.map((_, i) => i);

  return (
    <div className="container narrow">
      <h1 className="sr-only">Practice session</h1>
      <div className="session-head">
        <div>
          <p className="eyebrow">{p.label}</p>
          <p className="small muted" style={{ margin: 0 }}>Question {p.index + 1} of {p.questionIds.length} · {correctCount}/{checkedCount} correct so far</p>
        </div>
        <button type="button" className="btn ghost sm" onClick={() => setEnding(true)}>End session</button>
      </div>
      <Bar value={percent(p.index + (revealed ? 1 : 0), p.questionIds.length)} label="Session progress" />

      <div className="card q-card" key={q.id}>
        <QuestionCard q={q} order={order} picked={picked} onPick={(next) => pickPractice(q.id, next)} revealed={revealed} shortcuts />
        <div className="btn-row q-actions">
          {!revealed ? (
            <button type="button" className="btn lg" disabled={!ready} onClick={check}>Check answer</button>
          ) : (
            <button type="button" className="btn lg" onClick={advance} autoFocus>
              {isLast ? 'See results' : 'Next question'} <Icon name="arrow" />
            </button>
          )}
          <span className="small muted kbd-hint">Keys: <kbd>1</kbd>–<kbd>{Math.min(order.length, 6)}</kbd> select · <kbd>Enter</kbd> {revealed ? 'next' : 'check'}</span>
        </div>
      </div>

      <ConfirmDialog
        open={ending}
        title={checkedCount > 0 ? 'End this session now?' : 'Leave without answering?'}
        confirmLabel={checkedCount > 0 ? 'End and see results' : 'Discard set'}
        onCancel={() => setEnding(false)}
        onConfirm={() => {
          setEnding(false);
          if (checkedCount > 0) finish();
          else { setLeaving(true); abandonPractice(); nav('/practice', { replace: true }); }
        }}
      >
        {checkedCount > 0 ? `Only the ${checkedCount} question${checkedCount === 1 ? '' : 's'} you checked will count toward the results.` : 'Nothing has been checked yet, so there are no results to save.'}
      </ConfirmDialog>
    </div>
  );
}
