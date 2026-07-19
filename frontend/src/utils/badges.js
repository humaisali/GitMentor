import { Flame, Code2, Star, Users, GitPullRequest, Rocket, Shield, Target, TrendingUp, HeartHandshake, Bug, GitMerge } from 'lucide-react';

export const BADGES = [
  { id: 'streak_master', title: 'Streak Master', description: 'Maintain a 10-day contribution streak on GitHub.', icon: Flame, color: 'text-orange-500', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' },
  { id: 'iron_coder', title: 'Iron Coder', description: 'Maintain a massive 30-day contribution streak.', icon: Shield, color: 'text-indigo-500', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]' },
  { id: 'centurion', title: 'Centurion', description: 'Reach 100 total contributions this year.', icon: Target, color: 'text-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' },
  { id: 'polyglot', title: 'Polyglot', description: 'Use 5 or more languages across your repositories.', icon: Code2, color: 'text-purple-500', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
  { id: 'star_gazer', title: 'Star Gazer', description: 'Earn 50 or more total stars across all your public repositories.', icon: Star, color: 'text-yellow-500', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]' },
  { id: 'trend_setter', title: 'Trend Setter', description: 'Have a single repository with 50 or more stars.', icon: TrendingUp, color: 'text-teal-500', glow: 'shadow-[0_0_15px_rgba(20,184,166,0.3)]' },
  { id: 'community_builder', title: 'Community Builder', description: 'Reach 20 or more followers on GitHub.', icon: Users, color: 'text-emerald-500', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' },
  { id: 'social_butterfly', title: 'Social Butterfly', description: 'Follow 20 or more developers on GitHub.', icon: HeartHandshake, color: 'text-rose-500', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]' },
  { id: 'open_source_contributor', title: 'Open Source Contributor', description: 'Create 10 or more Pull Requests.', icon: GitPullRequest, color: 'text-blue-500', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
  { id: 'issue_hunter', title: 'Issue Hunter', description: 'Create 10 or more Issues.', icon: Bug, color: 'text-green-500', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' },
  { id: 'fork_magnet', title: 'Fork Magnet', description: 'Accumulate 20 or more forks across your repositories.', icon: GitMerge, color: 'text-pink-500', glow: 'shadow-[0_0_15px_rgba(236,72,153,0.3)]' },
  { id: 'early_adopter', title: 'Early Adopter', description: 'Join and sync your GitHub account with GitMentor.', icon: Rocket, color: 'text-muted-cyan', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]' }
];
