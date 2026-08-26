import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, GitMerge, Settings, FileText, BarChart2, Brain, CalendarClock, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-bg-deep text-canvas-white font-geist selection:bg-muted-cyan/30 overflow-hidden">
      
      {mobileNavOpen ? (
        <button type="button" className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation overlay" />
      ) : null}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-bg-deep/95 shadow-elevation-2 backdrop-blur-xl transition-transform duration-200 md:relative md:z-20 md:translate-x-0 md:bg-white/[0.02] ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Area */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-muted-cyan to-blue-400 flex items-center justify-center shadow-[0_0_15px_rgba(88,166,255,0.3)]">
              <GitMerge className="w-4 h-4 text-bg-deep" />
            </div>
            <span className="font-semibold tracking-tight text-[15px]">GitMentor</span>
          </div>
          <button type="button" className="p-2 text-muted-steel hover:text-canvas-white md:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <NavItem to="/workspace" icon={<LayoutDashboard size={18} />} label="Focus Workspace" onNavigate={() => setMobileNavOpen(false)} />
          <NavItem to="/analytics" icon={<BarChart2 size={18} />} label="Analytics" onNavigate={() => setMobileNavOpen(false)} />
          <NavItem to="/skills" icon={<Brain size={18} />} label="Skill Profile" onNavigate={() => setMobileNavOpen(false)} />
          <NavItem to="/roadmap" icon={<Target size={18} />} label="Roadmap" onNavigate={() => setMobileNavOpen(false)} />
          <NavItem to="/build-days" icon={<CalendarClock size={18} />} label="Build Days" onNavigate={() => setMobileNavOpen(false)} />
          <NavItem to="/repositories" icon={<FileText size={18} />} label="Repositories" onNavigate={() => setMobileNavOpen(false)} />
          <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" onNavigate={() => setMobileNavOpen(false)} />
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-bg-deep/95 px-4 backdrop-blur-xl md:hidden">
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-muted-steel hover:text-canvas-white" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={18} /></button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-muted-cyan to-blue-400"><GitMerge size={14} className="text-bg-deep" /></div>
            <span className="text-sm font-semibold">GitMentor</span>
          </div>
          <div className="h-9 w-9" aria-hidden="true" />
        </header>

        {/* Main Content Area */}
        <main className="relative flex-1 overflow-auto bg-bg-deep">
        {/* Ambient Background Blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-muted-cyan/[0.03] blur-[100px] animate-blob" />
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-purple-500/[0.03] blur-[100px] animate-blob-delay-2" />
          <div className="absolute -bottom-40 right-1/3 w-[450px] h-[450px] rounded-full bg-indigo-500/[0.02] blur-[100px] animate-blob-delay-4" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-full max-w-[1200px] flex-col p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
        </main>
      </div>
      
    </div>
  );
};

const NavItem = ({ to, icon, label, onNavigate }) => {
  return (
    <NavLink
      to={to}
      end={to === '/workspace'}
      onClick={onNavigate}
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
