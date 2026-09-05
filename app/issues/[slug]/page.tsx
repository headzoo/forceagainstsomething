import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SiteHeader } from '@/app/site-header';
import { getPublishedIssue } from '@/lib/db';

export const dynamic = 'force-dynamic';

type IssuePageProps = { params: Promise<{ slug: string }> };

async function findIssue(params: IssuePageProps['params']) {
  const { slug } = await params;
  return getPublishedIssue(slug);
}

export async function generateMetadata({ params }: IssuePageProps): Promise<Metadata> {
  const issue = await findIssue(params);
  if (!issue) return { title: 'Issue not found' };

  const description = issue.detail || `Find ways to take action on ${issue.name}.`;

  return {
    title: `${issue.name} | Force Against Something`,
    description,
    openGraph: { url: `/issues/${issue.slug}`, title: issue.name, description, images: [] },
    twitter: { card: 'summary', title: issue.name, description, images: [] },
  };
}

export default async function IssuePage({ params }: IssuePageProps) {
  const issue = await findIssue(params);
  if (!issue) notFound();

  return (
    <main className="issue-detail-page">
      <SiteHeader />

      <section className="org-detail-hero">
        <div className="org-detail-heading">
          <Link className="back-link" href="/">← Back to all actions</Link>
          <p className="eyebrow"><span /> ISSUE</p>
          <h1>{issue.name}</h1>
          {issue.detail && <p className="issue-detail-summary">{issue.detail}</p>}
        </div>
        <aside className="action-detail-cta">
          <p className="step">WAYS TO ACT</p>
          <h2>{String(issue.actions.length).padStart(2, '0')}<br />{issue.actions.length === 1 ? 'action.' : 'actions.'}</h2>
          <p>Published and ready for you to make a difference.</p>
          <a className="primary-button" href="#issue-actions">BROWSE ACTIONS <span aria-hidden="true">↓</span></a>
        </aside>
      </section>

      {issue.description && (
        <section className="org-description-shell">
          <div className="action-description-label"><p className="eyebrow"><span /> WHY IT MATTERS</p><p>{issue.name}</p></div>
          <article className="markdown-content"><Markdown remarkPlugins={[remarkGfm]}>{issue.description}</Markdown></article>
        </section>
      )}

      <section className="org-actions-section" id="issue-actions">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> MAKE YOUR MOVE</p><h2>Take action</h2></div>
          <p>Every listing gives you the context, organization, and direct path you need to make a difference on {issue.name}.</p>
        </div>
        <div className="action-list">
          {issue.actions.map((action, index) => (
            <article className="action-card" key={action.id}>
              <div className="card-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="card-main">
                <div className="badges"><span className={`type ${action.type.toLowerCase()}`}>{action.type}</span>{action.urgent && <span className="urgent">Priority</span>}</div>
                <h3><Link href={`/action/${action.id}`}>{action.title}</Link></h3>
                <p>{action.detail}</p>
                <span className="organization">BY <Link href={`/orgs/${action.orgId}`}>{action.organization.toUpperCase()}</Link></span>
              </div>
              <div className="card-action"><span>{action.effort}</span><Link href={`/action/${action.id}`} aria-label={`Learn more and take action: ${action.title}`}>TAKE ACTION <b aria-hidden="true">→</b></Link></div>
            </article>
          ))}
          {issue.actions.length === 0 && <p className="empty-state">No published actions for this issue yet.</p>}
        </div>
      </section>

      <footer><Link className="brand footer-brand" href="/" aria-label="Force Against Something home"><Image src="/footer-wordmark-star.png" alt="Force Against Something" width={620} height={99} unoptimized /></Link><p>Pick an issue. Do your part.</p><div><Link href="/contact">Contact</Link><Link href="/submit">Submit an action</Link></div></footer>
    </main>
  );
}
