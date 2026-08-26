import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, BookOpen, BrainCircuit, CalendarCheck, Check,
  ChevronDown, Code2, FileSearch, GitBranch, GitPullRequest, Layers3,
  MessageSquareText, Route, ShieldCheck, Sparkles, Target, Trophy, Zap,
} from 'lucide-react';
import { FaGithub, FaGoogle } from 'react-icons/fa';
import {
  CTASection, MarketingShell, ProductPreview, usePageMeta,
} from '../components/marketing/MarketingShell';
import { useAuth } from '../context/AuthContext';

const featureCards = [
  { icon: BrainCircuit, label: 'SKILL INTELLIGENCE', title: 'A profile built from evidence', body: 'See strengths, skill gaps, language depth, and role alignment derived from the repositories you have actually built.', className: 'wide' },
  { icon: Route, label: 'SMART ROADMAPS', title: 'Your next project, fully mapped', body: 'Role-aware project recommendations become phased plans with milestones, tasks, and learning materials.' },
  { icon: MessageSquareText, label: 'AI MENTOR', title: 'Help that knows the work', body: 'Ask questions with repository, roadmap, phase, and task context already in the conversation.' },
  { icon: FileSearch, label: 'REPOSITORY REVIEW', title: 'Turn code into a feedback loop', body: 'Get actionable observations, improvement areas, and suggested solutions for connected repositories.' },
  { icon: CalendarCheck, label: 'BUILD DAYS', title: 'Put growth on the calendar', body: 'Choose a pace, schedule focused sessions, and optionally sync them with Google Calendar.' },
  { icon: BarChart3, label: 'PROGRESS SIGNALS', title: 'Measure more than commits', body: 'Track project momentum, contribution consistency, skill progress, and earned achievements.', className: 'wide' },
  { icon: Trophy, label: 'ACHIEVEMENTS', title: 'Make milestones visible', body: 'Recognize meaningful portfolio, project, and consistency milestones as your body of work grows.' },
];

const faqs = [
  ['Is GitMentor another tutorial platform?', 'No. Tutorial platforms start everyone with the same curriculum. GitMentor starts with your GitHub repositories, identifies the next useful growth step, and recommends projects that add missing portfolio evidence.'],
  ['Does it create commits or contributions for me?', 'No. GitMentor never fabricates activity. It helps you plan, build, review, and finish authentic projects so your profile reflects real capability.'],
  ['What happens after I connect GitHub?', 'GitMentor creates your account, reads repository context needed by the product, builds a skill profile, and opens your private workspace. You decide when to analyze repositories or generate roadmaps.'],
  ['Do I have to connect Google Calendar?', 'No. Calendar access is optional. Connect it only if you want Build Days synchronized to Google Calendar, and disconnect it from Settings whenever you choose.'],
  ['What kind of developer is it for?', 'It is especially useful for students, self-taught developers, early-career engineers, and working developers who want to strengthen a portfolio or move toward a target role.'],
];

