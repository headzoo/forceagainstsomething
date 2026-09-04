'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthControl } from '@/app/auth-control';

type Submission = {
  id: number;
  type: string;
  title: string;
  detail: string;
  description: string;
  effort: string;
  href: string;
  organization: string;
  issue: string;
  submitterName: string | null;
  submitterEmail: string | null;
  createdAt: string;
};

export function AdminReview() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/actions')
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { error?: unknown; submissions?: Submission[] };
        if (!response.ok) throw new Error(String(data.error ?? 'Could not load submissions.'));
        setSubmissions(data.submissions ?? []);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load submissions.'))
      .finally(() => setLoading(false));
  }, []);

  async function approve(id: number) {
    setApproving(id);
    setError('');
    const response = await fetch(`/api/admin/actions/${id}`, { method: 'PATCH' });
    const data = await response.json().catch(() => ({})) as { error?: unknown };
    setApproving(null);
    if (!response.ok) {
      setError(String(data.error ?? 'Could not approve that action.'));
      return;
    }
    setSubmissions((current) => current.filter((submission) => submission.id !== id));
  }

  return (
    <main className="admin-page">
      <header className="site-header">
        <Link className="brand header-brand" href="/" aria-label="Force Against Something home"><Image src="/header-wordmark-star.png" alt="Force Against Something" width={620} height={99} priority unoptimized /></Link>
        <div className="header-actions"><Link className="submit-link" href="/submit">Submit an action</Link><AuthControl /></div>
      </header>
      <section className="admin-shell">
        <div className="admin-heading"><p className="eyebrow"><span /> ADMIN REVIEW</p><h1>Pending<br /><em>actions.</em></h1><p>Approving publishes the action immediately in the public directory.</p></div>
        <div className="review-list">
          {loading && <p className="admin-message">Loading submissions…</p>}
          {error && <p className="admin-message form-error" role="alert">{error}</p>}
          {!loading && !error && submissions.length === 0 && <p className="admin-message">No actions are waiting for approval.</p>}
          {submissions.map((submission) => (
            <article className="review-card" key={submission.id}>
              <div className="review-meta"><span>{submission.type}</span><span>{submission.issue}</span><span>{submission.effort}</span></div>
              <h2>{submission.title}</h2>
              <p>{submission.detail}</p>
              <details className="review-description"><summary>Review full Markdown description</summary><pre>{submission.description}</pre></details>
              <dl><div><dt>Organization</dt><dd>{submission.organization}</dd></div><div><dt>Submitted by</dt><dd>{submission.submitterName ?? 'Unknown'}{submission.submitterEmail ? ` · ${submission.submitterEmail}` : ''}</dd></div></dl>
              <div className="review-actions"><a href={submission.href} target="_blank" rel="noreferrer">Inspect source ↗</a><button type="button" onClick={() => approve(submission.id)} disabled={approving === submission.id}>{approving === submission.id ? 'APPROVING…' : 'APPROVE & PUBLISH'}</button></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
