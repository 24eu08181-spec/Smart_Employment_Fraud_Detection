import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function BrandPanel() {
  return (
    <section className="auth-brand-panel">
      <div className="auth-shield" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M24 3 42 10v12c0 11-7.5 19-18 23C13.5 41 6 33 6 22V10L24 3Z" fill="currentColor" />
          <path d="M18 22v-3a6 6 0 0 1 12 0v3m-14 0h16v13H16V22Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M24 27v4" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <h1>On Job Recruitment<br />Fraud Detection</h1>
      <p>Detect fake job and internship offers with AI</p>
      <div className="auth-illustration" aria-hidden="true">
        <div className="auth-document">
          <span>JOB OFFER</span>
          <i /><i /><i />
        </div>
        <div className="auth-alert">!</div>
        <div className="auth-search" />
      </div>
    </section>
  );
}

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { user, login, signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (isSignup && form.password !== form.confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const details = { email: form.email, password: form.password };
      if (isSignup) details.fullName = form.fullName;
      if (isSignup) await signup(details);
      else await login(details);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <BrandPanel />
        <section className="auth-form-panel">
          <header>
            <h2>{isSignup ? 'Create Your Account' : 'Welcome Back'}</h2>
            <p>{isSignup ? 'Get started with On Job Recruitment Fraud Detection' : 'Sign in to your account'}</p>
          </header>

          <form className="auth-form" onSubmit={submit}>
            {isSignup && (
              <label className="auth-input-wrap">
                <span aria-hidden="true">♙</span>
                <input autoComplete="name" name="fullName" onChange={updateField} placeholder="Full Name" required value={form.fullName} />
              </label>
            )}
            <label className="auth-input-wrap">
              <span aria-hidden="true">✉</span>
              <input autoComplete="email" name="email" onChange={updateField} placeholder="Email Address" required type="email" value={form.email} />
            </label>
            <label className="auth-input-wrap">
              <span aria-hidden="true">▣</span>
              <input autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={8} name="password" onChange={updateField} placeholder="Password" required type="password" value={form.password} />
            </label>
            {isSignup && (
              <label className="auth-input-wrap">
                <span aria-hidden="true">▣</span>
                <input autoComplete="new-password" minLength={8} name="confirmPassword" onChange={updateField} placeholder="Confirm Password" required type="password" value={form.confirmPassword} />
              </label>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="auth-submit" disabled={submitting} type="submit">
              {submitting ? 'Please wait…' : isSignup ? 'Create Account' : 'Login'}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link to={isSignup ? '/login' : '/signup'} state={location.state}>
              {isSignup ? 'Login' : 'Sign Up'}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
