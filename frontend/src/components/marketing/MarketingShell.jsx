/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  ArrowRight, BarChart3, BrainCircuit, CalendarDays, CircleCheck, GitBranch,
  GitMerge, Menu, Route, ShieldCheck, Sparkles, Target, X, Zap,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../../pages/Landing.css';

export const Logo = () => (
  <span className="mk-logo" aria-label="GitMentor home">
    <span className="mk-logo-mark"><GitMerge aria-hidden="true" /></span>
    <span>GitMentor</span>
  </span>
);

const primaryLinks = [
  ['/', 'Home'],
  ['/product', 'Product'],
  ['/how-it-works', 'How it works'],
  ['/security', 'Security'],
  ['/about', 'About'],
];

export const usePageMeta = (title, description) => {
  useEffect(() => {
    document.title = `GitMentor | ${title}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [title, description]);
};

export const MarketingShell = ({ children }) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const appTarget = user ? '/workspace' : '/login';

  return (
    <div className="mk-site">
      <a className="mk-skip" href="#marketing-main">Skip to content</a>
      <header className="mk-header">
        <div className="mk-header-inner">
          <Link to="/" className="mk-brand"><Logo /></Link>
          <nav className={`mk-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
            {primaryLinks.map(([to, label]) => <NavLink end={to === '/'} key={to} to={to} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}
            <a href="https://github.com/humaisali/GitMentor#readme" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>Docs</a>
            <Link className="mk-mobile-auth" to={appTarget} onClick={() => setMenuOpen(false)}>{user ? 'Open workspace' : 'Log in'}</Link>
          </nav>
          <div className="mk-header-actions">
            <Link className="mk-login" to={appTarget}>{user ? 'Workspace' : 'Log in'}</Link>
            <Link className="mk-button mk-button-primary mk-button-small" to={appTarget}>
              <FaGithub aria-hidden="true" /> {user ? 'Open app' : 'Start with GitHub'}
            </Link>
            <button className="mk-menu" type="button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>
      <main id="marketing-main">{children}</main>
      <Footer appTarget={appTarget} />
    </div>
  );
};

const Footer = ({ appTarget }) => (
  <footer className="mk-footer">
    <div className="mk-container mk-footer-grid">
      <div className="mk-footer-brand"><Logo /><p>AI-powered developer growth built around real repositories, real projects, and consistent practice.</p><a href="https://github.com/humaisali/GitMentor" target="_blank" rel="noreferrer"><FaGithub aria-hidden="true" /> Open source on GitHub</a></div>
      <div className="mk-footer-column"><b>Product</b><Link to="/product">Features</Link><Link to="/how-it-works">How it works</Link><Link to={appTarget}>Sign in</Link><a href="https://github.com/humaisali/GitMentor#readme" target="_blank" rel="noreferrer">Documentation</a></div>
      <div className="mk-footer-column"><b>Company</b><Link to="/about">About</Link><a href="https://github.com/humaisali/GitMentor" target="_blank" rel="noreferrer">GitHub</a><a href="https://github.com/humaisali/GitMentor/issues" target="_blank" rel="noreferrer">Feedback</a></div>
      <div className="mk-footer-column"><b>Trust</b><Link to="/security">Security</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
    </div>
  </footer>
);

export const PageHero = ({ eyebrow, title, description, children, compact = false }) => (
  <section className={`mk-page-hero ${compact ? 'is-compact' : ''}`}>
    <div className="mk-ambient mk-ambient-a" /><div className="mk-ambient mk-ambient-b" />
    <div className="mk-container mk-page-hero-inner"><span className="mk-eyebrow"><Sparkles aria-hidden="true" /> {eyebrow}</span><h1>{title}</h1><p>{description}</p>{children}</div>
  </section>
);

export const CTASection = ({ title = 'Make your GitHub tell a stronger story.', description = 'Connect your account and turn what you have built into a focused plan for what comes next.' }) => {
  const { user } = useAuth();
  return (
    <section className="mk-cta"><div className="mk-cta-grid" /><div className="mk-container mk-cta-inner"><span className="mk-eyebrow"><Zap aria-hidden="true" /> START BUILDING WITH INTENT</span><h2>{title}</h2><p>{description}</p><div className="mk-actions"><Link className="mk-button mk-button-primary" to={user ? '/workspace' : '/login'}><FaGithub aria-hidden="true" /> {user ? 'Open workspace' : 'Continue with GitHub'} <ArrowRight aria-hidden="true" /></Link><Link className="mk-button mk-button-secondary" to="/how-it-works">Explore the workflow</Link></div></div></section>
  );
};

export const ProductPreview = () => (
  <div className="mk-preview-wrap" aria-label="Preview of the GitMentor focus workspace">
    <div className="mk-product-shell">
      <div className="mk-product-topbar"><div className="mk-window-dots"><i /><i /><i /></div><span className="mk-topbar-path"><GitBranch aria-hidden="true" /> humaisali / portfolio-os</span><span className="mk-live"><i /> LIVE PROFILE</span></div>
      <div className="mk-product-layout">
        <aside className="mk-preview-nav">
          <div className="mk-preview-brand"><span><GitMerge aria-hidden="true" /></span><b>GitMentor</b></div>
          <div className="mk-nav-items"><span className="active"><Target aria-hidden="true" /> Focus</span><span><BarChart3 aria-hidden="true" /> Analytics</span><span><BrainCircuit aria-hidden="true" /> Skills</span><span><Route aria-hidden="true" /> Roadmap</span><span><CalendarDays aria-hidden="true" /> Build days</span></div>
          <div className="mk-mini-user"><span>HA</span><div><b>humaisali</b><small>Building today</small></div></div>
        </aside>
        <div className="mk-preview-main">
          <div className="mk-preview-heading"><div><small>GOOD MORNING, HUMAIS</small><h3>Your next best move.</h3></div><span className="mk-score"><b>78</b><small>SKILL SIGNAL</small></span></div>
          <div className="mk-preview-grid">
            <div className="mk-focus-card"><div className="mk-card-label"><Sparkles aria-hidden="true" /> RECOMMENDED FOCUS</div><h4>Ship the authentication layer</h4><p>Portfolio OS · Phase 2 of 5</p><div className="mk-progress"><span /></div><div className="mk-task"><CircleCheck aria-hidden="true" /><span>Define protected route strategy</span><small>12m</small></div><div className="mk-task"><span className="mk-empty-check" /><span>Add OAuth callback handling</span><small>35m</small></div><span className="mk-preview-action">Open workspace <ArrowRight aria-hidden="true" /></span></div>
            <div className="mk-insight-card"><div className="mk-card-label"><BrainCircuit aria-hidden="true" /> MENTOR SIGNAL</div><p>“Your React fundamentals are solid. This phase adds the backend integration depth your profile is missing.”</p><div className="mk-skill-row"><span>React</span><i><b style={{ width: '84%' }} /></i><small>STRONG</small></div><div className="mk-skill-row"><span>Node.js</span><i><b style={{ width: '63%' }} /></i><small>GROWING</small></div><div className="mk-skill-row"><span>Testing</span><i><b style={{ width: '38%' }} /></i><small>NEXT</small></div></div>
            <div className="mk-streak-card"><Zap aria-hidden="true" /><div><b>6 week build streak</b><small>4 sessions scheduled this month</small></div><span>+12%</span></div>
            <div className="mk-calendar-card"><CalendarDays aria-hidden="true" /><div><b>Next build day</b><small>Today · 6:00 PM · 90 min</small></div><span>READY</span></div>
          </div>
        </div>
      </div>
    </div>
    <span className="mk-preview-chip mk-chip-a"><ShieldCheck aria-hidden="true" /> Repository context mapped</span>
    <span className="mk-preview-chip mk-chip-b"><Sparkles aria-hidden="true" /> Next project ready</span>
  </div>
);

export default MarketingShell;
