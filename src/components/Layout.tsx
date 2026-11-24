import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { EXAM } from '../content';
import { streak, todayCount } from '../lib/progress';
import { setTheme } from '../lib/actions';
import { useAppState } from '../lib/store';
import { Icon, Logo, type IconName } from './Icon';

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/study', label: 'Study', icon: 'book' },
  { to: '/practice', label: 'Practice', icon: 'target' },
  { to: '/mock', label: 'Mock exam', icon: 'timer' },
  { to: '/atlas', label: 'Atlas', icon: 'grid' },
];

function useApplyTheme(pref: 'system' | 'light' | 'dark') {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'system' && mq.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);
}

export function Layout() {
  const state = useAppState();
  const loc = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useApplyTheme(state.prefs.theme);

  // On navigation: back to the top, and move focus to <main> so keyboard and screen-reader users start there.
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [loc.pathname]);

  const s = streak(state);
  const dark = document.documentElement.dataset.theme === 'dark';
  const today = todayCount(state);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <Logo />
            <span>CloudPilled</span>
            <span className="v2">v2</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="topbar-actions">
            <Link to="/progress" className={`streak-chip${s.current === 0 ? ' dim' : ''}`} title={`${today} study items today`}>
              <Icon name="flame" />
              <b>{s.current}</b>
              <span className="lbl">day streak</span>
            </Link>
            <button
              type="button"
              className="icon-btn"
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={() => setTheme(dark ? 'light' : 'dark')}
            >
              <Icon name={dark ? 'sun' : 'moon'} />
            </button>
            <Link to="/settings" className="icon-btn" aria-label="Settings">
              <Icon name="settings" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1}>
        <div key={loc.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="container row">
          <span>
            CloudPilled v2 · Aligned to {EXAM.name} ({EXAM.code}). Unofficial study aid, not affiliated with or endorsed by AWS.
          </span>
          <span>
            <Link to="/settings">Sources &amp; data</Link>
          </span>
        </div>
      </footer>

      <nav className="tabbar" aria-label="Primary">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <Icon name={n.icon} />
            <span>{n.label === 'Mock exam' ? 'Mock' : n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
