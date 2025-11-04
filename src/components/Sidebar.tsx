// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Flame, User, X, TrendingUp, LogIn, LogOut, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; //
import { Session } from '@supabase/supabase-js';
import Auth from './Auth'; //

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/manhwa', label: 'Manhwa', icon: Flame }, //
    { href: '/anime', label: 'Anime', icon: Clapperboard }, //
    { href: '/top-rated', label: 'Top Rated', icon: TrendingUp }, //
    { href: '/my-account', label: 'My Account', icon: User, requiresAuth: true }, //
];

interface SidebarProps {
    isMenuOpen: boolean;
    setIsMenuOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isMenuOpen, setIsMenuOpen }: SidebarProps) {
    const pathname = usePathname();
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [hideSpoilers, setHideSpoilers] = useState<'true' | 'false'>('false');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setIsAuthModalOpen(false); // Login အောင်မြင်ရင် modal ပိတ်
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

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

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // --- START: Styles တွေကို Dark Theme အတွက် တိုက်ရိုက်သတ်မှတ် ---
    // Link Styles (Desktop & Mobile တူညီ)
    const getLinkClasses = (href: string) => {
        const isActive = pathname === href;
        return `flex items-center gap-3 p-3 rounded-lg transition-colors relative group ${
            isActive
                ? 'text-accent-green bg-accent-green/10' // Active link
                : 'text-text-dark-secondary hover:text-text-dark-primary hover:bg-white/5' // Default & Hover
        }`;
    };

    // Login/Logout Button Styles
     const getActionButtonClasses = () => {
        return "flex items-center w-full gap-3 p-3 rounded-lg transition-colors text-text-dark-secondary hover:text-text-dark-primary";
     }
     const getLogoutButtonClasses = () => `${getActionButtonClasses()} hover:bg-red-500/10 hover:text-red-400`;
     const getLoginButtonClasses = () => `${getActionButtonClasses()} hover:bg-green-500/10 hover:text-green-400`;
    // --- END: Styles တွေကို Dark Theme အတွက် တိုက်ရိုက်သတ်မှတ် ---

    // Navigation Links (map လုပ်ပုံ မပြောင်း)
    const navLinks = navItems
        .filter(item => !item.requiresAuth || (item.requiresAuth && session))
        .map((item) => (
            <Link href={item.href} key={item.label} onClick={() => setIsMenuOpen(false)}>
                <motion.div
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className={getLinkClasses(item.href)} // Combined class function
                >
                    {pathname === item.href && <motion.div layoutId={`active-indicator`} className="absolute left-0 top-0 h-full w-1 bg-accent-green rounded-r-full" />}
                    <item.icon size={20} className={`transition-colors ${pathname === item.href ? 'text-accent-green' : 'text-text-dark-secondary group-hover:text-text-dark-primary'}`} />
                    <span className="font-medium">{item.label}</span>
                </motion.div>
            </Link>
        ));

    // Mobile links က desktop နဲ့ style တူသွားပြီ
    const mobileNavLinks = navLinks;

    return (
        <>
            {/* Auth Modal */}
            <Auth isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

            {/* Mobile Sidebar */}
            <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: isMenuOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                // --- Mobile Sidebar Styles (Dark Theme) ---
                className="md:hidden fixed top-0 left-0 h-full w-64 p-5 bg-background-dark/95 backdrop-blur-md border-r border-border-color z-50 flex flex-col shadow-xl"
            >
                {/* Sidebar Content */}
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-text-dark-primary">NajuAnime+</h1>
                        <div className="flex items-center gap-2">
                            <button onClick={toggleSpoilers} className="p-1.5 rounded-md hover:bg-white/10" aria-label={hideSpoilers === 'true' ? 'Show spoilers' : 'Hide spoilers'} title={hideSpoilers === 'true' ? 'Show spoilers' : 'Hide spoilers'}>
                                {hideSpoilers === 'true' ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-white/10" aria-label="Toggle theme" title="Toggle theme">
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <button onClick={() => setIsMenuOpen(false)} className="text-text-dark-secondary hover:text-text-dark-primary p-1 rounded-md hover:bg-white/10"><X size={22} /></button>
                        </div>
                    </div>
                    <nav className="flex flex-col gap-2.5">
                        {mobileNavLinks}
                    </nav>
                </div>
                {/* Bottom Action Button */}
                <div className="mt-auto pt-4 border-t border-border-color">
                    <div className="flex items-center gap-2 mb-3">
                        <button onClick={toggleSpoilers} className="p-2 rounded-md hover:bg-white/10 text-text-dark-secondary hover:text-text-dark-primary" aria-label={hideSpoilers === 'true' ? 'Show spoilers' : 'Hide spoilers'} title={hideSpoilers === 'true' ? 'Show spoilers' : 'Hide spoilers'}>
                            {hideSpoilers === 'true' ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-white/10 text-text-dark-secondary hover:text-text-dark-primary" aria-label="Toggle theme" title="Toggle theme">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                    {session ? (
                         <button onClick={handleLogout} className={getLogoutButtonClasses()}>
                            <LogOut size={20} />
                            <span className="font-medium">Logout</span>
                        </button>
                    ) : (
                        <button onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }} className={getLoginButtonClasses()}>
                            <LogIn size={20} />
                            <span className="font-medium">Login / Sign Up</span>
                        </button>
                    )}
                </div>
            </motion.aside>

            {/* Desktop Sidebar */}
             {/* --- Desktop Sidebar Styles (Dark Theme) --- */}
            <aside className="hidden md:flex w-60 p-5 bg-card-dark border-r border-border-color shrink-0 h-screen sticky top-0 flex-col">
                {/* Sidebar Content */}
                <div className="flex-grow">
                    <h1 className="text-2xl font-bold mb-8 text-text-dark-primary">NajuAnime+</h1>
                    <nav className="flex flex-col gap-2.5">
                       {navLinks} {/* Use navLinks here as well */}
                    </nav>
                </div>
                 {/* Bottom Action Button */}
                 <div className="mt-auto pt-4 border-t border-border-color">
                    <div className="flex items-center gap-2 mb-3">
                        <button onClick={toggleSpoilers} className="p-2 rounded-md hover:bg-white/10 text-text-dark-secondary hover:text-text-dark-primary" aria-label={hideSpoilers === 'true' ? 'Show spoilers' : 'Hide spoilers'} title={hideSpoilers === 'true' ? 'Show spoilers' : 'Hide spoilers'}>
                            {hideSpoilers === 'true' ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-white/10 text-text-dark-secondary hover:text-text-dark-primary" aria-label="Toggle theme" title="Toggle theme">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                    {session ? (
                        <button onClick={handleLogout} className={getLogoutButtonClasses()}>
                            <LogOut size={20} />
                            <span className="font-medium">Logout</span>
                        </button>
                    ) : (
                        <button onClick={() => setIsAuthModalOpen(true)} className={getLoginButtonClasses()}>
                            <LogIn size={20} />
                            <span className="font-medium">Login / Sign Up</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}