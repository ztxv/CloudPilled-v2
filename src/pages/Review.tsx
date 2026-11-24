import { Link } from 'react-router-dom';
import { DOMAINS, domainById, lessonsForTask, questionById, type Question } from '../content';
import { Icon } from '../components/Icon';
import { Empty } from '../components/ui';
import { missedIds } from '../lib/sessions';
import { useAppState } from '../lib/store';
import { ReviewList } from './Results';

export function ReviewPage() {
  const state = useAppState();
  const ids = missedIds(state);
  const qs = ids.map((id) => questionById(id)).filter((q): q is Question => !!q);

  return (
    <div className="container narrow">
      <header className="page-head">
        <p className="eyebrow">Review queue</p>
        <h1>Questions to revisit</h1>
        <p className="lead">Every question whose latest answer was wrong lands here. Answer it correctly in practice or a mock and it leaves the queue.</p>
      </header>

      {qs.length === 0 ? (
        <Empty title="Your review queue is empty" action={<Link to="/practice" className="btn">Start a practice set</Link>}>
          Missed questions will appear here with their explanations, so you can learn from each one before trying again.
        </Empty>
      ) : (
        <>
          <div className="btn-row" style={{ marginBottom: 24 }}>
            <Link to="/practice?mode=missed" className="btn lg"><Icon name="refresh" /> Practice these {qs.length}</Link>
          </div>
          {DOMAINS.map((d) => {
            const group = qs.filter((q) => q.domain === d.id);
            if (!group.length) return null;
            const tasks = [...new Set(group.map((q) => q.task))];
            return (
              <section key={d.id} className="section" style={{ marginTop: 'var(--s-6)' }} data-domain={d.id}>
                <div className="row spread">
                  <h2 style={{ fontSize: '1.2rem', margin: 0 }}><span className="dot" style={{ display: 'inline-block', marginRight: 8 }} />{domainById(d.id).name} <span className="muted">({group.length})</span></h2>
                  <div className="row">
                    {tasks.map((t) => {
                      const l = lessonsForTask(t)[0];
                      return l ? <Link key={t} to={`/lesson/${l.id}`} className="chip mono">Re-read task {t}</Link> : null;
                    })}
                  </div>
                </div>
                <ReviewList ids={group.map((q) => q.id)} empty="" />
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
