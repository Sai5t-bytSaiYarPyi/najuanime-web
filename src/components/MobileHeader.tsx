// src/components/MobileHeader.tsx
'use client';
import Link from 'next/link';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
    setIsMenuOpen: (isOpen: boolean) => void;
}

export default function MobileHeader({ setIsMenuOpen }: MobileHeaderProps) {
    return (
        // --- Mobile Header Styles (Dark Theme) ---
        <header className="md:hidden flex items-center justify-between p-4 bg-card-dark/80 backdrop-blur-sm border-b border-border-color sticky top-0 z-40 text-text-dark-primary shadow-md">
            <Link href="/" className="text-xl font-bold">
                NajuAnime+
            </Link>
            <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-md hover:bg-white/10">
                <Menu size={24} />
            </button>
        </header>
    );
}