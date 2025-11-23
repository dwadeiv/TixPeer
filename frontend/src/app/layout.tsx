import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Providers } from '@/components/Providers';
import { ScrollRestoration } from '@/components/ScrollRestoration';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'TixPeer - Peer-to-Peer Ticket Exchange',
    template: '%s | TixPeer',
  },
  description: 'Peer-to-peer ticket exchange marketplace - Connect directly with other fans to buy, sell, and trade event tickets',
  applicationName: 'TixPeer',
  keywords: ['tickets', 'events', 'peer-to-peer', 'exchange', 'concerts', 'sports', 'theater'],
  authors: [{ name: 'TixPeer' }],
  creator: 'TixPeer',
  publisher: 'TixPeer',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5" />
        <link rel="alternate icon" type="image/x-icon" href="/favicon.ico?v=5" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ScrollRestoration />
          <div className="min-h-screen bg-slate-50">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