const Landing = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);
  usePageMeta('Build a GitHub portfolio with direction', 'GitMentor analyzes your real GitHub work and turns it into a personalized skill profile, project roadmap, and focused building system.');
  const target = user ? '/workspace' : '/login';

  return (
    <MarketingShell>
      <section className="mk-home-hero">
        <div className="mk-hero-grid" /><div className="mk-ambient mk-ambient-a" /><div className="mk-ambient mk-ambient-b" />
        <div className="mk-container mk-home-hero-inner">
          <div className="mk-hero-copy">
            <h1>Turn your GitHub into a <span>growth system.</span></h1>
            <p>GitMentor finds the signal in what you have built, shows what is missing, and gives you a practical path from your current skills to portfolio-ready proof.</p>
            <div className="mk-actions"><Link className="mk-button mk-button-primary" to={target}><FaGithub aria-hidden="true" /> {user ? 'Open workspace' : 'Start with GitHub'} <ArrowRight aria-hidden="true" /></Link><Link className="mk-button mk-button-secondary" to="/product">Explore the product</Link></div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="mk-integrations"><div className="mk-container mk-integrations-inner"><span>CONNECTED TO THE TOOLS THAT SHAPE YOUR WORK</span><div><b><FaGithub aria-hidden="true" /> GitHub</b><b><Sparkles aria-hidden="true" /> Gemini</b><b><Zap aria-hidden="true" /> Groq</b><b><FaGoogle aria-hidden="true" /> Google Calendar</b></div></div></section>

      <section className="mk-section mk-problem"><div className="mk-container mk-split-heading"><div><span className="mk-eyebrow"><Target aria-hidden="true" /> THE PROBLEM</span><h2>More commits do not automatically mean more growth.</h2></div><div><p>Most developer advice ignores the work you already have. That leaves you choosing random tutorials, rebuilding familiar projects, and hoping your profile communicates the right skills.</p><p className="mk-accent-copy">GitMentor makes the next step specific.</p></div></div><div className="mk-container mk-signal-flow"><div><span>01</span><GitBranch aria-hidden="true" /><b>Your repositories</b><p>Languages, project depth, contribution patterns, and code context.</p></div><ArrowRight className="mk-flow-arrow" aria-hidden="true" /><div><span>02</span><BrainCircuit aria-hidden="true" /><b>Your skill signal</b><p>Strengths, gaps, role alignment, and areas that need stronger evidence.</p></div><ArrowRight className="mk-flow-arrow" aria-hidden="true" /><div><span>03</span><Route aria-hidden="true" /><b>Your next build</b><p>A project roadmap designed to close the right gap through real work.</p></div></div></section>

      <section className="mk-section mk-workflow-preview"><div className="mk-container"><div className="mk-section-heading"><span className="mk-eyebrow"><Layers3 aria-hidden="true" /> ONE CONTINUOUS WORKFLOW</span><h2>Analyze. Plan. Build. Review. Repeat.</h2><p>Every part of GitMentor feeds the next, so insight becomes work and completed work becomes a stronger signal.</p></div><div className="mk-workflow-tabs"><article><span>01</span><BrainCircuit aria-hidden="true" /><h3>Understand your profile</h3><p>Repository data becomes an explainable view of your technical strengths and gaps.</p></article><article><span>02</span><Route aria-hidden="true" /><h3>Generate a roadmap</h3><p>Choose a target role and pace, then receive a buildable project plan.</p></article><article><span>03</span><Code2 aria-hidden="true" /><h3>Execute with context</h3><p>Work through tasks with curated materials and an always-available AI mentor.</p></article><article><span>04</span><GitPullRequest aria-hidden="true" /><h3>Review the evidence</h3><p>Analyze the repository, capture feedback, and let progress inform what comes next.</p></article></div><Link className="mk-text-link" to="/how-it-works">See the complete workflow <ArrowRight aria-hidden="true" /></Link></div></section>

      <section className="mk-section mk-feature-section"><div className="mk-container"><div className="mk-section-heading row"><div><span className="mk-eyebrow"><Sparkles aria-hidden="true" /> THE PRODUCT</span><h2>Everything between “what next?” and shipped.</h2></div><Link className="mk-text-link" to="/product">Explore every feature <ArrowRight aria-hidden="true" /></Link></div><div className="mk-bento">{featureCards.map(({ icon: Icon, label, title, body, className = '' }) => <article className={className} key={title}><div className="mk-card-icon"><Icon aria-hidden="true" /></div><span>{label}</span><h3>{title}</h3><p>{body}</p><i className="mk-card-glow" /></article>)}</div></div></section>

      <section className="mk-section mk-focus-showcase"><div className="mk-container mk-showcase-grid"><div className="mk-showcase-copy"><span className="mk-eyebrow"><BookOpen aria-hidden="true" /> FROM PLAN TO PRACTICE</span><h2>A workspace that keeps the next action obvious.</h2><p>Each roadmap phase brings together your goal, supporting material, AI-generated task breakdown, progress state, and scheduling controls without making you reconstruct the context every time.</p><ul><li><Check aria-hidden="true" /> Phase-based project execution</li><li><Check aria-hidden="true" /> Sticky learning materials</li><li><Check aria-hidden="true" /> Context-aware mentor chat</li><li><Check aria-hidden="true" /> Build Day scheduling</li></ul><Link className="mk-text-link" to="/product">View the execution workspace <ArrowRight aria-hidden="true" /></Link></div><div className="mk-workspace-card"><div className="mk-workspace-top"><span>PHASE 02 / AUTHENTICATION</span><b>43% complete</b></div><div className="mk-workspace-progress"><span /></div><div className="mk-workspace-body"><aside><small>LEARNING MATERIALS</small><div><BookOpen aria-hidden="true" /><span><b>OAuth 2.0 for web apps</b><small>GitHub Docs · 8 min</small></span></div><div><Code2 aria-hidden="true" /><span><b>JWT security patterns</b><small>Guide · 12 min</small></span></div></aside><main><small>ACTIONABLE TASKS</small><div className="done"><CircleCheckIcon /><span><b>Define session boundaries</b><small>Completed</small></span></div><div><i /><span><b>Implement callback exchange</b><small>In progress · 35 min</small></span></div><div><i /><span><b>Add protected route tests</b><small>Queued · 25 min</small></span></div></main></div><div className="mk-mentor-note"><Sparkles aria-hidden="true" /><p><b>Mentor note</b>Your callback handles success well. Add an explicit expired-state path before moving to tests.</p></div></div></div></section>

      <section className="mk-section mk-trust-banner"><div className="mk-container mk-trust-grid"><div><span className="mk-eyebrow"><ShieldCheck aria-hidden="true" /> TRUST THROUGH CLARITY</span><h2>Your connected accounts remain under your control.</h2><p>GitHub is your identity. Google Calendar is optional. Protected product routes require a valid session, and connected Calendar access can be revoked from Settings.</p><div className="mk-actions"><Link className="mk-button mk-button-secondary" to="/security">Security overview</Link><Link className="mk-text-link" to="/privacy">Privacy policy <ArrowRight aria-hidden="true" /></Link></div></div><div className="mk-trust-cards"><article><ShieldCheck aria-hidden="true" /><b>Authenticated workspace</b><p>Private product routes sit behind GitHub sign-in.</p></article><article><CalendarCheck aria-hidden="true" /><b>Optional integration</b><p>Calendar connection is separate and user-controlled.</p></article><article><FileSearch aria-hidden="true" /><b>Purpose-led processing</b><p>Repository context supports the features you request.</p></article></div></div></section>

      <section className="mk-section mk-faq"><div className="mk-container mk-faq-grid"><div className="mk-section-heading"><span className="mk-eyebrow"><MessageSquareText aria-hidden="true" /> FREQUENTLY ASKED</span><h2>Good tools explain themselves.</h2><p>Here is what GitMentor does, what it does not do, and what you control.</p></div><div className="mk-accordion">{faqs.map(([question, answer], index) => <article className={openFaq === index ? 'is-open' : ''} key={question}><button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}><span>{String(index + 1).padStart(2, '0')}</span><b>{question}</b><ChevronDown aria-hidden="true" /></button><div><p>{answer}</p></div></article>)}</div></div></section>
      <CTASection />
    </MarketingShell>
  );
};

const CircleCheckIcon = () => <span className="mk-task-check"><Check aria-hidden="true" /></span>;

export default Landing;
