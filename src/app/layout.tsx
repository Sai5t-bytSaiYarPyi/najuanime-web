// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/MainLayout';
// --- ThemeProvider import ကို ဖယ်ရှားပါ ---
// import { ThemeProvider } from '@/context/ThemeContext';

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
    <html lang="en">
      <body
        // --- dark class ကို <body> မှာ အသေထည့်ပေးပါ ---
        className={`${inter.className} dark transition-colors duration-200`}
      >
        {/* --- ThemeProvider ကို ဖယ်ရှားပါ --- */}
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}