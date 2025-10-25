// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/MainLayout';
import { ThemeProvider } from '@/context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = { /* ... */ };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <html> tag တွင် class မရှိရ
    <html lang="en" className="">
      {/* <body> tag တွင်လည်း font နှင့် transition class များသာ ရှိသင့်သည် */}
      <body
        className={`${inter.className} transition-colors duration-200`}
      >
        <ThemeProvider>
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}