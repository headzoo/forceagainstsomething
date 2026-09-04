import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AuthControl } from '@/app/auth-control';
import { getPublishedOrganization } from '@/lib/db';

export const dynamic = 'force-dynamic';

type OrganizationPageProps = { params: Promise<{ id: string }> };

function parseOrganizationId(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function findOrganization(params: OrganizationPageProps['params']) {
  const { id: value } = await params;
  const id = parseOrganizationId(value);
  return id ? getPublishedOrganization(id) : undefined;
}

export async function generateMetadata({ params }: OrganizationPageProps): Promise<Metadata> {
  const organization = await findOrganization(params);
  if (!organization) return { title: 'Organization not found' };

  const description = `View actions from ${organization.name} on Force Against Something.`;

  return {
    title: `${organization.name} | Force Against Something`,
    description,
    openGraph: { url: `/orgs/${organization.id}`, title: organization.name, description, images: [] },
    twitter: { card: 'summary', title: organization.name, description, images: [] },
  };
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const organization = await findOrganization(params);
  if (!organization) notFound();

  return (
    <main className="org-detail-page">
      <header className="site-header">
        <Link className="brand header-brand" href="/" aria-label="Force Against Something home">
          <Image src="/header-wordmark-star.png" alt="Force Against Something" width={620} height={99} priority unoptimized />
        </Link>
        <div className="header-actions">
          <Link className="submit-link" href="/submit">Submit an action <span aria-hidden="true">↗</span></Link>
          <AuthControl />
        </div>
      </header>

      <section className="org-detail-hero">
        <div className="org-detail-heading">
          <Link className="back-link" href="/">← Back to all actions</Link>
          <p className="eyebrow"><span /> ORGANIZATION</p>
          <h1>{organization.name}</h1>
        </div>
        <aside className="org-detail-website">
          <p className="step">WEBSITE</p>
          {organization.website
            ? <a href={organization.website} target="_blank" rel="noreferrer">VISIT {organization.name.toUpperCase()} <span aria-hidden="true">↗</span></a>
            : <p>No website listed.</p>}
        </aside>
      </section>

      {organization.description && (
        <section className="org-description-shell">
          <div className="action-description-label"><p className="eyebrow"><span /> ABOUT</p><p>{organization.name}</p></div>
          <article className="markdown-content"><Markdown remarkPlugins={[remarkGfm]}>{organization.description}</Markdown></article>
        </section>
      )}

      <section className="org-actions-section">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> THEIR WORK</p><h2>Actions</h2></div>
          <p>{organization.actions.length} published {organization.actions.length === 1 ? 'action' : 'actions'} from {organization.name}.</p>
        </div>
        <div className="action-list">
          {organization.actions.map((action, index) => (
            <article className="action-card" key={action.id}>
              <div className="card-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="card-main">
                <div className="badges"><span className={`type ${action.type.toLowerCase()}`}>{action.type}</span>{action.urgent && <span className="urgent">Priority</span>}</div>
                <h3><Link href={`/action/${action.id}`}>{action.title}</Link></h3>
                <p>{action.detail}</p>
                <span className="organization">{action.issue.toUpperCase()}</span>
              </div>
              <div className="card-action"><span>{action.effort}</span><Link href={`/action/${action.id}`} aria-label={`Learn more and take action: ${action.title}`}>TAKE ACTION <b aria-hidden="true">→</b></Link></div>
            </article>
          ))}
          {organization.actions.length === 0 && <p className="empty-state">This organization has no published actions yet.</p>}
        </div>
      </section>

      <footer><Link className="brand footer-brand" href="/" aria-label="Force Against Something home"><Image src="/footer-wordmark-star.png" alt="Force Against Something" width={620} height={99} unoptimized /></Link><p>Pick an issue. Do your part.</p><div><a href="mailto:hello@forceagainstsomething.com">Contact</a><Link href="/submit">Submit an action</Link></div></footer>
    </main>
  );
}
