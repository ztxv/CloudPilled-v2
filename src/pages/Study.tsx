import { Link } from 'react-router-dom';
import { DOMAINS, LESSONS, questionsForDomain, tasksForDomain } from '../content';
import { Icon } from '../components/Icon';
import { Bar, DomainChip } from '../components/ui';
import { domainLessonProgress } from '../lib/progress';
import { useAppState } from '../lib/store';
import { percent } from '../lib/scoring';

export function StudyPage() {
  const state = useAppState();
  return (
    <div className="container">
      <header className="page-head">
        <p className="eyebrow">Study path</p>
        <h1>Lessons by exam domain</h1>
        <p className="lead">
          Each lesson maps to one or more official task statements. Read it, answer the quick checks, then practice that topic. Work top to bottom, or jump to the domain you need.
        </p>
      </header>

      <nav className="domain-jump" aria-label="Jump to a domain">
        {DOMAINS.map((d) => (
          <a key={d.id} href={`#domain-${d.id}`} data-domain={d.id}>
            <span className="dot" />
            D{d.id} · {d.short}
          </a>
        ))}
      </nav>

      {DOMAINS.map((d) => {
        const lp = domainLessonProgress(state, d.id);
        const lessons = LESSONS.filter((l) => l.domain === d.id);
        return (
          <section key={d.id} id={`domain-${d.id}`} className="domain-section" data-domain={d.id} aria-labelledby={`dh-${d.id}`}>
            <div className="domain-head">
              <div>
                <div className="row">
                  <DomainChip domain={d.id} short />
                  <span className="chip mono">{d.weight}% of scored content</span>
                </div>
                <h2 id={`dh-${d.id}`}>{d.name}</h2>
                <p className="muted" style={{ maxWidth: '60ch' }}>{d.blurb}</p>
                <p className="small muted">
                  {tasksForDomain(d.id).length} task statements · {lessons.length} lessons · {questionsForDomain(d.id).length} practice questions
                </p>
              </div>
              <div className="domain-progress">
                <div className="row spread small">
                  <span>{lp.done} of {lp.total} lessons done</span>
                  <b>{percent(lp.done, lp.total)}%</b>
                </div>
                <Bar value={percent(lp.done, lp.total)} domain={d.id} label={`Domain ${d.id} lesson progress`} large />
                <Link className="btn secondary sm" to={`/practice?domain=${d.id}`} style={{ marginTop: 12 }}>
                  <Icon name="target" /> Practice Domain {d.id}
                </Link>
              </div>
            </div>
            <ol className="path stagger">
              {lessons.map((l, i) => {
                const lp2 = state.lessons[l.id];
                const done = !!lp2?.done;
                const started = !!lp2 && !done;
                return (
                  <li key={l.id} style={{ ['--i' as string]: i }}>
                    <Link to={`/lesson/${l.id}`} className={`card card-link lesson-card${done ? ' is-done' : ''}`}>
                      <span className="step" aria-hidden="true">{done ? <Icon name="check" /> : i + 1}</span>
                      <span className="body">
                        <span className="row small muted">
                          {l.tasks.map((t) => (
                            <span key={t} className="chip mono">Task {t}</span>
                          ))}
                          <span><Icon name="clock" style={{ display: 'inline', width: 13, height: 13, verticalAlign: '-2px' }} /> {l.minutes} min</span>
                        </span>
                        <b className="title">{l.title}</b>
                        <span className="muted small">{l.summary}</span>
                      </span>
                      <span className={`chip ${done ? 'good' : started ? 'primary' : ''}`}>{done ? 'Done' : started ? 'In progress' : 'Start'}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
