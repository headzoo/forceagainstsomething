import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader } from '@/app/site-header';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact | Force Against Something',
  description: 'Contact Force Against Something with questions, corrections, and partnership notes.',
  openGraph: {
    url: '/contact',
    title: 'Contact | Force Against Something',
    description: 'Send Force Against Something a message.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'Contact | Force Against Something',
    description: 'Send Force Against Something a message.',
    images: [],
  },
};

type ContactPageProps = {
  searchParams?: Promise<{ sent?: string; error?: string }>;
};

const errorMessages: Record<string, string> = {
  name: 'Enter your name.',
  email: 'Enter a valid email address.',
  message: 'Write a message between 10 and 4,000 characters.',
  server: 'The message could not be sent. Please try again in a minute.',
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const sent = params?.sent === '1';
  const error = params?.error ? errorMessages[params.error] ?? errorMessages.server : '';

  return (
    <main className="contact-page">
      <SiteHeader />
      {sent && (
        <div className="contact-toast contact-toast-success" role="status" aria-live="polite">
          <strong>Message sent.</strong>
          <span>Thanks for reaching out. We’ll read it shortly.</span>
        </div>
      )}
      {error && (
        <div className="contact-toast contact-toast-error" role="alert">
          <strong>Message not sent.</strong>
          <span>{error}</span>
        </div>
      )}

      <section className="contact-shell">
        <div className="contact-heading">
          <Link className="back-link" href="/">← Back to all actions</Link>
          <p className="eyebrow"><span /> CONTACT</p>
          <h1>Get in touch.</h1>
          <p>Send corrections, questions, partnership notes, or anything else that should reach the people behind Force Against Something.</p>
        </div>

        <div className="contact-panel">
          <ContactForm sent={sent} error={error} />
        </div>
      </section>

      <footer><Link className="brand footer-brand" href="/" aria-label="Force Against Something home"><Image src="/footer-wordmark-star.png" alt="Force Against Something" width={620} height={99} unoptimized /></Link><p>Pick an issue. Do your part.</p><div><Link href="/contact">Contact</Link><Link href="/api">API</Link><Link href="/submit">Submit an action</Link></div></footer>
    </main>
  );
}
