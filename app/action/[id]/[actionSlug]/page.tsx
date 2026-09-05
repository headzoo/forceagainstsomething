import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ActionLikeButton } from '@/app/action-like-button';
import { SiteHeader } from '@/app/site-header';
import { getPublishedActionBySlugs } from '@/lib/db';

export const dynamic = 'force-dynamic';

type ActionPageProps = { params: Promise<{ id: string; actionSlug: string }> };

const typeDescriptions = {
  Petition: 'Add your name to a public ask or message campaign.',
  Lawsuit: 'Support legal action or advocacy tied to a court case.',
  Campaign: 'Join organized pressure, volunteering, or ongoing outreach.',
};

function describeEffort(effort: string) {
  return `Estimated time or commitment: ${effort}.`;
}

function formatCreatedDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  }).format(date);
}

async function findAction(params: ActionPageProps['params']) {
  const { id: issueSlug, actionSlug } = await params;
  return getPublishedActionBySlugs(issueSlug, actionSlug);
}

export async function generateMetadata({ params }: ActionPageProps): Promise<Metadata> {
  const action = await findAction(params);
  if (!action) return { title: 'Action not found' };

  const url = `/a/${action.issueSlug}/${action.slug}`;
  return {
    title: `${action.title} | Force Against Something`,
    description: action.detail,
    alternates: { canonical: url },
    openGraph: { url, title: action.title, description: action.detail, images: [] },
    twitter: { card: 'summary', title: action.title, description: action.detail, images: [] },
  };
}

export default async function ActionPage({ params }: ActionPageProps) {
  const action = await findAction(params);
  if (!action) notFound();
  const createdDate = formatCreatedDate(action.createdAt);

  return (
    <main className="action-detail-page">
      <SiteHeader />

      <section className="action-detail-hero">
        <div className="action-detail-heading">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">All actions</Link></li>
              <li><Link href={`/i/${action.issueSlug}`}>{action.issue}</Link></li>
              <li aria-current="page"><span>{action.title}</span></li>
            </ol>
          </nav>
          <div className="badges action-detail-badges">
            <ActionLikeButton actionId={action.id} actionTitle={action.title} />
            <span className={`type ${action.type.toLowerCase()}`}>{action.type}</span>{action.urgent && <span className="urgent">Priority</span>}
          </div>
          <h1>{action.title}</h1>
          <p>{action.detail}</p>
          <span className="organization">BY <Link href={`/o/${action.organizationSlug}`}>{action.organization.toUpperCase()}</Link></span>
        </div>
        <aside className="action-detail-cta">
          <p className="step">READY TO HELP?</p>
          <h2>Make your<br />move.</h2>
          <p>You’ll continue on <Link className="organization-inline-link" href={`/o/${action.organizationSlug}`}>{action.organization}</Link>’s website.</p>
          <a className="primary-button" href={action.href} target="_blank" rel="noreferrer">TAKE ACTION <span aria-hidden="true">↗</span></a>
          <small>{action.effort}</small>
        </aside>
      </section>

      <section className="action-description-shell">
        <div className="action-description-label">
          <p className="eyebrow"><span /> THE DETAILS</p>
          <ul className="action-details-list">
            <li><small>Issue</small><div><Link href={`/i/${action.issueSlug}`}>{action.issue}</Link></div>{action.issueDetail && <p>{action.issueDetail}</p>}</li>
            <li><small>Link</small><div><a className="action-details-url" href={action.href} target="_blank" rel="noreferrer">{action.href}</a></div></li>
            <li><small>Org</small><div><Link href={`/o/${action.organizationSlug}`}>{action.organization}</Link></div></li>
            <li><small>Type</small><div>{action.type}</div><p>{typeDescriptions[action.type]}</p></li>
            <li><small>Effort</small><div>{action.effort}</div><p>{describeEffort(action.effort)}</p></li>
            <li><small>Created</small><div>{createdDate}</div></li>
          </ul>
        </div>
        <article className="markdown-content">
          {action.description ? <Markdown remarkPlugins={[remarkGfm]}>{action.description}</Markdown> : <p>{action.detail}</p>}
          <a className="primary-button action-description-button" href={action.href} target="_blank" rel="noreferrer">TAKE ACTION <span aria-hidden="true">↗</span></a>
        </article>
      </section>

      <footer><Link className="brand footer-brand" href="/" aria-label="Force Against Something home"><Image src="/footer-wordmark-star.png" alt="Force Against Something" width={620} height={99} unoptimized /></Link><p>Pick an issue. Do your part.</p><div><Link href="/contact">Contact</Link><Link href="/api">API</Link><Link href="/submit">Submit an action</Link></div></footer>
    </main>
  );
}
