import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Brain,
  RefreshCcw,
  Monitor,
  Server,
  Database,
  TestTube,
  Rocket,
  Building2,
  Container,
  Lightbulb,
  TrendingUp,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Code2,
  Zap,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// ── Category icon mapping ──
const getCategoryIcon = (slug) => {
  const icons = {
    frontend: Monitor,
    backend: Server,
    databases: Database,
    testing: TestTube,
    deployment: Rocket,
    architecture: Building2,
    devops: Container,
  };
  return icons[slug] || Code2;
};

// ── Category accent color mapping ──
const getCategoryColor = (slug) => {
  const colors = {
    frontend: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', bar: 'from-blue-500 to-blue-400' },
    backend: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-400' },
    databases: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', bar: 'from-violet-500 to-violet-400' },
    testing: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', bar: 'from-amber-500 to-amber-400' },
    deployment: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', bar: 'from-rose-500 to-rose-400' },
    architecture: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', bar: 'from-cyan-500 to-cyan-400' },
    devops: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', bar: 'from-orange-500 to-orange-400' },
  };
  return colors[slug] || colors.frontend;
};

// ── Level badge variant mapping ──
const getLevelVariant = (level) => {
  switch (level) {
    case 'ADVANCED': return 'success';
    case 'INTERMEDIATE': return 'primary';
    case 'BEGINNER': return 'warning';
    default: return 'default';
  }
};

// ── Language color mapping ──
const getLanguageColor = (name) => {
  const colors = {
    JavaScript: '#F7DF1E', TypeScript: '#3178C6', Python: '#3776AB', Java: '#ED8B00',
    'C#': '#239120', 'C++': '#00599C', Go: '#00ADD8', Rust: '#DEA584',
    Ruby: '#CC342D', PHP: '#777BB4', Swift: '#FA7343', Kotlin: '#7F52FF',
    HTML: '#E34F26', CSS: '#1572B6', Shell: '#89E051', Dart: '#0175C2',
  };
  return colors[name] || '#94A3B8';
};

