import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { EXAM } from '../content';
import { streak, todayCount } from '../lib/progress';
import { setTheme } from '../lib/actions';
import { useAppState } from '../lib/store';
import { Icon, Logo, type IconName } from './Icon';

const NAV: { to: string; label: string; short?: string; icon: IconName; end?: boolean; mobile?: boolean }[] = [
  { to: '/', label: 'Home', icon: 'home', end: true, mobile: true },
  { to: '/study', label: 'Study', icon: 'book', mobile: true },
  { to: '/practice', label: 'Practice', icon: 'target', mobile: true },
  { to: '/flashcards', label: 'Flashcards', short: 'Cards', icon: 'cards', mobile: true },
  { to: '/mock', label: 'Mock exam', short: 'Mock', icon: 'timer', mobile: true },
  { to: '/atlas', label: 'Atlas', icon: 'grid' },
];

const DARK_QUERY = '(prefers-color-scheme: dark)';
const subscribeSystem = (cb: () => void) => {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const systemIsDark = () => window.matchMedia(DARK_QUERY).matches;

/**
 * Resolve the theme from saved preference plus the OS setting, as state (never by reading the DOM),
 * so the toggle's icon and its next action always agree with what is on screen.
 */
function useResolvedTheme(pref: 'system' | 'light' | 'dark'): 'light' | 'dark' {
  const sysDark = useSyncExternalStore(subscribeSystem, systemIsDark, () => false);
  const resolved = pref === 'system' ? (sysDark ? 'dark' : 'light') : pref;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);
  return resolved;
}

export function Layout() {
  const state = useAppState();
  const loc = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const theme = useResolvedTheme(state.prefs.theme);

  // On navigation: back to the top, and move focus to <main> so keyboard and screen-reader users start there.
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [loc.pathname]);

  const s = streak(state);
  const dark = theme === 'dark';
  const today = todayCount(state);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <Logo />
            <span>CloudPilled</span>
            <span className="v2">v3</span>
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
            CloudPilled v3 · Aligned to {EXAM.name} ({EXAM.code}). Unofficial study aid, not affiliated with or endorsed by AWS.
          </span>
          <span>
            <Link to="/settings">Sources &amp; data</Link>
          </span>
        </div>
      </footer>

      <nav className="tabbar" aria-label="Primary">
        {NAV.filter((n) => n.mobile).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <Icon name={n.icon} />
            <span>{n.short ?? n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
