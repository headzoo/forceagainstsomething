'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { DirectoryAction, Issue } from '@/lib/db';
import { authClient } from '@/lib/auth-client';
import { AuthControl } from './auth-control';

type ActionType = DirectoryAction['type'];
const filters: Array<'All' | ActionType> = ['All', 'Petition', 'Lawsuit', 'Campaign'];

export function ActionsDirectory({ issues, actions }: { issues: Issue[]; actions: DirectoryAction[] }) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const initialIssue = issues.find((issue) => issue.status === 'active') ?? issues[0];
  const [issueSlug, setIssueSlug] = useState(initialIssue?.slug ?? '');
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [bookmarks, setBookmarks] = useState<{ userId: string; actionIds: Set<number> } | null>(null);
  const [updatingBookmarks, setUpdatingBookmarks] = useState<Set<number>>(new Set());
  const [bookmarkError, setBookmarkError] = useState('');
  const bookmarkedActionIds = bookmarks && bookmarks.userId === userId ? bookmarks.actionIds : new Set<number>();
  const selectedIssue = issues.find((issue) => issue.slug === issueSlug) ?? initialIssue;
  const issueActions = useMemo(
    () => actions.filter((action) => action.issueId === selectedIssue?.id),
    [actions, selectedIssue?.id],
  );
  const visible = useMemo(
    () => filter === 'All' ? issueActions : issueActions.filter((item) => item.type === filter),
    [filter, issueActions],
  );

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();
    fetch('/api/bookmarks', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load bookmarks.');
        return await response.json() as { actionIds: number[] };
      })
      .then(({ actionIds }) => setBookmarks({ userId, actionIds: new Set(actionIds) }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') setBookmarkError(error.message);
      });

    return () => controller.abort();
  }, [userId]);

  async function toggleBookmark(actionId: number) {
    if (!session || updatingBookmarks.has(actionId)) return;

    const wasBookmarked = bookmarkedActionIds.has(actionId);
    setBookmarkError('');
    setBookmarks((current) => {
      const next = new Set(current?.userId === session.user.id ? current.actionIds : []);
      if (wasBookmarked) next.delete(actionId);
      else next.add(actionId);
      return { userId: session.user.id, actionIds: next };
    });
    setUpdatingBookmarks((current) => new Set(current).add(actionId));

    try {
      const response = await fetch('/api/bookmarks', {
        method: wasBookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? 'Could not update that bookmark.');
      }
    } catch (error) {
      setBookmarks((current) => {
        const next = new Set(current?.userId === session.user.id ? current.actionIds : []);
        if (wasBookmarked) next.add(actionId);
        else next.delete(actionId);
        return { userId: session.user.id, actionIds: next };
      });
      setBookmarkError(error instanceof Error ? error.message : 'Could not update that bookmark.');
    } finally {
      setUpdatingBookmarks((current) => {
        const next = new Set(current);
        next.delete(actionId);
        return next;
      });
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand header-brand" href="#top" aria-label="Force Against Something home">
          <Image src="/header-wordmark.png" alt="Force Against Something" width={620} height={99} priority />
        </a>
        <div className="header-actions">
          <Link className="submit-link" href="/submit">Submit an action <span aria-hidden="true">↗</span></Link>
          <AuthControl />
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> ONE ISSUE. EVERY WAY TO ACT.</p>
          <h1>Turn concern<br />into <em>force.</em></h1>
          <p className="dek">A focused directory of verified petitions, lawsuits, and campaigns fighting for the issue you choose.</p>
        </div>
        <div className="issue-card">
          <p className="step">YOUR ISSUE / 01</p>
          <label htmlFor="issue">What are you fighting for?</label>
          <div className="select-wrap">
            <select id="issue" value={issueSlug} onChange={(event) => { setIssueSlug(event.target.value); setFilter('All'); }}>
              {issues.map((issue) => <option key={issue.id} value={issue.slug} disabled={issue.status === 'planned'}>{issue.name}{issue.status === 'planned' ? ' — coming next' : ''}</option>)}
            </select>
          </div>
          <a className="primary-button" href="#actions">SHOW ME THE ACTIONS <span aria-hidden="true">↓</span></a>
          <p className="microcopy">{issueActions.length} verified actions · Updated September 2026</p>
        </div>
      </section>

      <section className="actions-section" id="actions">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> CURRENT FOCUS</p><h2>{selectedIssue?.name ?? 'Actions'}</h2></div>
          <p>Every listing gives you the context, organization, and direct path you need to act. We check ownership, activity, and a clear path to impact.</p>
        </div>
        <div className="filter-row" role="group" aria-label="Filter actions by type">
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'active' : ''} aria-pressed={filter === item}>{item} {item !== 'All' && <sup>{issueActions.filter((action) => action.type === item).length}</sup>}</button>)}
        </div>
        <div className="action-list" aria-live="polite">
          {visible.map((action, index) => (
            <article className="action-card" key={action.id}>
              <div className="card-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="card-main">
                <div className="badges"><span className={`type ${action.type.toLowerCase()}`}>{action.type}</span>{action.urgent && <span className="urgent">Priority</span>}</div>
                <div className="action-title-row">
                  {session && (
                    <button
                      className={`bookmark-button${bookmarkedActionIds.has(action.id) ? ' bookmarked' : ''}`}
                      type="button"
                      aria-label={`${bookmarkedActionIds.has(action.id) ? 'Remove bookmark from' : 'Bookmark'} ${action.title}`}
                      aria-pressed={bookmarkedActionIds.has(action.id)}
                      disabled={updatingBookmarks.has(action.id)}
                      onClick={() => toggleBookmark(action.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6.75 3.75h10.5v16.5L12 16.7l-5.25 3.55V3.75Z" />
                      </svg>
                    </button>
                  )}
                  <h3>{action.title}</h3>
                </div>
                <p>{action.detail}</p>
                <span className="organization">BY <Link href={`/orgs/${action.orgId}`}>{action.organization.toUpperCase()}</Link> {action.verified && <i aria-label="Verified organization">✓</i>}</span>
              </div>
              <div className="card-action"><span>{action.effort}</span><Link href={`/action/${action.id}`} aria-label={`Learn more and take action: ${action.title}`}>TAKE ACTION <b aria-hidden="true">→</b></Link></div>
            </article>
          ))}
          {visible.length === 0 && <p className="empty-state">No published actions match this filter yet.</p>}
          {bookmarkError && <p className="bookmark-error" role="alert">{bookmarkError}</p>}
        </div>
      </section>

      <section className="trust-band"><div className="trust-mark" aria-hidden="true"><span>✓</span></div><div><p className="eyebrow"><span /> OUR STANDARD</p><h2>Curated for action,<br />not attention.</h2></div><p>We prioritize credible organizations, active efforts, transparent asks, and direct links. No outrage bait. No pay-to-play placement. Just useful ways to help.</p></section>
      <footer><a className="brand footer-brand" href="#top" aria-label="Force Against Something home"><Image src="/footer-wordmark.png" alt="Force Against Something" width={620} height={99} /></a><p>Pick an issue. Find your part. Add your force.</p><div><a href="mailto:hello@forceagainstsomething.com">Contact</a><Link href="/submit">Submit an action</Link></div></footer>
    </main>
  );
}
