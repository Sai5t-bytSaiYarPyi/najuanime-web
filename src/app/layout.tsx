// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/MainLayout';
import { ThemeProvider } from '@/context/ThemeContext'; // ThemeProvider ကို import လုပ်ပါ

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
    // <html> tag မှာ class မထည့်ပါ (ThemeContext က ထိန်းချုပ်ပါမယ်)
    <html lang="en">
      {/* <body> မှာလည်း theme-specific class တွေ မထည့်တော့ပါ */}
      <body
        className={`${inter.className} bg-background-light text-text-light-primary dark:bg-background-dark dark:text-text-dark-primary transition-colors duration-200`}
      >
        {/* ThemeProvider နဲ့ children (MainLayout) ကို ပတ်လိုက်ပါ */}
        <ThemeProvider>
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}