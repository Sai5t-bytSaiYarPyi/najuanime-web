// src/components/MobileHeader.tsx
import Link from 'next/link';
import { Menu } from 'lucide-react';

export default function MobileHeader() {
    return (
        // Visible only on mobile, hidden on desktop (md and larger)
        <header className="md:hidden flex items-center justify-between p-4 bg-background-dark border-b border-border-color sticky top-0 z-10">
            <Link href="/" className="text-xl font-bold">
                NajuAnime+
            </Link>
            <button className="p-2">
                <Menu size={24} />
            </button>
        </header>
    );
}