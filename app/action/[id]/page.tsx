import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ActionBookmarkButton } from '@/app/action-bookmark-button';
import { SiteHeader } from '@/app/site-header';
import { getPublishedAction } from '@/lib/db';

export const dynamic = 'force-dynamic';

type ActionPageProps = { params: Promise<{ id: string }> };

function parseActionId(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

async function findAction(params: ActionPageProps['params']) {
  const { id: value } = await params;
  const id = parseActionId(value);
  return id ? getPublishedAction(id) : undefined;
}

export async function generateMetadata({ params }: ActionPageProps): Promise<Metadata> {
  const action = await findAction(params);
  if (!action) return { title: 'Action not found' };

  return {
    title: `${action.title} | Force Against Something`,
    description: action.detail,
    openGraph: { url: `/action/${action.id}`, title: action.title, description: action.detail, images: [] },
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
              <li><Link href={`/issues/${action.issueSlug}`}>{action.issue}</Link></li>
              <li aria-current="page"><span>{action.title}</span></li>
            </ol>
          </nav>
          <div className="badges action-detail-badges">
            <ActionBookmarkButton actionId={action.id} actionTitle={action.title} />
            <span className={`type ${action.type.toLowerCase()}`}>{action.type}</span>{action.urgent && <span className="urgent">Priority</span>}
          </div>
          <h1>{action.title}</h1>
          <p>{action.detail}</p>
          <span className="organization">BY <Link href={`/orgs/${action.orgId}`}>{action.organization.toUpperCase()}</Link></span>
        </div>
        <aside className="action-detail-cta">
          <p className="step">READY TO HELP?</p>
          <h2>Make your<br />move.</h2>
          <p>You’ll continue on <Link className="organization-inline-link" href={`/orgs/${action.orgId}`}>{action.organization}</Link>’s website.</p>
          <a className="primary-button" href={action.href} target="_blank" rel="noreferrer">TAKE ACTION <span aria-hidden="true">↗</span></a>
          <small>{action.effort}</small>
        </aside>
      </section>

      <section className="action-description-shell">
        <div className="action-description-label">
          <p className="eyebrow"><span /> THE DETAILS</p>
          <ul className="action-details-list">
            <li>
              <small>Issue</small>
              <div><Link href={`/issues/${action.issueSlug}`}>{action.issue}</Link></div>
              {action.issueDetail && <p>{action.issueDetail}</p>}
            </li>
            <li>
              <small>Link</small>
              <div><a className="action-details-url" href={action.href} target="_blank" rel="noreferrer">{action.href}</a></div>
            </li>
            <li>
              <small>Org</small>
              <div><Link href={`/orgs/${action.orgId}`}>{action.organization}</Link></div>
            </li>
            <li>
              <small>Type</small>
              <div>{action.type}</div>
              <p>{typeDescriptions[action.type]}</p>
            </li>
            <li>
              <small>Effort</small>
              <div>{action.effort}</div>
              <p>{describeEffort(action.effort)}</p>
            </li>
            <li>
              <small>Created</small>
              <div>{createdDate}</div>
            </li>
          </ul>
        </div>
        <article className="markdown-content">
          {action.description
            ? <Markdown remarkPlugins={[remarkGfm]}>{action.description}</Markdown>
            : <p>{action.detail}</p>}
          <a className="primary-button action-description-button" href={action.href} target="_blank" rel="noreferrer">TAKE ACTION <span aria-hidden="true">↗</span></a>
        </article>
      </section>

      <footer><Link className="brand footer-brand" href="/" aria-label="Force Against Something home"><Image src="/footer-wordmark-star.png" alt="Force Against Something" width={620} height={99} unoptimized /></Link><p>Pick an issue. Do your part.</p><div><Link href="/contact">Contact</Link><Link href="/submit">Submit an action</Link></div></footer>
    </main>
  );
}