// ── Animated Score Ring (SVG) ──
const ScoreRing = ({ score, size = 160, strokeWidth = 10 }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getScoreColor = (s) => {
    if (s >= 70) return { stroke: '#10B981', glow: 'rgba(16,185,129,0.3)' };
    if (s >= 40) return { stroke: '#06B6D4', glow: 'rgba(6,182,212,0.3)' };
    return { stroke: '#F59E0B', glow: 'rgba(245,158,11,0.3)' };
  };

  const color = getScoreColor(animatedScore);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth={strokeWidth}
        />
        {/* Animated progress ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 8px ${color.glow})`,
          }}
        />
      </svg>
      {/* Center score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-canvas-white tabular-nums">{animatedScore}</span>
        <span className="text-xs text-muted-steel font-mono tracking-widest mt-0.5">/ 100</span>
      </div>
    </div>
  );
};

// ── Animated Progress Bar ──
const ProgressBar = ({ score, gradient, delay = 0 }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 200 + delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        style={{
          width: `${width}%`,
          transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );
};

// ── Empty State CTA ──
const EmptyState = ({ onAssess, assessing }) => (
  <div className="flex-1 flex items-center justify-center py-20 animate-fade-in-up">
    <Card hover={false} className="max-w-lg w-full p-10 text-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-muted-cyan/[0.06] rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/[0.06] rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <div className="relative z-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted-cyan to-blue-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] animate-pulse-glow">
          <Brain size={36} className="text-bg-deep" />
        </div>
        <h2 className="text-2xl font-semibold text-canvas-white mb-3 tracking-tight">
          Discover Your Developer DNA
        </h2>
        <p className="text-muted-steel text-[15px] leading-relaxed mb-8 max-w-sm mx-auto">
          Let AI analyze your GitHub repositories, contribution patterns, and tech stack to generate a comprehensive skill profile with gap analysis.
        </p>
        <Button
          onClick={onAssess}
          disabled={assessing}
          className="px-6 py-3 bg-gradient-to-r from-muted-cyan to-blue-400 text-bg-deep font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {assessing ? (
            <>
              <RefreshCcw size={18} className="animate-spin mr-2" />
              Analyzing Your Profile...
            </>
          ) : (
            <>
              <Sparkles size={18} className="mr-2" />
              Analyze My Skills
            </>
          )}
        </Button>
      </div>
    </Card>
  </div>
);

// ── Main Page Component ──
const SkillProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('gitmentor_token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Fetch existing profile ──
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/skills/profile`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else if (res.status === 404) {
        setProfile(null); // No profile yet
      } else {
        throw new Error('Failed to load skill profile');
      }
    } catch (err) {
      console.error('Error fetching skill profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Run new assessment ──
  const runAssessment = async () => {
    try {
      setAssessing(true);
      setError(null);
      const res = await fetch(`${API_BASE}/skills/assess`, { method: 'POST', headers });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Assessment failed');
      }
    } catch (err) {
      console.error('Error running assessment:', err);
      setError(err.message);
    } finally {
      setAssessing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <header className="mb-2 shrink-0 animate-fade-in-up">
          <Skeleton className="h-9 w-56 mb-2" />
          <Skeleton className="h-5 w-80" />
        </header>
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52" />)}
        </div>
      </div>
    );
  }

  // ── Empty State (no profile) ──
  if (!profile) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <header className="mb-2 shrink-0 animate-fade-in-up">
          <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">
            Skill <span className="bg-gradient-to-r from-muted-cyan to-blue-400 bg-clip-text text-transparent">Profile</span>
          </h1>
          <p className="text-muted-steel mt-1 font-mono text-sm">AI-powered skill assessment and gap analysis.</p>
        </header>

        {error && (
          <div className="flex items-center gap-2 p-4 glass-surface border-red-500/20 text-red-400 text-sm rounded-xl animate-fade-in-up">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <EmptyState onAssess={runAssessment} assessing={assessing} />
      </div>
    );
  }

  // ── Profile Loaded ──
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <header className="flex justify-between items-end mb-2 shrink-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">
            Skill <span className="bg-gradient-to-r from-muted-cyan to-blue-400 bg-clip-text text-transparent">Profile</span>
          </h1>
          <p className="text-muted-steel mt-1 font-mono text-sm">AI-powered skill assessment and gap analysis.</p>
        </div>
        <button
          onClick={runAssessment}
          disabled={assessing}
          className="flex items-center gap-2 px-4 py-2.5 glass-surface hover:border-muted-cyan/20 hover:shadow-[0_0_15px_rgba(88,166,255,0.1)] text-sm font-medium transition-all duration-300 disabled:opacity-50 rounded-xl"
        >
          <RefreshCcw size={16} className={assessing ? 'animate-spin' : ''} />
          {assessing ? 'Re-Assessing...' : 'Re-Assess'}
        </button>
      </header>

      {error && (
        <div className="flex items-center gap-2 p-4 glass-surface border-red-500/20 text-red-400 text-sm rounded-xl animate-fade-in-up">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 1: Hero — Overall Assessment       */}
      {/* ═══════════════════════════════════════════ */}
      <Card hover={false} className="p-8 relative overflow-hidden animate-fade-in-up stagger-1">
        {/* Ambient blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-muted-cyan/[0.05] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3 animate-blob" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/[0.05] rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3 animate-blob-delay-2" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          {/* Score Ring */}
          <div className="shrink-0">
            <ScoreRing score={profile.overallScore} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
              <h2 className="text-2xl font-semibold text-canvas-white tracking-tight">Overall Assessment</h2>
              <Badge variant={getLevelVariant(profile.overallLevel)} className="text-sm px-3 py-1">
                {profile.overallLevel}
              </Badge>
            </div>
            <p className="text-muted-steel text-[15px] leading-relaxed max-w-xl mb-4">
              {profile.summary}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-steel font-mono justify-center md:justify-start">
              <span className="flex items-center gap-1.5">
                <Code2 size={13} /> {profile.repositoriesAnalyzed} repos analyzed
              </span>
              <span className="flex items-center gap-1.5">
                <Zap size={13} /> {profile.categories?.length || 0} categories
              </span>
              <span className="flex items-center gap-1.5">
                Assessed {new Date(profile.assessedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 2: Skill Categories Gap Analysis   */}
      {/* ═══════════════════════════════════════════ */}
      <div className="animate-fade-in-up stagger-2">
        <h2 className="text-lg font-medium text-canvas-white tracking-tight mb-4 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted-cyan/10 flex items-center justify-center border border-muted-cyan/20">
            <TrendingUp size={16} className="text-muted-cyan" />
          </div>
          Skill Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(profile.categories || []).map((cat, index) => {
            const Icon = getCategoryIcon(cat.slug);
            const color = getCategoryColor(cat.slug);
            return (
              <Card key={cat.slug} className={`p-5 flex flex-col gap-4 animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center border ${color.border}`}>
                      <Icon size={20} className={color.text} />
                    </div>
                    <div>
                      <h3 className="font-medium text-canvas-white text-sm">{cat.name}</h3>
                      <Badge variant={getLevelVariant(cat.level)} className="mt-0.5 text-[10px]">{cat.level}</Badge>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-canvas-white tabular-nums">{cat.score}</span>
                </div>

                {/* Progress Bar */}
                <ProgressBar score={cat.score} gradient={color.bar} delay={index * 100} />

                {/* Description */}
                <p className="text-xs text-muted-steel leading-relaxed line-clamp-3">{cat.description}</p>

                {/* Strengths & Gaps */}
                <div className="flex flex-col gap-2 mt-auto">
                  {cat.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cat.strengths.slice(0, 4).map(s => (
                        <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {cat.gaps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cat.gaps.slice(0, 4).map(g => (
                        <span key={g} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 3 & 4: Languages + Recommendations */}
      {/* ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up stagger-4">
        {/* Language Proficiency */}
        <Card className="p-6 flex flex-col">
          <h2 className="text-lg font-medium text-canvas-white tracking-tight mb-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <Code2 size={16} className="text-violet-400" />
            </div>
            Language Proficiency
          </h2>
          <div className="flex flex-col gap-4 flex-1">
            {(profile.topLanguages || []).map((lang, index) => (
              <div key={lang.name} className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getLanguageColor(lang.name) }} />
                    <span className="text-sm font-medium text-canvas-white">{lang.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted-steel">{lang.projectCount} projects</span>
                    <Badge variant={getLevelVariant(lang.proficiency)} className="text-[10px]">{lang.proficiency}</Badge>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${lang.proficiency === 'ADVANCED' ? 90 : lang.proficiency === 'INTERMEDIATE' ? 60 : 30}%`,
                      backgroundColor: getLanguageColor(lang.name),
                      opacity: 0.8,
                      transitionDelay: `${index * 100 + 300}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!profile.topLanguages || profile.topLanguages.length === 0) && (
              <div className="text-sm text-muted-steel text-center py-4">No language data available.</div>
            )}
          </div>
        </Card>

        {/* AI Recommendations */}
        <Card className="p-6 flex flex-col relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-muted-cyan/[0.04] rounded-full blur-[60px] pointer-events-none animate-blob-delay-4" />

          <h2 className="text-lg font-medium text-canvas-white tracking-tight mb-5 flex items-center gap-2.5 relative z-10">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Lightbulb size={16} className="text-amber-400" />
            </div>
            Growth Recommendations
          </h2>
          <div className="flex flex-col gap-3 flex-1 relative z-10">
            {(profile.recommendations || []).map((rec, index) => (
              <div
                key={index}
                className={`flex gap-3 p-4 glass-surface hover:border-muted-cyan/20 hover:shadow-[0_0_15px_rgba(88,166,255,0.08)] hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
              >
                <div className="w-7 h-7 rounded-lg bg-muted-cyan/10 flex items-center justify-center border border-muted-cyan/20 shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-muted-cyan">{index + 1}</span>
                </div>
                <p className="text-sm text-muted-steel leading-relaxed flex-1">{rec}</p>
              </div>
            ))}
            {(!profile.recommendations || profile.recommendations.length === 0) && (
              <div className="text-sm text-muted-steel text-center py-4">No recommendations available.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SkillProfile;
