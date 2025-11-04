// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/MainLayout';
// --- ThemeProvider import ကို ဖယ်ရှားပါ ---
// import { ThemeProvider } from '@/context/ThemeContext';
import ClientPrefs from '@/components/ClientPrefs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NajuAnime+',
  description: 'Watch Anime and Read Manhwa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" data-hide-spoilers="false">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                var s = localStorage.getItem('hideSpoilers');
                if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
                if (s === 'true' || s === 'false') document.documentElement.setAttribute('data-hide-spoilers', s);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} transition-colors duration-200`}>
        <ClientPrefs />
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}