// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/MainLayout';

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
    // <html> tag မှာ class မထည့်ပါ (Client-side က ထိန်းချုပ်ပါမယ်)
    <html lang="en">
      {/* body မှာ light (default) နှင့် dark mode အတွက် class များ သတ်မှတ်ပါ */}
      <body
        className={`${inter.className} bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary transition-colors duration-200`}
      >
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}