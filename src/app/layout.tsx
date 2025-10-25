// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; //
import MainLayout from '@/components/MainLayout'; //
import { ThemeProvider } from '@/context/ThemeContext'; //

const inter = Inter({ subsets: ['latin'] });

// metadata ကို ဒီအတိုင်း ထားပါ (ဥပမာ)
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
    // --- START: <html> tag မှ className="" ကို ဖယ်ရှားလိုက်ပါ ---
    <html lang="en">
    {/* --- END: <html> tag မှ className="" ကို ဖယ်ရှားလိုက်ပါ --- */}
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