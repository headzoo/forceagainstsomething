'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import { AuthControl } from '@/app/auth-control';
import { authClient } from '@/lib/auth-client';

type IssueOption = { id: number; name: string; slug: string };
type Organization = { id: number; name: string; website: string | null };
type AccountContext = { organization: Organization | null; isAdmin: boolean };
type Preview = {
  href: string;
  suggestedTitle: string;
  suggestedDetail: string;
  suggestedSlug: string;
  effort: string;
};

function slugifyPreview(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '') || 'action';
}

async function responseJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<Record<string, unknown>>;
}

export function SubmissionFlow({ issues }: { issues: IssueOption[] }) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [account, setAccount] = useState<AccountContext | null>(null);
  const [accountForUser, setAccountForUser] = useState('');
  const [href, setHref] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [description, setDescription] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [submittedTitle, setSubmittedTitle] = useState('');

  useEffect(() => {
    if (!session) return;

    let active = true;
    fetch('/api/account/context')
      .then(async (response) => {
        const data = await responseJson(response);
        if (!response.ok) throw new Error(String(data.error ?? 'Could not load your account.'));
        if (active) {
          setAccount(data as unknown as AccountContext);
          setAccountForUser(session.user.id);
        }
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load your account.'); })

    return () => { active = false; };
  }, [session]);

  async function analyzeHref(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError('');
    const response = await fetch('/api/actions/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ href }),
    });
    const data = await responseJson(response);
    setWorking(false);

    if (!response.ok) {
      setError(String(data.error ?? 'Could not analyze that page.'));
      return;
    }

    const nextPreview = data as unknown as Preview;
    setPreview(nextPreview);
    setHref(nextPreview.href);
    setTitle(nextPreview.suggestedTitle);
    setDetail(nextPreview.suggestedDetail);
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        href,
        issueId: Number(form.get('issueId')),
        type: form.get('type'),
        title,
        detail,
        description,
      }),
    });
    const data = await responseJson(response);
    setWorking(false);

    if (!response.ok) {
      setError(String(data.error ?? 'Could not submit your action.'));
      return;
    }

    setSubmittedTitle(title);
  }

  const signedOut = !sessionPending && !session;
  const loadingAccount = Boolean(session && accountForUser !== session.user.id);
  const needsOrganization = Boolean(session && !loadingAccount && account && !account.organization);
  const ready = Boolean(session && account?.organization);

  return (
    <main className="submission-page">
      <header className="site-header">
        <Link className="brand header-brand" href="/" aria-label="Force Against Something home">
          <Image src="/header-wordmark.png" alt="Force Against Something" width={620} height={99} priority />
        </Link>
        <div className="header-actions">
          <AuthControl />
        </div>
      </header>

      <section className="submission-shell">
        <div className="submission-heading">
          <p className="eyebrow"><span /> SUBMIT AN ACTION</p>
          <h1>Add a way<br />to <em>act.</em></h1>
          <p>Every submission is reviewed by an admin before it appears in the directory.</p>
          <Link href="/">← Back to the directory</Link>
        </div>

        <div className="submission-panel">
          {(sessionPending || loadingAccount) && <div className="submission-status"><p>Checking your account…</p></div>}

          {signedOut && (
            <div className="submission-status">
              <p className="step">STEP 01 / ACCOUNT</p>
              <h2>Sign in first.</h2>
              <p>Only authenticated members can create organizations and submit actions.</p>
              <AuthControl />
            </div>
          )}

          {needsOrganization && (
            <div className="submission-status">
              <p className="step">STEP 01 / ORGANIZATION</p>
              <h2>Create your organization.</h2>
              <p>Actions belong to organizations. Add yours on the organization page before continuing.</p>
              <Link className="form-submit" href="/organization">CREATE ORGANIZATION <span>→</span></Link>
            </div>
          )}

          {ready && !submittedTitle && !preview && (
            <form className="submission-form url-first-form" onSubmit={analyzeHref}>
              <p className="step">STEP 01 / ACTION LINK</p>
              <h2>Where can people act?</h2>
              <p className="form-intro">Start with the public page. We’ll read it securely on our server to suggest a title, slug, and effort.</p>
              <label>Action URL<input name="href" type="url" value={href} onChange={(event) => setHref(event.target.value)} placeholder="https://example.org/take-action" required autoFocus /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="form-submit" type="submit" disabled={working}>{working ? 'READING PAGE…' : 'CONTINUE'} <span>→</span></button>
            </form>
          )}

          {ready && !submittedTitle && preview && (
            <form className="submission-form" onSubmit={submitAction}>
              <p className="step">STEP 02 / ACTION DETAILS</p>
              <div className="form-title-row"><h2>Check the details.</h2><button type="button" onClick={() => { setPreview(null); setError(''); }}>Change link</button></div>
              <p className="form-intro">Submitting as <strong>{account?.organization?.name}</strong>. The final slug is generated automatically.</p>
              <label>Action URL<input name="href" type="url" value={href} readOnly /></label>
              <div className="form-grid">
                <label>Type<select name="type" required defaultValue="Petition"><option>Petition</option><option>Lawsuit</option><option>Campaign</option></select></label>
                <label>Issue<select name="issueId" required defaultValue={issues[0]?.id}>{issues.map((issue) => <option key={issue.id} value={issue.id}>{issue.name}</option>)}</select></label>
              </div>
              <label>Title<input name="title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} minLength={6} maxLength={180} required /></label>
              <label>Generated slug<input value={slugifyPreview(title)} readOnly aria-describedby="slug-note" /><small id="slug-note">May receive a numeric suffix if already taken.</small></label>
              <label>Summary<textarea name="detail" value={detail} onChange={(event) => setDetail(event.target.value)} minLength={20} maxLength={600} rows={4} required /><small>Shown on the homepage action card.</small></label>
              <label>Full description (Markdown)<textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} minLength={20} maxLength={1000000} rows={14} required /><small>Shown on the action detail page. Markdown headings, lists, links, and tables are supported.</small></label>
              <label>Effort<input value={preview.effort} readOnly /><small>Determined from the linked page and rechecked on submission.</small></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="form-submit" type="submit" disabled={working || issues.length === 0}>{working ? 'VERIFYING…' : 'SUBMIT FOR APPROVAL'} <span>→</span></button>
            </form>
          )}

          {submittedTitle && (
            <div className="submission-status success-status">
              <p className="step">SUBMISSION RECEIVED</p>
              <h2>Now under review.</h2>
              <p><strong>{submittedTitle}</strong> was sent to an admin. It will stay out of the public directory until it is manually approved.</p>
              <div className="success-actions"><Link className="form-submit" href="/">RETURN TO DIRECTORY <span>→</span></Link><button type="button" onClick={() => { setSubmittedTitle(''); setPreview(null); setHref(''); setTitle(''); setDetail(''); setDescription(''); }}>Submit another</button></div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
