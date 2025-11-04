// src/components/MobileHeader.tsx
'use client';
import Link from 'next/link';
import { Menu, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MobileHeaderProps {
    setIsMenuOpen: (isOpen: boolean) => void;
}

export default function MobileHeader({ setIsMenuOpen }: MobileHeaderProps) {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [hideSpoilers, setHideSpoilers] = useState<'true' | 'false'>('false');

    useEffect(() => {
        const root = document.documentElement;
        const t = (localStorage.getItem('theme') as 'dark' | 'light') || (root.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
        const s = (localStorage.getItem('hideSpoilers') as 'true' | 'false') || (root.getAttribute('data-hide-spoilers') as 'true' | 'false') || 'false';
        setTheme(t);
        setHideSpoilers(s);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        const root = document.documentElement;
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };

    const toggleSpoilers = () => {
        const next = hideSpoilers === 'true' ? 'false' : 'true';
        setHideSpoilers(next);
        const root = document.documentElement;
        root.setAttribute('data-hide-spoilers', next);
        localStorage.setItem('hideSpoilers', next);
    };

    return (
        // --- Mobile Header Styles (Dark Theme) ---
        <header className="md:hidden flex items-center justify-between p-4 bg-card-dark/80 backdrop-blur-sm border-b border-border-color sticky top-0 z-40 text-text-dark-primary shadow-md">
            <Link href="/" className="text-xl font-bold">
                NajuAnime+
            </Link>
            <div className="flex items-center gap-2">
                <button onClick={toggleSpoilers} className="p-2 rounded-md hover:bg-white/10" aria-label={hideSpoilers === 'true' ? 'Show spoilers' : 'Hide spoilers'} title={hideSpoilers === 'true' ? 'Show spoilers' : 'Hide spoilers'}>
                    {hideSpoilers === 'true' ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
                <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-white/10" aria-label="Toggle theme" title="Toggle theme">
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-md hover:bg-white/10">
                    <Menu size={24} />
                </button>
            </div>
        </header>
    );
}