'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { DirectoryAction, Issue } from '@/lib/db';
import { AuthControl } from './auth-control';

type ActionType = DirectoryAction['type'];
const filters: Array<'All' | ActionType> = ['All', 'Petition', 'Lawsuit', 'Campaign'];

export function ActionsDirectory({ issues, actions }: { issues: Issue[]; actions: DirectoryAction[] }) {
  const initialIssue = issues.find((issue) => issue.status === 'active') ?? issues[0];
  const [issueSlug, setIssueSlug] = useState(initialIssue?.slug ?? '');
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const selectedIssue = issues.find((issue) => issue.slug === issueSlug) ?? initialIssue;
  const issueActions = useMemo(
    () => actions.filter((action) => action.issueId === selectedIssue?.id),
    [actions, selectedIssue?.id],
  );
  const visible = useMemo(
    () => filter === 'All' ? issueActions : issueActions.filter((item) => item.type === filter),
    [filter, issueActions],
  );

  return (
    <main>
      <header className="site-header">
        <a className="brand header-brand" href="#top" aria-label="Force Against Something home">
          <Image src="/header-wordmark.png" alt="Force Against Something" width={629} height={96} priority />
        </a>
        <div className="header-actions">
          <a className="submit-link" href="mailto:hello@forceagainstsomething.com?subject=Action%20submission">Submit an action <span aria-hidden="true">↗</span></a>
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
          <p>Every listing links directly to the organization leading the work. We check ownership, activity, and a clear path to impact.</p>
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
                <h3>{action.title}</h3><p>{action.detail}</p>
                <span className="organization">BY {action.organization.toUpperCase()} {action.verified && <i aria-label="Verified organization">✓</i>}</span>
              </div>
              <div className="card-action"><span>{action.effort}</span><a href={action.href} target="_blank" rel="noreferrer" aria-label={`Take action: ${action.title}`}>TAKE ACTION <b aria-hidden="true">↗</b></a></div>
            </article>
          ))}
          {visible.length === 0 && <p className="empty-state">No published actions match this filter yet.</p>}
        </div>
      </section>

      <section className="trust-band"><div className="trust-mark" aria-hidden="true"><span>✓</span></div><div><p className="eyebrow"><span /> OUR STANDARD</p><h2>Curated for action,<br />not attention.</h2></div><p>We prioritize credible organizations, active efforts, transparent asks, and direct links. No outrage bait. No pay-to-play placement. Just useful ways to help.</p></section>
      <footer><a className="brand footer-brand" href="#top" aria-label="Force Against Something home"><Image src="/footer-wordmark.png" alt="Force Against Something" width={629} height={96} /></a><p>Pick an issue. Find your part. Add your force.</p><div><a href="mailto:hello@forceagainstsomething.com">Contact</a><a href="mailto:hello@forceagainstsomething.com?subject=Action%20submission">Submit an action</a></div></footer>
    </main>
  );
}
