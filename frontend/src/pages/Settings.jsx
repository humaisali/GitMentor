import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { LogOut, User, Link2 } from 'lucide-react';
import { calendarApi } from '../services/calendarApi';

const Settings = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [calendarWorking, setCalendarWorking] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState('');
  const calendarConnected = user?.googleCalendar
    ? Boolean(user.googleCalendar.connected)
    : Boolean(user?.googleId);

  const connectCalendar = async () => {
    setCalendarWorking(true);
    setCalendarMessage('');
    try {
      const { authorizationUrl } = await calendarApi.connect('/settings');
      window.location.href = authorizationUrl;
    } catch (error) {
      setCalendarMessage(error.message);
      setCalendarWorking(false);
    }
  };

  const disconnectCalendar = async () => {
    if (!window.confirm('Disconnect Google Calendar? Existing events will remain in Google Calendar.')) return;
    setCalendarWorking(true);
    try {
      const result = await calendarApi.disconnect();
      await refreshUser();
      setCalendarMessage(result.warning || result.message || 'Google Calendar disconnected.');
    } catch (error) {
      setCalendarMessage(error.message);
    } finally {
      setCalendarWorking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto h-full">
      <header className="mb-2 shrink-0 animate-fade-in-up">
        <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">
          <span className="bg-gradient-to-r from-muted-cyan to-blue-400 bg-clip-text text-transparent">Settings</span>
        </h1>
        <p className="text-muted-steel mt-1 font-mono text-sm">Account and configuration.</p>
      </header>

      {/* Profile Section */}
      <Card className="p-6 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.08]">
            <User size={14} className="text-muted-steel" />
          </div>
          <h2 className="text-sm font-medium text-muted-steel uppercase tracking-wider">Profile</h2>
        </div>

        <div className="flex items-center gap-5">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-16 h-16 rounded-2xl border border-white/[0.08] shadow-elevation-2"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-bg-base border border-white/[0.08] flex items-center justify-center text-lg font-mono text-muted-steel shadow-elevation-2">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-xl font-medium text-canvas-white">{user?.username || 'Unknown'}</span>
            <span className="text-xs font-mono text-muted-steel">@{user?.username || 'user'}</span>
            <span className="text-[11px] font-mono text-muted-steel mt-1">ID: {user?.githubId || user?._id || 'N/A'}</span>
          </div>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="p-6 animate-fade-in-up stagger-2">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center border border-white/[0.08]">
            <Link2 size={14} className="text-muted-steel" />
          </div>
          <h2 className="text-sm font-medium text-muted-steel uppercase tracking-wider">Connected Accounts</h2>
        </div>

        <div className="space-y-3">
          {/* GitHub */}
          <div className="flex items-center justify-between p-4 glass-surface transition-all duration-300 hover:border-muted-cyan/15 hover:shadow-[0_0_12px_rgba(88,166,255,0.06)]">
            <div className="flex items-center gap-3">
              <FaGithub size={20} className="text-canvas-white" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-canvas-white">GitHub</span>
                <span className="text-xs font-mono text-muted-steel">@{user?.username || 'user'}</span>
              </div>
            </div>
            <Badge variant="success">CONNECTED</Badge>
          </div>

          {/* Google */}
          <div className={`flex items-center justify-between p-4 glass-surface transition-all duration-300 ${!calendarConnected ? 'opacity-80' : 'hover:border-muted-cyan/15 hover:shadow-[0_0_12px_rgba(88,166,255,0.06)]'}`}>
            <div className="flex items-center gap-3">
              <FcGoogle size={20} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-canvas-white">Google Calendar</span>
                <span className="text-xs font-mono text-muted-steel">
                  {calendarConnected ? (user?.googleCalendar?.email || 'Linked') : 'Not linked'}
                </span>
              </div>
            </div>
            {calendarConnected ? (
              <div className="flex items-center gap-2">
                <Badge variant="success">CONNECTED</Badge>
                <Button variant="ghost" className="text-xs h-7 text-red-400" disabled={calendarWorking} onClick={disconnectCalendar}>Disconnect</Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                className="text-xs h-7"
                disabled={calendarWorking}
                onClick={connectCalendar}
              >
                {user?.googleCalendar?.status === 'RECONNECT_REQUIRED' ? 'Reconnect' : 'Connect'}
              </Button>
            )}
          </div>
        </div>
        {calendarMessage && <p className="text-xs text-muted-steel mt-3">{calendarMessage}</p>}
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-500/15 shadow-[0_0_20px_rgba(239,68,68,0.05)] animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-red-400">Danger Zone</h2>
            <p className="text-xs text-muted-steel mt-1">Log out of your GitMentor session.</p>
          </div>
          <Button
            variant="ghost"
            className="gap-2 text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
