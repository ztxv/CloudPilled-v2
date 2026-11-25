import { useRef, useState } from 'react';
import { ATLAS, EXAM, LESSONS, QUESTIONS } from '../content';
import { DECK } from '../lib/deck';
import { GithubIcon, Icon } from '../components/Icon';
import { ConfirmDialog, ExtLink } from '../components/ui';
import { exportData, importData, resetProgress, setDailyGoal, setTheme } from '../lib/actions';
import { isPersisting, useAppState } from '../lib/store';
import type { ThemePref } from '../lib/types';

export function SettingsPage() {
  const state = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudpilled-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: 'Progress exported. Keep the file somewhere safe.' });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const res = importData(await file.text());
    setMsg(res.ok ? { ok: true, text: 'Progress imported.' } : { ok: false, text: res.error });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="container narrow">
      <header className="page-head">
        <p className="eyebrow">Settings</p>
        <h1>Preferences, data, and sources</h1>
      </header>

      <section className="card setup" aria-labelledby="app-h">
        <h2 id="app-h" style={{ fontSize: '1.2rem' }}>Appearance and goals</h2>
        <div className="field">
          <span className="lbl" id="theme-l">Theme</span>
          <div className="segmented" role="group" aria-labelledby="theme-l">
            {(['system', 'light', 'dark'] as ThemePref[]).map((t) => (
              <button key={t} type="button" aria-pressed={state.prefs.theme === t} onClick={() => setTheme(t)}>{t[0]?.toUpperCase()}{t.slice(1)}</button>
            ))}
          </div>
          <p className="hint">System follows your device. Animations are reduced automatically when your device asks for reduced motion.</p>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="lbl" htmlFor="goal">Daily goal (study items)</label>
          <input id="goal" className="input" type="number" min={1} max={200} value={state.prefs.dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))} style={{ maxWidth: 140 }} />
          <p className="hint">An item is a question answered, a flashcard rated, or a lesson completed.</p>
        </div>
      </section>

      <section className="card setup section" aria-labelledby="data-h">
        <h2 id="data-h" style={{ fontSize: '1.2rem' }}>Your data</h2>
        <p className="muted">
          Everything lives in this browser’s local storage: {LESSONS.filter((l) => state.lessons[l.id]?.done).length} lessons completed, {Object.keys(state.q).length} questions attempted, {state.results.length} saved sessions. Nothing is sent to a server, and there are no accounts.
        </p>
        {!isPersisting() && <p className="chip warn" role="alert" style={{ whiteSpace: 'normal' }}>Your browser is blocking local storage, so progress will be lost when you close this tab. Export a backup to keep it.</p>}
        <div className="btn-row">
          <button type="button" className="btn secondary" onClick={download}><Icon name="download" /> Export progress</button>
          <button type="button" className="btn secondary" onClick={() => fileRef.current?.click()}><Icon name="upload" /> Import progress</button>
          <button type="button" className="btn danger" onClick={() => setConfirm(true)}><Icon name="trash" /> Reset progress</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-label="Choose a CloudPilled export file" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        {msg && <p role="status" className={`chip ${msg.ok ? 'good' : 'bad'}`} style={{ marginTop: 12, whiteSpace: 'normal' }}>{msg.text}</p>}
        {state.legacyImported && <p className="small muted" style={{ marginTop: 12 }}>Some of your CloudPilled v1 data (theme, daily activity, known services, flashcard schedule) was carried over. v1 quiz statistics used a different question set and domain scheme, so they could not be mapped and were left untouched in your browser.</p>}
      </section>

      <section className="card section about" aria-labelledby="about-h">
        <div className="about-row">
          <div>
            <p className="eyebrow">About</p>
            <h2 id="about-h" style={{ fontSize: '1.2rem', marginBottom: 6 }}>CloudPilled v3</h2>
            <p className="muted" style={{ margin: 0 }}>Open source, no accounts, no tracking. Star the repo, read the code, or send a fix.</p>
          </div>
          <a className="btn github-btn" href="https://github.com/ztxv/CloudPilled-v2" target="_blank" rel="noopener noreferrer">
            <GithubIcon />
            View on GitHub
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </section>

      <section className="card section" aria-labelledby="src-h">
        <h2 id="src-h" style={{ fontSize: '1.2rem' }}>Sources and currency</h2>
        <p>
          CloudPilled v3 follows the <b>{EXAM.name} ({EXAM.code})</b> exam guide, version 1.0. The exam code, domains, weights ({[24, 30, 34, 12].join('% / ')}%), and {EXAM.totalQuestions}-question / {EXAM.minutes}-minute format were checked against AWS’s official pages on {EXAM.verifiedOn}.
        </p>
        <p className="small">
          <ExtLink href={EXAM.guideUrl}>Exam guide (PDF)</ExtLink> · <ExtLink href={EXAM.pageUrl}>Certification page</ExtLink>
        </p>
        <h3 style={{ fontSize: '1rem', marginTop: 16 }}>Where AWS has moved since the exam guide</h3>
        <ul className="small">
          <li><b>Support plans:</b> AWS’s current Support pages list Basic, Business Support+, Enterprise Support, and Unified Operations, and announce that Developer, Business, and Enterprise On-Ramp end on January 1, 2027. The exam guide still names the older plans, so lessons teach the tiers and flag both names.</li>
          <li><b>AWS IQ:</b> listed in the guide; AWS reports it was discontinued on May 28, 2026.</li>
          <li><b>AWS Snowball:</b> listed in the guide as part of the Snow Family; AWS announces end of support in commercial Regions on December 31, 2026.</li>
          <li><b>AWS Cloud9:</b> listed in the guide; AWS documents it as no longer available to new customers.</li>
        </ul>
        <p className="small muted">Content: {LESSONS.length} lessons · {QUESTIONS.length} practice questions · {DECK.length} flashcards · {ATLAS.length} atlas entries. Unofficial study aid; not affiliated with or endorsed by AWS. All questions are original.</p>
      </section>

      <ConfirmDialog
        open={confirm}
        title="Reset all progress?"
        confirmLabel="Reset everything"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => { resetProgress(); setConfirm(false); setMsg({ ok: true, text: 'Progress reset.' }); }}
      >
        This deletes your completed lessons, answer history, mock results, and streak from this browser. Export first if you might want it back.
      </ConfirmDialog>
    </div>
  );
}
