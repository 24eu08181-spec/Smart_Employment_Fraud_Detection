import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updatedUser = await updateProfile({ fullName, email });
      setFullName(updatedUser.fullName);
      setEmail(updatedUser.email);
      setMessage('Your account details have been saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your account details.');
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not log out. Please try again.');
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-cyan-300">Account</p>
        <h2 className="mt-1 text-3xl font-bold text-white">Settings</h2>
        <p className="mt-2 text-slate-400">Manage your profile and sign-in details.</p>
      </header>

      <section className="card-surface max-w-3xl p-6 sm:p-8">
        <div className="mb-7 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-xl font-bold text-cyan-200">
            {user.fullName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">User details</h3>
            <p className="text-sm text-slate-400">Update the name and email on your account.</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={saveProfile}>
          <div>
            <label htmlFor="settings-name">Full name</label>
            <input autoComplete="name" id="settings-name" maxLength={80} minLength={2} onChange={(event) => setFullName(event.target.value)} required value={fullName} />
          </div>
          <div>
            <label htmlFor="settings-email">Email address</label>
            <input autoComplete="email" id="settings-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </div>

          {message && <p className="text-sm text-emerald-300" role="status">{message}</p>}
          {error && <p className="text-sm text-rose-300" role="alert">{error}</p>}

          <button className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60" disabled={saving} type="submit">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="card-surface flex max-w-3xl flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h3 className="font-semibold text-white">Sign out</h3>
          <p className="mt-1 text-sm text-slate-400">End your session on this device.</p>
        </div>
        <button className="rounded-xl border border-rose-400/40 px-5 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-400/10 disabled:opacity-60" disabled={loggingOut} onClick={signOut} type="button">
          {loggingOut ? 'Signing out…' : 'Log out'}
        </button>
      </section>

      <section className="card-surface max-w-3xl p-6 sm:p-8">
        <h3 className="font-semibold text-white">App information</h3>
        <p className="mt-1 text-sm text-slate-400">Learn about the detection model and this project.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link className="rounded-xl border border-slate-700 p-4 transition hover:border-cyan-500/50 hover:bg-slate-800/60" to="/model-info">
            <span className="block font-medium text-white">Model Info</span>
            <span className="mt-1 block text-sm text-slate-400">View model details and evaluation.</span>
          </Link>
          <Link className="rounded-xl border border-slate-700 p-4 transition hover:border-cyan-500/50 hover:bg-slate-800/60" to="/about">
            <span className="block font-medium text-white">About</span>
            <span className="mt-1 block text-sm text-slate-400">Learn about this fraud detection app.</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
