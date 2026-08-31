'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

function GlitterLines() {
  const lines = [
    { top: '12%', rot: '-10deg', dur: '6s', delay: '0s' },
    { top: '32%', rot: '-6deg', dur: '7.5s', delay: '1.2s' },
    { top: '55%', rot: '-12deg', dur: '5.5s', delay: '2.4s' },
    { top: '74%', rot: '-4deg', dur: '8s', delay: '.6s' },
    { top: '90%', rot: '-9deg', dur: '6.5s', delay: '3s' },
  ];
  return (
    <div className="glitter-lines">
      {lines.map((l, i) => (
        <div
          key={i}
          className="glitter-line"
          style={
            {
              top: l.top,
              '--rot': l.rot,
              '--dur': l.dur,
              '--delay': l.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default function AuthView() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { login, register } = useAuth();

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regBusy, setRegBusy] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('Enter your username and password.');
      return;
    }
    setLoginBusy(true);
    try {
      await login(loginUsername.trim(), loginPassword);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setRegError(null);
    if (!regUsername.trim() || !regEmail.trim() || !regPassword || !regConfirm) {
      setRegError('Please fill in every field.');
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    setRegBusy(true);
    try {
      await register(regUsername.trim(), regEmail.trim(), regPassword);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setRegBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="mesh-bg">
        <div className="mesh-grid" />
      </div>
      <GlitterLines />
      <div className="auth-card">
        <div className="auth-brand">
          <Image className="brand-logo-lg pulse-glow" src="/logo.png" alt="CINQ logo" width={120} height={110} />
          <span className="auth-brand-name">CINQ</span>
        </div>

        <div className="moving-border-wrap auth-mode-dropdown">
          <div className="moving-border-inner">
            <select
              className="auth-mode-select"
              value={mode}
              onChange={(e) => setMode(e.target.value as 'login' | 'register')}
            >
              <option value="login">Sign in</option>
              <option value="register">Create account</option>
            </select>
          </div>
        </div>

        {mode === 'login' ? (
          <>
            <div className="auth-heading">
              <h1>Welcome back</h1>
              <p>Sign in to continue your conversations.</p>
            </div>
            <form className="auth-form" onSubmit={handleLogin}>
              {loginError && <div className="form-error">{loginError}</div>}
              <div className="field">
                <label>Username</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loginBusy}>
                {loginBusy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-heading">
              <h1>Create your account</h1>
              <p>Start a new conversation with CINQ.</p>
            </div>
            <form className="auth-form" onSubmit={handleRegister}>
              {regError && <div className="form-error">{regError}</div>}
              <div className="field">
                <label>Username</label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label>Confirm password</label>
                <input
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={regBusy}>
                {regBusy ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
