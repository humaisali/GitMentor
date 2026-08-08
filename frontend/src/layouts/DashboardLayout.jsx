import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, GitMerge, Settings, FileText, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-bg-deep text-canvas-white font-geist selection:bg-muted-cyan/30 overflow-hidden">
      
      {/* Sidebar (Fixed 250px) — Glassmorphic */}
      <aside className="w-[250px] flex-shrink-0 bg-white/[0.02] backdrop-blur-xl border-r border-white/[0.06] flex flex-col relative z-20 shadow-elevation-2">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-muted-cyan to-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(88,166,255,0.3)]">
              <GitMerge className="w-4 h-4 text-bg-deep" />
            </div>
            <span className="font-semibold tracking-tight text-[15px]">GitMentor</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Focus Workspace" />
          <NavItem to="/analytics" icon={<BarChart2 size={18} />} label="Analytics" />
          <NavItem to="/roadmap" icon={<Target size={18} />} label="Roadmap" />
          <NavItem to="/repositories" icon={<FileText size={18} />} label="Repositories" />
          <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>

        {/* User Profile Area */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] transition-all hover:bg-white/[0.06]">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-white/[0.1] shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-bg-base border border-white/[0.1] flex items-center justify-center text-xs font-mono text-muted-steel">
                {user?.username?.substring(0, 2).toUpperCase() || 'US'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-tight">{user?.username || 'User'}</span>
              <span className="text-[11px] text-muted-steel font-mono">@{user?.username || 'user'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto relative bg-bg-deep">
        {/* Ambient Background Blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-muted-cyan/[0.03] blur-[100px] animate-blob" />
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-purple-500/[0.03] blur-[100px] animate-blob-delay-2" />
          <div className="absolute -bottom-40 right-1/3 w-[450px] h-[450px] rounded-full bg-indigo-500/[0.02] blur-[100px] animate-blob-delay-4" />
        </div>

        <div className="max-w-[1200px] mx-auto p-8 min-h-full flex flex-col relative z-10">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
};

const NavItem = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${
          isActive
            ? 'bg-muted-cyan/[0.08] text-muted-cyan border border-muted-cyan/20 shadow-[0_0_15px_rgba(88,166,255,0.08)]'
            : 'text-muted-steel hover:text-canvas-white hover:bg-white/[0.04] border border-transparent'
        }`
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

export default DashboardLayout;
