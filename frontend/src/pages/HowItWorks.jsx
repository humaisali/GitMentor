import { Link } from 'react-router-dom';
import {
  ArrowRight, BrainCircuit, CalendarDays, Check, Code2, GitMerge,
  MessageSquareText, RefreshCw, Route, ShieldCheck, Sparkles, Target,
} from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { CTASection, MarketingShell, PageHero, usePageMeta } from '../components/marketing/MarketingShell';

const steps = [
  ['Connect your GitHub identity', 'GitHub OAuth creates your GitMentor identity and unlocks the protected workspace. Your account remains the source of repository context.', FaGithub, ['GitHub username and avatar', 'Authenticated private workspace', 'Repository access for product features']],
  ['Build your skill profile', 'GitMentor evaluates the shape of your work against the role you want, then organizes the result into strengths, gaps, evidence, and next-skill priorities.', BrainCircuit, ['Role-aware assessment', 'Repository-backed evidence', 'Clear opportunity areas']],
  ['Choose a meaningful project', 'Recommendations are selected to add missing evidence to your portfolio. Pick a project and choose the pace that fits your current schedule.', Target, ['Personalized project ideas', 'Aggressive, moderate, or relaxed pace', 'Defined portfolio outcome']],
  ['Follow the generated roadmap', 'Each project is split into phases with objectives, tasks, technologies, methodologies, and learning materials.', Route, ['Phase-by-phase progression', 'Dynamic task breakdown', 'Resources next to the work']],
  ['Schedule focused Build Days', 'Turn roadmap work into calendar time. Plan sessions inside GitMentor or optionally synchronize them with Google Calendar.', CalendarDays, ['Manual or automatic scheduling', 'Roadmap-linked sessions', 'Optional Google sync']],
  ['Build with contextual help', 'The mentor assistant stays available across the product and can answer questions with the current project or repository in mind.', MessageSquareText, ['Persistent chat access', 'Project and phase context', 'Hints or detailed guidance']],
  ['Review and adapt', 'Analyze the finished repository, track progress, and use the new evidence to inform your next roadmap or skill reassessment.', RefreshCw, ['Repository feedback', 'Progress analytics', 'Continuous learning loop']],
];

const HowItWorks = () => {
  usePageMeta('How it works', 'Learn how GitMentor turns your GitHub repositories into a skill profile, personalized project roadmap, focused Build Days, and continuous feedback.');
  return <MarketingShell>
    <PageHero eyebrow="HOW GITMENTOR WORKS" title={<>From existing code to your <span>next credible skill.</span></>} description="A seven-step system turns repository evidence into a personal growth plan, then keeps the plan connected to the work you actually complete.">
      <div className="mk-actions"><Link className="mk-button mk-button-primary" to="/login">Start the first step <ArrowRight aria-hidden="true" /></Link><Link className="mk-button mk-button-secondary" to="/product">Explore features</Link></div>
    </PageHero>
    <section className="mk-section mk-journey"><div className="mk-container"><div className="mk-journey-line" />{steps.map(([title, body, Icon, bullets], index) => <article key={title}><div className="mk-step-marker"><span>{String(index + 1).padStart(2, '0')}</span><i /></div><div className="mk-step-copy"><div className="mk-card-icon"><Icon aria-hidden="true" /></div><h2>{title}</h2><p>{body}</p><ul>{bullets.map(item => <li key={item}><Check aria-hidden="true" /> {item}</li>)}</ul></div><div className="mk-step-output"><small>OUTPUT</small><StepOutput step={index} /></div></article>)}</div></section>
    <section className="mk-section mk-ai-routing"><div className="mk-container mk-showcase-grid"><div><span className="mk-eyebrow"><Sparkles aria-hidden="true" /> BEHIND THE MENTOR</span><h2>AI routing designed for continuity.</h2><p>GitMentor uses task-aware routing across configured Gemini and Groq providers, with validation, retries, and failover. The purpose is simple: keep structured assessments, roadmaps, breakdowns, and mentor answers dependable enough to remain useful.</p><ul><li><ShieldCheck aria-hidden="true" /> Schema-validated structured outputs</li><li><RefreshCw aria-hidden="true" /> Automatic retry and provider failover</li><li><Code2 aria-hidden="true" /> Task-specific model routing</li></ul></div><div className="mk-routing-diagram"><div><span>REQUEST</span><b>Generate roadmap phases</b></div><ArrowRight aria-hidden="true" /><div className="router"><GitMerge aria-hidden="true" /><b>AI Router</b><small>Task policy + validation</small></div><div className="mk-provider-lines"><article><i /><span><b>Gemini</b><small>Primary structured task</small></span></article><article><i /><span><b>Groq · Qwen</b><small>Fallback provider</small></span></article></div><div className="mk-output-line"><Check aria-hidden="true" /><span><b>Validated result</b><small>Stored in the project workspace</small></span></div></div></div></section>
    <CTASection title="Start with what you have. Build what you need." />
  </MarketingShell>;
};

const StepOutput = ({ step }) => {
  const outputs = [
    ['@humaisali', 'GitHub identity connected'], ['72 / 100', 'Full-stack skill signal'], ['Portfolio OS', 'Recommended portfolio project'], ['4 phases', '8-week moderate roadmap'], ['Tue · 6:00 PM', 'Next focused Build Day'], ['Mentor ready', 'Project context attached'], ['+12%', 'Skill signal improvement'],
  ];
  return <div><b>{outputs[step][0]}</b><span>{outputs[step][1]}</span></div>;
};

export default HowItWorks;
