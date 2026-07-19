import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, GitMerge, Settings, FileText, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-charcoal-base text-canvas-white font-geist selection:bg-muted-cyan/30">
      
      {/* Sidebar (Fixed 250px) */}
      <aside className="w-[250px] flex-shrink-0 border-r border-whisper bg-muted-surface flex flex-col">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-whisper">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-muted-cyan" />
            <span className="font-semibold tracking-tight">GitMentor</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Focus Workspace" />
          <NavItem to="/analytics" icon={<BarChart2 size={18} />} label="Analytics" />
          <NavItem to="/roadmap" icon={<Target size={18} />} label="Roadmap" />
          <NavItem to="/repositories" icon={<FileText size={18} />} label="Repositories" />
          <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>

        {/* User Profile Area */}
        <div className="p-4 border-t border-whisper">
          <div className="flex items-center gap-3 px-2 py-2">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-whisper"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-charcoal-base border border-whisper flex items-center justify-center text-xs font-mono">
                {user?.username?.substring(0, 2).toUpperCase() || 'US'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.username || 'User'}</span>
              <span className="text-xs text-muted-steel font-mono">@{user?.username || 'user'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-charcoal-base">
        <div className="max-w-[1200px] mx-auto p-8 h-full">
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
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 ${
          isActive
            ? 'bg-muted-cyan/10 text-muted-cyan border border-muted-cyan/20'
            : 'text-muted-steel hover:text-canvas-white hover:bg-charcoal-base'
        }`
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

export default DashboardLayout;
