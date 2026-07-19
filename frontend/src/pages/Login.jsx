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
    <div className="min-h-screen bg-charcoal-base flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-lg bg-charcoal-base border border-whisper flex items-center justify-center mb-6">
            <GitMerge className="w-6 h-6 text-canvas-white" />
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
            className="w-full gap-3 py-2.5"
            onClick={handleGitHubLogin}
          >
            <FaGithub size={18} />
            <span>Continue with GitHub</span>
          </Button>

          <Button 
            variant="secondary" 
            className="w-full gap-3 py-2.5 opacity-50 cursor-not-allowed"
            disabled
          >
            <FcGoogle size={18} />
            <span>Continue with Google</span>
          </Button>
          <p className="text-center text-[11px] text-muted-steel font-mono">GOOGLE AUTH COMING SOON</p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-steel font-mono">
            SECURE ENGINEERING WORKSPACE
          </p>
        </div>

      </Card>
    </div>
  );
};

export default Login;
