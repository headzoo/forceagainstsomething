import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/app/site-header';
import { getLikedActions } from '@/lib/db';
import { getMemberSession } from '@/lib/member';
import { LikedActionsList } from './liked-actions-list';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Liked actions | Force Against Something',
  description: 'The actions you liked on Force Against Something.',
};

export default async function LikedPage() {
  const session = await getMemberSession();
  const likedActions = session ? await getLikedActions(session.user.id) : [];

  return (
    <main className="liked-page">
      <SiteHeader />

      <section className="liked-hero">
        <div className="liked-heading">
          <Link className="back-link" href="/">← Back to all actions</Link>
          <p className="eyebrow"><span /> YOUR SHORTLIST</p>
          <h1>Liked.</h1>
          <p>Keep the actions that matter to you close, then come back when you’re ready to make your move.</p>
        </div>
        <aside className="liked-summary">
          <p className="step">SAVED FOR LATER</p>
          <strong>{String(likedActions.length).padStart(2, '0')}</strong>
          <span>{likedActions.length === 1 ? 'action you want to remember.' : 'actions you want to remember.'}</span>
        </aside>
      </section>

      <section className="liked-actions-section" aria-label="Liked actions">
        {session ? (
          <LikedActionsList actions={likedActions} />
        ) : (
          <div className="liked-empty">
            <h2>Sign in to see your likes.</h2>
            <p>Use the sign-in button above, then every action you like will appear here.</p>
          </div>
        )}
      </section>

      <footer><Link className="brand footer-brand" href="/" aria-label="Force Against Something home"><Image src="/footer-wordmark-star.png" alt="Force Against Something" width={620} height={99} unoptimized /></Link><p>Pick an issue. Do your part.</p><div><Link href="/contact">Contact</Link><Link href="/api">API</Link><Link href="/submit">Submit an action</Link></div></footer>
    </main>
  );
}
