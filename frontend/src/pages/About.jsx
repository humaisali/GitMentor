import { Link } from 'react-router-dom';
import {
  ArrowRight, BrainCircuit, CalendarDays, Check, Code2, GitMerge,
  HeartHandshake, Route, Sparkles, Target, Users,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { CTASection, MarketingShell, PageHero, usePageMeta } from '../components/marketing/MarketingShell';

const values = [
  ['Authenticity over activity', 'A credible portfolio comes from real decisions, real code, and finished projects, not manufactured contribution graphs.', GitMerge],
  ['Direction over noise', 'Good mentorship makes the next useful action clear instead of adding another endless list of things to learn.', Target],
  ['Context over generic answers', 'Advice becomes more useful when it understands the repository, roadmap, phase, and goal around the question.', BrainCircuit],
  ['Progress over perfection', 'Consistent, scoped Build Days make ambitious growth plans sustainable enough to finish.', CalendarDays],
];

const About = () => {
  usePageMeta('About', 'Learn why GitMentor exists, the principles behind its authentic developer-growth approach, its open-source foundation, and its technical architecture.');
  return <MarketingShell>
    <PageHero eyebrow="ABOUT GITMENTOR" title={<>Developer growth should feel <span>less like guesswork.</span></>} description="GitMentor exists to help developers turn the work already on GitHub into a clear understanding of where they are, with a credible plan for where to go next.">
      <div className="mk-actions"><a className="mk-button mk-button-primary" href="https://github.com/humaisali/GitMentor" target="_blank" rel="noreferrer"><FaGithub aria-hidden="true" /> View the project <ArrowRight aria-hidden="true" /></a><Link className="mk-button mk-button-secondary" to="/product">Explore the product</Link></div>
    </PageHero>

    <section className="mk-section mk-origin"><div className="mk-container mk-showcase-grid"><div><span className="mk-eyebrow"><Sparkles aria-hidden="true" /> THE IDEA</span><h2>A mentor should start by looking at your work.</h2></div><div className="mk-prose"><p>Developers are surrounded by learning paths, project lists, coding challenges, and advice. The hard part is rarely finding more content. It is knowing which skill deserves attention now and which project will actually prove that skill.</p><p>GitMentor starts with the evidence already available in your GitHub profile. It uses that context to recommend meaningful projects, shape a roadmap, support execution, and close the loop through repository feedback.</p><p>The result is not artificial activity. It is a more deliberate way to create authentic portfolio evidence.</p></div></div></section>

    <section className="mk-section mk-values"><div className="mk-container"><div className="mk-section-heading"><span className="mk-eyebrow"><HeartHandshake aria-hidden="true" /> PRODUCT PRINCIPLES</span><h2>What GitMentor is designed to protect.</h2></div><div className="mk-values-grid">{values.map(([title, body, Icon], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div className="mk-card-icon"><Icon aria-hidden="true" /></div><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

    <section className="mk-section mk-open-source"><div className="mk-container mk-showcase-grid"><div className="mk-open-source-card"><FaGithub aria-hidden="true" /><span>OPEN SOURCE</span><b>GitMentor</b><p>React · Node.js · MongoDB · GitHub OAuth</p><div><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><a href="https://github.com/humaisali/GitMentor" target="_blank" rel="noreferrer">github.com/humaisali/GitMentor <ArrowRight aria-hidden="true" /></a></div><div><span className="mk-eyebrow"><Code2 aria-hidden="true" /> BUILT IN THE OPEN</span><h2>The product and its implementation can be inspected.</h2><p>GitMentor is an open-source full-stack project. Its application architecture, data models, routes, AI task policies, calendar synchronization, and interface code are available in the repository.</p><ul><li><Check aria-hidden="true" /> Transparent implementation</li><li><Check aria-hidden="true" /> Reproducible local setup</li><li><Check aria-hidden="true" /> Issue-based feedback and contribution</li></ul></div></div></section>

    <section className="mk-section mk-architecture"><div className="mk-container"><div className="mk-section-heading row"><div><span className="mk-eyebrow"><Route aria-hidden="true" /> SYSTEM ARCHITECTURE</span><h2>A focused full-stack foundation.</h2></div><p>Each layer has a specific role in the developer growth loop.</p></div><div className="mk-architecture-grid"><article><small>INTERFACE</small><b>React 19 + Vite</b><p>Protected workspace, roadmaps, repositories, analytics, calendar, and public product site.</p></article><article><small>APPLICATION</small><b>Node.js + Express</b><p>Authentication, user settings, repository operations, roadmaps, insights, and analytics.</p></article><article><small>INTELLIGENCE</small><b>Gemini + Groq</b><p>Task-aware AI routing, schema validation, retries, and automatic provider failover.</p></article><article><small>DATA</small><b>MongoDB</b><p>User profiles, repositories, projects, insights, sessions, skill progress, and analytics.</p></article><article><small>CONNECTIONS</small><b>GitHub + Google</b><p>Identity, repository data, contributions, and optional Build Day calendar synchronization.</p></article></div></div></section>

    <section className="mk-section mk-future"><div className="mk-container mk-showcase-grid"><div><span className="mk-eyebrow"><Users aria-hidden="true" /> WHO IT IS FOR</span><h2>Built for developers creating their next opportunity.</h2><p>Students, self-taught builders, early-career engineers, and developers moving toward a new role all face the same question: what should I build next so my skills become visible?</p></div><div className="mk-audience-list"><span><b>01</b>Students building beyond coursework</span><span><b>02</b>Self-taught developers shaping a portfolio</span><span><b>03</b>Early-career engineers closing skill gaps</span><span><b>04</b>Working developers targeting a new role</span></div></div></section>
    <CTASection title="Build real proof of the developer you are becoming." />
  </MarketingShell>;
};

export default About;
