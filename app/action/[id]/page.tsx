import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SiteHeader } from '@/app/site-header';
import { getPublishedAction } from '@/lib/db';

export const dynamic = 'force-dynamic';

type ActionPageProps = { params: Promise<{ id: string }> };

function parseActionId(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
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

  return (
    <main className="action-detail-page">
      <SiteHeader />

      <section className="action-detail-hero">
        <div className="action-detail-heading">
          <Link className="back-link" href="/">← Back to all actions</Link>
          <div className="badges"><span className={`type ${action.type.toLowerCase()}`}>{action.type}</span>{action.urgent && <span className="urgent">Priority</span>}</div>
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
        <div className="action-description-label"><p className="eyebrow"><span /> THE DETAILS</p><p>{action.issue}</p></div>
        <article className="markdown-content">
          {action.description
            ? <Markdown remarkPlugins={[remarkGfm]}>{action.description}</Markdown>
            : <p>{action.detail}</p>}
        </article>
      </section>

      <footer><Link className="brand footer-brand" href="/" aria-label="Force Against Something home"><Image src="/footer-wordmark-star.png" alt="Force Against Something" width={620} height={99} unoptimized /></Link><p>Pick an issue. Do your part.</p><div><a href="mailto:hello@forceagainstsomething.com">Contact</a><Link href="/submit">Submit an action</Link></div></footer>
    </main>
  );
}
