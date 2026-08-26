import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, GitMerge, ShieldCheck } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/apiClient';
import './Login.css';

const Login = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'GitMentor | Sign in';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Sign in to GitMentor securely with GitHub and turn your repositories into a focused developer growth plan.');
  }, []);

  if (user) {
    return <Navigate to="/workspace" replace />;
  }

  const handleGitHubLogin = () => {
    window.location.assign(`${API_URL}/auth/github`);
  };

  return (
    <div className="auth-page">
      <a className="auth-skip" href="#auth-main">Skip to sign in</a>
      <div className="auth-axis auth-axis-horizontal" aria-hidden="true" />
      <div className="auth-axis auth-axis-vertical" aria-hidden="true" />

      <header className="auth-header">
        <Link className="auth-brand" to="/" aria-label="GitMentor home">
          <span><GitMerge aria-hidden="true" /></span>
          <b>GitMentor</b>
        </Link>
        <nav aria-label="Sign-in page navigation">
          <Link to="/"><ArrowLeft aria-hidden="true" /> Home</Link>
          <Link to="/product">View product</Link>
        </nav>
      </header>

      <main className="auth-main" id="auth-main">
        <section className="auth-content" aria-labelledby="auth-title">
          <div className="auth-mark" aria-hidden="true"><GitMerge /></div>
          <span className="auth-kicker">YOUR GITHUB. YOUR GROWTH PLAN.</span>
          <h1 id="auth-title">Let&apos;s connect<br />your GitHub.</h1>
          <p className="auth-subtitle">GitHub is the only identity you need. Connect once to open your private GitMentor workspace.</p>

          <button className="auth-github-button" type="button" onClick={handleGitHubLogin}>
            <FaGithub aria-hidden="true" />
            <span>Continue with GitHub</span>
            <ArrowRight aria-hidden="true" />
          </button>

          <p className="auth-security"><ShieldCheck aria-hidden="true" /> Secure GitHub OAuth. No separate password.</p>
        </section>
      </main>

      <footer className="auth-footer">
        <span>By continuing, you agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.</span>
        <span>Repository-aware mentorship</span>
      </footer>
    </div>
  );
};

export default Login;
