import type { Metadata } from 'next';

import '../styles/globals.css';

import Navigation from '../components/Navigation';
import Breadcrumbs from '../components/Breadcrumbs';
import MainContent from '../components/MainContent';

export const metadata: Metadata = {
  title: 'VZ Programming - Node Registry',
  description: 'Browse and discover available nodes in the VZ Programming system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Navigation />
        <MainContent>
          <Breadcrumbs />
          {children}
        </MainContent>
      </body>
    </html>
  );
}

