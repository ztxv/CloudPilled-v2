import { Link } from 'react-router-dom';
import { QUESTIONS } from '../content';
import { Icon } from '../components/Icon';
import { Bar, DomainChip } from '../components/ui';
import { addDays, timeAgo, ymd } from '../lib/dates';
import { overall, streak, taskRows } from '../lib/progress';
import { percent } from '../lib/scoring';
import { useAppState } from '../lib/store';

const READINESS: Record<string, { label: string; cls: string }> = {
  new: { label: 'Not started', cls: '' },
  building: { label: 'Building', cls: 'warn' },
  solid: { label: 'Solid', cls: 'good' },
  weak: { label: 'Needs practice', cls: 'bad' },
};

export function ProgressPage() {
  const state = useAppState();
  const o = overall(state);
  const s = streak(state);
  const rows = taskRows(state);
  const days = Array.from({ length: 28 }, (_, i) => addDays(new Date(), i - 27));
  const max = Math.max(1, ...days.map((d) => state.activity[ymd(d)] ?? 0));
  const history = [...state.results].reverse().slice(0, 12);

  return (
    <div className="container">
      <header className="page-head">
        <p className="eyebrow">Progress</p>
        <h1>Where you stand, topic by topic</h1>
        <p className="lead">Readiness labels reflect your practice accuracy per exam task. They are a study guide, not a prediction of your exam result.</p>
      </header>

      <section className="grid cols-4 stagger" aria-label="Summary">
        {[
          { k: 'Lessons done', v: `${o.lessonsDone}/${o.lessonsTotal}` },
          { k: 'Questions seen', v: `${o.seen}/${QUESTIONS.length}` },
          { k: 'Overall accuracy', v: o.accuracy === null ? '—' : `${o.accuracy}%` },
          { k: 'Streak (best)', v: `${s.current} (${s.longest})` },
        ].map((x, i) => (
          <div key={x.k} className="card flat tile" style={{ ['--i' as string]: i }}>
            <p className="eyebrow">{x.k}</p>
            <p className="tile-v">{x.v}</p>
          </div>
        ))}
      </section>

      <section className="section" aria-labelledby="act-h">
        <h2 id="act-h" style={{ fontSize: '1.3rem' }}>Last 28 days</h2>
        <div className="card flat">
          <div className="heat" role="img" aria-label={`Study activity over the last 28 days. ${days.filter((d) => (state.activity[ymd(d)] ?? 0) > 0).length} active days.`}>
            {days.map((d) => {
              const n = state.activity[ymd(d)] ?? 0;
              const lvl = n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4));
              return <i key={ymd(d)} data-l={lvl} title={`${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${n} study ${n === 1 ? 'item' : 'items'}`} />;
            })}
          </div>
          <p className="small muted" style={{ margin: '12px 0 0' }}>Each square is a day. Darker means more questions answered, lessons completed, or flashcards reviewed.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="tasks-h">
        <h2 id="tasks-h" style={{ fontSize: '1.3rem' }}>Exam task statements</h2>
        <div className="card flat table-card">
          <div className="scroll" role="region" aria-label="Task statements" tabIndex={0}>
            <table className="ptable">
              <thead>
                <tr><th scope="col">Task</th><th scope="col">Lessons</th><th scope="col">Questions seen</th><th scope="col">Accuracy</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {rows.map(({ task, lessonsDone, lessonsTotal, tally }) => {
                  const r = READINESS[tally.readiness] as { label: string; cls: string };
                  return (
                    <tr key={task.id} data-domain={task.domain}>
                      <th scope="row">
                        <span className="row"><DomainChip domain={task.domain} short /> <span className="chip mono">{task.id}</span></span>
                        <span className="small muted">{task.title}</span>
                      </th>
                      <td>{lessonsDone}/{lessonsTotal}</td>
                      <td>{tally.seen}/{tally.bank}</td>
                      <td style={{ minWidth: 120 }}>
                        <span className="small">{tally.accuracy === null ? '—' : `${tally.accuracy}%`}</span>
                        <Bar value={tally.accuracy ?? 0} domain={task.domain} label={`Task ${task.id} accuracy`} />
                      </td>
                      <td><span className={`chip ${r.cls}`}>{r.label}</span></td>
                      <td><Link to={`/practice?task=${task.id}`} className="btn secondary sm">Practice</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="hist-h">
        <h2 id="hist-h" style={{ fontSize: '1.3rem' }}>Session history</h2>
        {history.length === 0 ? (
          <p className="muted">Nothing yet. Finish a practice set or mock to see it here.</p>
        ) : (
          <ul className="history">
            {history.map((r) => (
              <li key={r.id}>
                <Link to={`/results/${r.id}`} className="card card-link flat">
                  <span><b>{r.label}</b> <span className="muted small">· {timeAgo(r.at)}</span></span>
                  <span className="row"><span className="muted small">{r.correct}/{r.total}</span><span className={`chip ${percent(r.correct, r.total) >= 70 ? 'good' : 'warn'}`}>{percent(r.correct, r.total)}%</span><Icon name="arrow" width={16} height={16} /></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
