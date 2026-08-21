import './globals.css';
import type { Metadata } from 'next';
import { TranslationProvider } from '@/lib/i18n/TranslationContext';

export const metadata: Metadata = {
  title: 'OptiSuite - Optical Shop Management System',
  description: 'Internal Optical Store Management, POS Billing, Clinical Refraction, and Inventory System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TranslationProvider>{children}</TranslationProvider>
      </body>
    </html>
  );
}
