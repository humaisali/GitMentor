import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GitMerge } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { user } = useAuth();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleGitHubLogin = () => {
    // Redirect to our backend's GitHub OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-muted-cyan/[0.05] blur-[120px] animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/[0.04] blur-[100px] animate-blob-delay-2" />
        <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] rounded-full bg-indigo-500/[0.03] blur-[100px] animate-blob-delay-4" />
      </div>

      <Card hover={false} className="w-full max-w-md p-8 flex flex-col items-center relative z-10 shadow-elevation-4 animate-fade-in-up">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted-cyan to-blue-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(88,166,255,0.3)] animate-pulse-glow">
            <GitMerge className="w-7 h-7 text-bg-deep" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-canvas-white mb-2">GitMentor</h1>
          <p className="text-sm text-muted-steel leading-relaxed">
            Clinical precision for professional software engineering.
          </p>
        </div>

        {/* Auth Actions */}
        <div className="w-full space-y-3">
          <Button 
            variant="secondary" 
            className="w-full gap-3 py-3"
            onClick={handleGitHubLogin}
          >
            <FaGithub size={18} />
            <span>Continue with GitHub</span>
          </Button>

          <Button 
            variant="secondary" 
            className="w-full gap-3 py-3 opacity-40 cursor-not-allowed"
            disabled
          >
            <FcGoogle size={18} />
            <span>Continue with Google</span>
          </Button>
          <p className="text-center text-[11px] text-muted-steel font-mono tracking-wider">GOOGLE AUTH COMING SOON</p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-steel/60 font-mono tracking-widest">
            SECURE ENGINEERING WORKSPACE
          </p>
        </div>

      </Card>
    </div>
  );
};

export default Login;
