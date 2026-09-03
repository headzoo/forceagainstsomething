import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://force-against-something.plum-venus-8239.chatgpt.site'),
  title: 'Force Against Something — Find your way to act',
  description: 'A curated directory of verified petitions, lawsuits, and campaigns fighting for the issue you choose.',
  icons: { icon: '/favicon.svg', apple: '/icon.svg' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Force Against Something',
    title: 'Force Against Something — Find your way to act',
    description: 'One issue. Every verified way to act.',
    images: [{ url: '/og.png', width: 1200, height: 628, alt: 'Force Against Something' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Force Against Something — Find your way to act',
    description: 'One issue. Every verified way to act.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
