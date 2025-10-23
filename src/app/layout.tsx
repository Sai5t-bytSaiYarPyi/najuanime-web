// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import MainLayout from '@/components/MainLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NajuAnime+ | Your Anime Universe',
  description: 'Your universe for Myanmar subtitled anime and free manhwa reading.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // <html> tag မှာ lang="en" ပဲ ထားခဲ့ပါ။ class ကို client-side မှာ ထိန်းချုပ်ပါမယ်။
    <html lang="en">
      {/* body မှာ light/dark mode အတွက် background နဲ့ text color class တွေ ထည့်ပါ */}
      <body className={`${inter.className} bg-background-light text-text-light-primary dark:bg-background-dark dark:text-gray-200 transition-colors duration-200`}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}