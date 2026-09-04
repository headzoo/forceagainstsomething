'use client';

import { type FormEvent, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

type AuthMode = 'sign-in' | 'sign-up';

export function AuthControl() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!session) return;

    let active = true;
    fetch('/api/account/context')
      .then(async (response) => response.ok ? await response.json() as { isAdmin?: boolean } : null)
      .then((data) => { if (active) setIsAdmin(Boolean(data?.isAdmin)); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [session]);

  function showAuth(nextMode: AuthMode) {
    setMode(nextMode);
    setError('');
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const name = String(form.get('name') ?? '').trim();

    const result = mode === 'sign-up'
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password, rememberMe: true });

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? 'We could not complete that request. Please try again.');
      return;
    }

    setOpen(false);
  }

  if (sessionPending) {
    return <span className="auth-loading" aria-label="Checking account status" />;
  }

  if (session) {
    return (
      <div className="account-control">
        {isAdmin && <Link href="/admin">Review</Link>}
        <span title={session.user.email}>{session.user.name}</span>
        <button type="button" onClick={() => authClient.signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <>
      <button className="auth-trigger" type="button" onClick={() => showAuth('sign-in')}>Sign in</button>
      {open && (
        <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button className="auth-close" type="button" onClick={() => setOpen(false)} aria-label="Close account dialog">×</button>
            <p className="eyebrow"><span /> YOUR ACCOUNT</p>
            <h2 id={titleId}>{mode === 'sign-up' ? 'Join the force.' : 'Welcome back.'}</h2>
            <p className="auth-intro">
              {mode === 'sign-up'
                ? 'Create your account with an email and password.'
                : 'Sign in to your Force Against Something account.'}
            </p>
            <form onSubmit={handleSubmit}>
              {mode === 'sign-up' && (
                <label>
                  Name
                  <input name="name" type="text" autoComplete="name" required autoFocus />
                </label>
              )}
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required autoFocus={mode === 'sign-in'} />
              </label>
              <label>
                Password
                <input name="password" type="password" autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} minLength={8} required />
              </label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-submit" type="submit" disabled={submitting}>
                {submitting ? 'WORKING…' : mode === 'sign-up' ? 'CREATE ACCOUNT' : 'SIGN IN'}
                <span aria-hidden="true">→</span>
              </button>
            </form>
            <p className="auth-switch">
              {mode === 'sign-up' ? 'Already have an account?' : 'New here?'}{' '}
              <button type="button" onClick={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setError(''); }}>
                {mode === 'sign-up' ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </section>
        </div>
      )}
    </>
  );
}
