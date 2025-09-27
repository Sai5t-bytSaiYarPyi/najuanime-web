// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NajuAnime - Watch Anime & Read Manhwa',
  description: 'Your universe for Myanmar subtitled anime and free manhwa reading.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <MobileHeader />
            <main className="flex-1 p-4 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}