// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/MainLayout';
import { ThemeProvider } from '@/context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NajuAnime+ | Your Anime Universe',
  description: 'Your universe for Myanmar subtitled anime and free manhwa reading.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <html> tag မှာ class မထည့်ပါ
    <html lang="en" className=""> {/* <-- ဒီမှာ class မရှိသင့်ပါ */}
      {/* <body> မှာ font နဲ့ transition ပဲ ထားပါ */}
      <body
        className={`${inter.className} transition-colors duration-200`}
        // <-- background နဲ့ text color class တွေကို ဒီကနေ ဖယ်ရှားပါ
      >
        <ThemeProvider>
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}