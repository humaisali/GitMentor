import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { LogOut, User, Link2 } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto h-full">
      <header className="mb-2 shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight text-canvas-white">Settings</h1>
        <p className="text-muted-steel mt-1 font-mono text-sm">Account and configuration.</p>
      </header>

      {/* Profile Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={16} className="text-muted-steel" />
          <h2 className="text-sm font-medium text-muted-steel uppercase tracking-wider">Profile</h2>
        </div>

        <div className="flex items-center gap-5">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-16 h-16 rounded-full border border-whisper"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-charcoal-base border border-whisper flex items-center justify-center text-lg font-mono text-muted-steel">
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
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Link2 size={16} className="text-muted-steel" />
          <h2 className="text-sm font-medium text-muted-steel uppercase tracking-wider">Connected Accounts</h2>
        </div>

        <div className="space-y-3">
          {/* GitHub */}
          <div className="flex items-center justify-between p-3 border border-whisper rounded-md bg-charcoal-base">
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
          <div className={`flex items-center justify-between p-3 border border-whisper rounded-md bg-charcoal-base ${!user?.googleId ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
              <FcGoogle size={20} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-canvas-white">Google Calendar</span>
                <span className="text-xs font-mono text-muted-steel">
                  {user?.googleId ? 'Linked' : 'Not linked'}
                </span>
              </div>
            </div>
            {user?.googleId ? (
              <Badge variant="success">CONNECTED</Badge>
            ) : (
              <Button
                variant="outline"
                className="text-xs h-7"
                onClick={() => {
                  const token = localStorage.getItem('gitmentor_token');
                  window.location.href = `http://localhost:5000/api/auth/google?token=${token}`;
                }}
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-red-400">Danger Zone</h2>
            <p className="text-xs text-muted-steel mt-1">Log out of your GitMentor session.</p>
          </div>
          <Button
            variant="ghost"
            className="gap-2 text-red-400 hover:bg-red-500/10 border border-red-500/20"
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
