'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ctaImage from '@/assets/cta.jpg';
import type { DirectoryAction, Issue } from '@/lib/db';
import { authClient } from '@/lib/auth-client';
import { BookmarkButton } from './action-bookmark-button';
import { SiteHeader } from './site-header';

type ActionType = DirectoryAction['type'];
const filters: Array<'All' | ActionType> = ['All', 'Petition', 'Lawsuit', 'Campaign'];
const selectedIssueStorageKey = 'forceAgainstSomething:selectedIssueSlug';
const minimumIssuePlaceholderCount = 8;

export function ActionsDirectory({ issues, actions }: { issues: Issue[]; actions: DirectoryAction[] }) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const initialIssue = issues.find((issue) => issue.status === 'active') ?? issues[0];
  const initialIssueSlug = initialIssue?.slug ?? '';
  const [issueSlug, setIssueSlug] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [bookmarks, setBookmarks] = useState<{ userId: string; actionIds: Set<number> } | null>(null);
  const [updatingBookmarks, setUpdatingBookmarks] = useState<Set<number>>(new Set());
  const [bookmarkError, setBookmarkError] = useState('');
  const bookmarkedActionIds = bookmarks && bookmarks.userId === userId ? bookmarks.actionIds : new Set<number>();
  const selectedIssue = issueSlug ? issues.find((issue) => issue.slug === issueSlug) ?? initialIssue : null;
  const issueActions = useMemo(
    () => actions.filter((action) => action.issueId === selectedIssue?.id),
    [actions, selectedIssue?.id],
  );
  const visible = useMemo(
    () => filter === 'All' ? issueActions : issueActions.filter((item) => item.type === filter),
    [filter, issueActions],
  );

  useEffect(() => {
    let restoredSlug = initialIssueSlug;

    try {
      const storedSlug = window.localStorage.getItem(selectedIssueStorageKey);
      const storedIssue = issues.find((issue) => issue.slug === storedSlug && issue.status !== 'planned');

      if (storedIssue) restoredSlug = storedIssue.slug;
      else if (storedSlug) window.localStorage.removeItem(selectedIssueStorageKey);
    } finally {
      setIssueSlug(restoredSlug);
    }
  }, [initialIssueSlug, issues]);

  useEffect(() => {
    if (!issueSlug) return;

    const selected = issues.find((issue) => issue.slug === issueSlug && issue.status !== 'planned');
    if (!selected) return;

    try {
      window.localStorage.setItem(selectedIssueStorageKey, selected.slug);
    } catch {
      // Ignore storage failures so the selector still works when browser storage is restricted.
    }
  }, [issueSlug, issues]);

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
      <SiteHeader />

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> ONE ISSUE. EVERY WAY TO ACT.</p>
          <h1 className="hero-cta">
            <Image className="hero-cta-image" src={ctaImage} alt="Turn concern into force." priority sizes="(max-width: 780px) calc(100vw - 40px), 48vw" />
          </h1>
          <p className="dek">A focused directory of verified petitions, lawsuits, and campaigns fighting for the issue you choose.</p>
        </div>
        <div className="issue-card">
          <p className="issue-card-prompt" id="issue-picker-label">What are you fighting for?</p>
          {issueSlug === null ? (
            <div className="issue-options issue-options-loading" aria-hidden="true">
              {Array.from({ length: Math.max(minimumIssuePlaceholderCount, issues.length) }, (_, index) => (
                <span className="issue-option-placeholder" key={index} />
              ))}
            </div>
          ) : selectedIssue && (
            <div className="issue-options" role="group" aria-labelledby="issue-picker-label">
              {issues.map((issue) => {
                const isSelected = selectedIssue.id === issue.id;
                const isPlanned = issue.status === 'planned';
                return (
                  <button
                    key={issue.id}
                    type="button"
                    className={`issue-option${isSelected ? ' active' : ''}`}
                    disabled={isPlanned}
                    aria-pressed={isSelected}
                    aria-label={`${issue.name}${isPlanned ? ' coming next' : ''}`}
                    title={isPlanned ? `${issue.name} coming next` : issue.name}
                    onClick={() => { setIssueSlug(issue.slug); setFilter('All'); }}
                  >
                    <span>{issue.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {selectedIssue && (
        <section className="actions-section" id="actions">
          <div className="section-heading">
            <div><p className="eyebrow"><span /> CURRENT FOCUS</p><h2><Link className="issue-heading-link" href={`/issues/${selectedIssue.slug}`}>{selectedIssue.name}</Link></h2></div>
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
                      <BookmarkButton
                        actionTitle={action.title}
                        bookmarked={bookmarkedActionIds.has(action.id)}
                        disabled={updatingBookmarks.has(action.id)}
                        onClick={() => toggleBookmark(action.id)}
                      />
                    )}
                    <h3><Link href={`/action/${action.id}`}>{action.title}</Link></h3>
                  </div>
                  <p>{action.detail}</p>
                  <span className="organization">BY <Link href={`/orgs/${action.orgId}`}>{action.organization.toUpperCase()}</Link></span>
                </div>
                <div className="card-action"><span>{action.effort}</span><Link href={`/action/${action.id}`} aria-label={`Learn more and take action: ${action.title}`}>TAKE ACTION <b aria-hidden="true">→</b></Link></div>
              </article>
            ))}
            {visible.length === 0 && <p className="empty-state">No published actions match this filter yet.</p>}
            {bookmarkError && <p className="bookmark-error" role="alert">{bookmarkError}</p>}
          </div>
        </section>
      )}

      <section className="trust-band"><div className="trust-mark" aria-hidden="true"><span>✓</span></div><div><p className="eyebrow"><span /> OUR STANDARD</p><h2>Curated for action,<br />not attention.</h2></div><p>We prioritize credible organizations, active efforts, transparent asks, and direct links. No outrage bait. No pay-to-play placement. Just useful ways to help.</p></section>
      <footer><a className="brand footer-brand" href="#top" aria-label="Force Against Something home"><Image src="/footer-wordmark-star.png" alt="Force Against Something" width={620} height={99} unoptimized /></a><p>Pick an issue. Do your part.</p><div><Link href="/contact">Contact</Link><Link href="/submit">Submit an action</Link></div></footer>
    </main>
  );
}
