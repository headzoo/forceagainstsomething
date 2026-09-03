'use client';

import { useMemo, useState } from 'react';

type ActionType = 'Petition' | 'Lawsuit' | 'Campaign';

const actions = [
  { type: 'Petition' as ActionType, title: 'Pass the John R. Lewis Voting Rights Advancement Act', org: 'Leadership Conference on Civil and Human Rights', detail: 'Tell Congress to restore and strengthen protections against discriminatory voting rules.', effort: '2 min', href: 'https://civilrights.org/john-lewis-voting-rights-act/', urgent: true },
  { type: 'Lawsuit' as ActionType, title: 'Defend voters from discriminatory maps', org: 'Campaign Legal Center', detail: 'Support an active case challenging Florida’s 2026 congressional map as an illegal partisan gerrymander.', effort: 'Follow case', href: 'https://campaignlegal.org/cases-actions/fighting-partisan-gerrymandering-florida-thompson-wynn-v-byrd', urgent: false },
  { type: 'Campaign' as ActionType, title: 'Join a local voting rights team', org: 'Common Cause', detail: 'Get trained to protect elections, contact lawmakers, and organize in your community.', effort: 'Volunteer', href: 'https://www.commoncause.org/articles/why-do-people-volunteer-to-help-with-elections/', urgent: false },
  { type: 'Petition' as ActionType, title: 'Support the expansion of voting rights', org: 'League of Women Voters', detail: 'Add your voice to the national push for accessible, secure, and fair elections.', effort: '3 min', href: 'https://www.lwv.org/take-action/support-expansion-voting-rights', urgent: false },
  { type: 'Campaign' as ActionType, title: 'Help voters get ready for the next election', org: 'Vote.org', detail: 'Share trusted registration, ballot, and polling-place tools with your network.', effort: 'Share', href: 'https://www.vote.org/', urgent: false },
];

const filters: Array<'All' | ActionType> = ['All', 'Petition', 'Lawsuit', 'Campaign'];

export default function Home() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const visible = useMemo(() => filter === 'All' ? actions : actions.filter((item) => item.type === filter), [filter]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Force Against Something home">
          <span className="brand-mark" aria-hidden="true"><i /></span>
          <span>FORCE <b>AGAINST</b> SOMETHING</span>
        </a>
        <a className="submit-link" href="mailto:hello@forceagainstsomething.com?subject=Action%20submission">Submit an action <span aria-hidden="true">↗</span></a>
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
            <select id="issue" defaultValue="voting-rights">
              <option value="voting-rights">Voting rights</option>
              <option value="climate" disabled>Climate justice — coming next</option>
              <option value="reproductive" disabled>Reproductive freedom — coming next</option>
            </select>
          </div>
          <a className="primary-button" href="#actions">SHOW ME THE ACTIONS <span aria-hidden="true">↓</span></a>
          <p className="microcopy">5 verified actions · Updated September 2026</p>
        </div>
      </section>

      <section className="actions-section" id="actions">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> CURRENT FOCUS</p><h2>Voting rights</h2></div>
          <p>Every listing links directly to the organization leading the work. We check ownership, activity, and a clear path to impact.</p>
        </div>

        <div className="filter-row" role="group" aria-label="Filter actions by type">
          {filters.map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'active' : ''} aria-pressed={filter === item}>
              {item} {item !== 'All' && <sup>{actions.filter((action) => action.type === item).length}</sup>}
            </button>
          ))}
        </div>

        <div className="action-list" aria-live="polite">
          {visible.map((action, index) => (
            <article className="action-card" key={action.title}>
              <div className="card-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="card-main">
                <div className="badges"><span className={`type ${action.type.toLowerCase()}`}>{action.type}</span>{action.urgent && <span className="urgent">Priority</span>}</div>
                <h3>{action.title}</h3><p>{action.detail}</p>
                <span className="organization">BY {action.org.toUpperCase()} <i aria-label="Verified organization">✓</i></span>
              </div>
              <div className="card-action"><span>{action.effort}</span><a href={action.href} target="_blank" rel="noreferrer" aria-label={`Take action: ${action.title}`}>TAKE ACTION <b aria-hidden="true">↗</b></a></div>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-band">
        <div className="trust-mark" aria-hidden="true"><span>✓</span></div>
        <div><p className="eyebrow"><span /> OUR STANDARD</p><h2>Curated for action,<br />not attention.</h2></div>
        <p>We prioritize credible organizations, active efforts, transparent asks, and direct links. No outrage bait. No pay-to-play placement. Just useful ways to help.</p>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true"><i /></span><span>FORCE <b>AGAINST</b> SOMETHING</span></a>
        <p>Pick an issue. Find your part. Add your force.</p>
        <div><a href="mailto:hello@forceagainstsomething.com">Contact</a><a href="mailto:hello@forceagainstsomething.com?subject=Action%20submission">Submit an action</a></div>
      </footer>
    </main>
  );
}
