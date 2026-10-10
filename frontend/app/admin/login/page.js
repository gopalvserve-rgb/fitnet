'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { email, password } = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) return router.replace('/admin');
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Login failed');
    } catch {
      setError('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container login-box">
      <form className="form-wrap" onSubmit={onSubmit} aria-label="Admin login">
        <span className="eyebrow">Admin</span>
        <h1 style={{ fontSize: '2.4rem' }}>Sign in</h1>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <div className="field" style={{ marginBottom: 18 }}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="username" />
        </div>
        <div className="field" style={{ marginBottom: 24 }}>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
