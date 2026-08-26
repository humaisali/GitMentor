import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, Check, Database, Eye, KeyRound,
  LockKeyhole, Server, Settings, ShieldCheck, Sparkles, UserCheck,
} from 'lucide-react';
import { FaGithub as Github } from 'react-icons/fa';
import { CTASection, MarketingShell, PageHero, usePageMeta } from '../components/marketing/MarketingShell';

const practices = [
  ['Protected product routes', 'The public site remains open, while workspace routes require a valid signed-in GitMentor user.', UserCheck],
  ['Time-limited sessions', 'Application sessions are represented by signed tokens with expiration and server-side token-version checks.', KeyRound],
  ['Encrypted Calendar credentials', 'Google Calendar refresh credentials are encrypted by the application before database storage.', LockKeyhole],
  ['State-validated OAuth', 'Optional Google connection uses short-lived, one-time state records to bind the callback to the signed-in user.', ShieldCheck],
  ['User-controlled disconnection', 'Calendar access can be revoked and removed from GitMentor through the Settings experience.', Settings],
  ['Scoped application access', 'Authenticated API routes verify the requesting user before returning user-owned projects, analytics, and settings.', Eye],
];

const Security = () => {
  usePageMeta('Security', 'Understand GitMentor authentication, connected service access, credential protection, data flow, and the security controls available to users.');
  return <MarketingShell>
    <PageHero eyebrow="SECURITY OVERVIEW" title={<>Trust begins with <span>understanding the system.</span></>} description="GitMentor is transparent about what connects, what is stored, how private routes are protected, and which controls remain in your hands.">
      <div className="mk-actions"><Link className="mk-button mk-button-primary" to="/privacy">Read the Privacy Policy <ArrowRight aria-hidden="true" /></Link><a className="mk-button mk-button-secondary" href="https://github.com/humaisali/GitMentor" target="_blank" rel="noreferrer">Review the source</a></div>
    </PageHero>

    <section className="mk-security-note"><div className="mk-container"><ShieldCheck aria-hidden="true" /><p><b>A precise security statement.</b> GitMentor does not claim certifications it has not earned. This page documents protections present in the current implementation and areas users should understand before connecting accounts.</p></div></section>

    <section className="mk-section mk-data-flow"><div className="mk-container"><div className="mk-section-heading"><span className="mk-eyebrow"><Database aria-hidden="true" /> CONNECTED DATA FLOW</span><h2>What connects to GitMentor and why.</h2><p>Each connection has a defined product purpose. Google Calendar remains optional.</p></div><div className="mk-data-diagram"><article><div><Github aria-hidden="true" /></div><span><b>GitHub</b><small>Identity + repository context</small></span></article><ArrowRight aria-hidden="true" /><article className="core"><div><Sparkles aria-hidden="true" /></div><span><b>GitMentor API</b><small>Authentication + product logic</small></span></article><ArrowRight aria-hidden="true" /><article><div><Database aria-hidden="true" /></div><span><b>Application data</b><small>Projects + progress + settings</small></span></article><div className="mk-data-branch"><i /><article><div><CalendarDays aria-hidden="true" /></div><span><b>Google Calendar</b><small>Optional Build Day sync</small></span></article><article><div><Server aria-hidden="true" /></div><span><b>AI providers</b><small>Requested mentorship features</small></span></article></div></div></div></section>

    <section className="mk-section mk-practices"><div className="mk-container"><div className="mk-section-heading row"><div><span className="mk-eyebrow"><ShieldCheck aria-hidden="true" /> IMPLEMENTED PRACTICES</span><h2>Security controls across the product.</h2></div><p>These are implementation-backed practices, not marketing certifications.</p></div><div className="mk-practice-grid">{practices.map(([title, body, Icon]) => <article key={title}><div className="mk-card-icon"><Icon aria-hidden="true" /></div><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

    <section className="mk-section mk-control-table"><div className="mk-container mk-showcase-grid"><div><span className="mk-eyebrow"><Settings aria-hidden="true" /> YOUR CONTROLS</span><h2>You choose which optional services remain connected.</h2><p>GitHub is the identity provider for GitMentor. Calendar access is added separately and can be removed without deleting the GitMentor account.</p><ul><li><Check aria-hidden="true" /> Review connected status in Settings</li><li><Check aria-hidden="true" /> Disconnect Google Calendar from GitMentor</li><li><Check aria-hidden="true" /> Revoke GitHub or Google access from provider account controls</li><li><Check aria-hidden="true" /> Avoid placing secrets in repositories or mentor prompts</li></ul></div><div className="mk-control-card"><header><LockKeyhole aria-hidden="true" /><div><b>Connection controls</b><span>Available inside GitMentor Settings</span></div></header><article><div><Github aria-hidden="true" /><span><b>GitHub</b><small>Primary account identity</small></span></div><em>CONNECTED</em></article><article><div><CalendarDays aria-hidden="true" /><span><b>Google Calendar</b><small>Build Day synchronization</small></span></div><span className="mk-disconnect-preview">Disconnect</span></article><footer>Provider-level access can also be revoked from your GitHub or Google account.</footer></div></div></section>

    <section className="mk-section mk-responsible-use"><div className="mk-container"><div className="mk-section-heading"><span className="mk-eyebrow"><Eye aria-hidden="true" /> RESPONSIBLE USE</span><h2>AI guidance still needs developer judgment.</h2><p>Repository observations, roadmaps, and mentor responses may be incomplete. Review recommendations, test changes, and never submit secrets or credentials as prompt context.</p></div><div className="mk-responsibility-row"><span>01<b>Review generated guidance</b></span><span>02<b>Test before relying on changes</b></span><span>03<b>Keep secrets out of prompts</b></span><span>04<b>Report security concerns privately</b></span></div></div></section>
    <CTASection title="Grow with a system you can understand." description="Review the policies, inspect the source, and connect your GitHub when you are comfortable." />
  </MarketingShell>;
};

export default Security;
