'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { AuthControl } from '@/app/auth-control';
import { authClient } from '@/lib/auth-client';

export function AccountSettings() {
  const { data: session, isPending } = authClient.useSession();
  const [nameStatus, setNameStatus] = useState('');
  const [nameError, setNameError] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function updateName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingName(true);
    setNameError('');
    setNameStatus('');
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const result = await authClient.updateUser({ name });
    setSavingName(false);

    if (result.error) {
      setNameError(result.error.message ?? 'We could not update your name.');
      return;
    }
    setNameStatus('Your name has been updated.');
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError('');
    setPasswordStatus('');
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('currentPassword') ?? '');
    const newPassword = String(form.get('newPassword') ?? '');
    const confirmPassword = String(form.get('confirmPassword') ?? '');

    if (newPassword !== confirmPassword) {
      setSavingPassword(false);
      setPasswordError('New passwords do not match.');
      return;
    }

    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setSavingPassword(false);
    if (result.error) {
      setPasswordError(result.error.message ?? 'We could not change your password.');
      return;
    }

    event.currentTarget.reset();
    setPasswordStatus('Your password has been changed. Other sessions were signed out.');
  }

  return (
    <main className="settings-page">
      <header className="site-header">
        <Link className="brand header-brand" href="/" aria-label="Force Against Something home"><Image src="/header-wordmark-star.png" alt="Force Against Something" width={620} height={99} priority unoptimized /></Link>
        <div className="header-actions"><AuthControl /></div>
      </header>
      <section className="settings-shell">
        <div className="settings-heading">
          <p className="eyebrow"><span /> ACCOUNT</p>
          <h1>Your<br /><em>profile.</em></h1>
          <p>Keep your member details and password up to date.</p>
          <Link href="/">← Back to the directory</Link>
        </div>
        <div className="settings-panel">
          {isPending && <p className="settings-message">Checking your account…</p>}
          {!isPending && !session && <div className="settings-message"><h2>Sign in first.</h2><p>You need an account to manage these settings.</p><AuthControl /></div>}
          {session && (
            <div className="settings-stack">
              <form className="settings-form" onSubmit={updateName}>
                <div><p className="step">PROFILE</p><h2>Account details</h2></div>
                <label>Email<input type="email" value={session.user.email} readOnly /></label>
                <label>Name<input name="name" type="text" defaultValue={session.user.name} minLength={2} maxLength={100} autoComplete="name" required /></label>
                {nameError && <p className="form-error" role="alert">{nameError}</p>}
                {nameStatus && <p className="form-success" role="status">{nameStatus}</p>}
                <button className="settings-submit" type="submit" disabled={savingName}>{savingName ? 'SAVING…' : 'SAVE NAME'} <span>→</span></button>
              </form>
              <form className="settings-form" onSubmit={updatePassword}>
                <div><p className="step">SECURITY</p><h2>Change password</h2></div>
                <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
                <label>New password<input name="newPassword" type="password" minLength={8} autoComplete="new-password" required /></label>
                <label>Confirm new password<input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required /></label>
                {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
                {passwordStatus && <p className="form-success" role="status">{passwordStatus}</p>}
                <button className="settings-submit" type="submit" disabled={savingPassword}>{savingPassword ? 'CHANGING…' : 'CHANGE PASSWORD'} <span>→</span></button>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
