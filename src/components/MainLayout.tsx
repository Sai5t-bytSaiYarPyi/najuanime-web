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
        // --- START: Main flex container မှာ background ကို ထည့်ပါ ---
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
        {/* --- END: Main flex container မှာ background ကို ထည့်ပါ --- */}
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            {/* Right content area */}
            <div className="flex-1 flex flex-col">
                <MobileHeader setIsMenuOpen={setIsMenuOpen} />
                <AnimatePresence mode="wait">
                    <motion.main
                        key={pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        // --- START: Padding နဲ့ Text color ကို သေချာ သတ်မှတ်ပါ ---
                        className="flex-1 p-4 md:p-8 text-text-light-primary dark:text-text-dark-primary"
                        // --- END: Padding နဲ့ Text color ကို သေချာ သတ်မှတ်ပါ ---
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>
            </div>
        </div>
    );
}