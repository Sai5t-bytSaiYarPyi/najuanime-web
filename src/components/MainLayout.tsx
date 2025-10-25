// src/components/MainLayout.tsx
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    return (
        // --- ဒီ div က layout တစ်ခုလုံးရဲ့ နောက်ခံကို ထိန်းချုပ်တယ် ---
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            {/* Right content area */}
            <div className="flex-1 flex flex-col">
                <MobileHeader setIsMenuOpen={setIsMenuOpen} />
                <AnimatePresence mode="wait">
                    {/* --- ဒီ main က content area ရဲ့ text color နဲ့ padding ကို ထိန်းချုပ်တယ် --- */}
                    <motion.main
                        key={pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 p-4 md:p-8 text-text-light-primary dark:text-text-dark-primary"
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>
            </div>
        </div>
    );
}