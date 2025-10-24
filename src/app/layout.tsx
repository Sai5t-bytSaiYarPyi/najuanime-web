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
    <html lang="en" className=""> {/* <--- ဒီမှာ class="dark" မထည့်တော့ပါ */}
      {/* <body> မှာ default dark mode အရောင်တွေကို သုံးပါ */}
      <body
        className={`${inter.className} bg-background-dark text-text-dark-primary dark:bg-background-dark dark:text-text-dark-primary transition-colors duration-200`}
        // Light mode အတွက် class တွေကို ThemeProvider က ထိန်းချုပ်ပါလိမ့်မယ်
      >
        <ThemeProvider>
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}