// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Flame, User, X, TrendingUp, LogIn, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './Auth';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/manhwa', label: 'Manhwa', icon: Flame },
    { href: '/anime', label: 'Anime', icon: Clapperboard },
    { href: '/top-rated', label: 'Top Rated', icon: TrendingUp },
    { href: '/my-account', label: 'My Account', icon: User, requiresAuth: true },
];

interface SidebarProps {
    isMenuOpen: boolean;
    setIsMenuOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isMenuOpen, setIsMenuOpen }: SidebarProps) {
    const pathname = usePathname();
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                setIsAuthModalOpen(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // --- START: Update Link Styles ---
    const getLinkClasses = (href: string) => {
        const isActive = pathname === href;
        return `flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
            isActive
                ? 'text-text-light-primary dark:text-white' // Active text color
                : 'text-text-light-secondary dark:text-gray-300 hover:text-text-light-primary dark:hover:text-white' // Default text colors
        }`;
    };

    const getMobileLinkClasses = (href: string) => {
        const isActive = pathname === href;
         return `flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
            isActive
                ? 'text-white bg-accent-purple' // Active mobile link
                : 'text-text-light-secondary dark:text-gray-300 hover:bg-accent-purple/10 dark:hover:bg-accent-purple/50 hover:text-text-light-primary dark:hover:text-white' // Default mobile link colors
        }`;
    }

     const getActionButtonClasses = () => {
        return "flex items-center gap-3 p-3 rounded-lg w-full transition-colors text-text-light-secondary dark:text-gray-300 hover:text-text-light-primary dark:hover:text-white";
     }
     const getLogoutButtonClasses = () => `${getActionButtonClasses()} hover:bg-red-500/10 dark:hover:bg-red-500/50`;
     const getLoginButtonClasses = () => `${getActionButtonClasses()} hover:bg-green-500/10 dark:hover:bg-green-500/50`;
    // --- END: Update Link Styles ---


    const navLinks = navItems
        .filter(item => !item.requiresAuth || (item.requiresAuth && session))
        .map((item) => (
            <Link href={item.href} key={item.label} onClick={() => setIsMenuOpen(false)}>
                <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                    className={getLinkClasses(item.href)} // Use function for classes
                >
                    {pathname === item.href && <motion.div layoutId={`active-pill-desktop-${item.href}`} className="absolute left-0 top-0 h-full w-1 bg-accent-green rounded-r-full" />}
                    <item.icon size={20} />
                    <span>{item.label}</span>
                </motion.div>
            </Link>
        ));

    const mobileNavLinks = navItems
        .filter(item => !item.requiresAuth || (item.requiresAuth && session))
        .map((item) => (
            <Link href={item.href} key={item.label} onClick={() => setIsMenuOpen(false)} className={getMobileLinkClasses(item.href)}>
                {pathname === item.href && <motion.div layoutId={`active-pill-mobile-${item.href}`} className="absolute left-0 top-0 h-full w-1 bg-accent-green rounded-r-full" />}
                <item.icon size={20} />
                <span>{item.label}</span>
            </Link>
        ));

    return (
        <>
            <Auth isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

            {/* Mobile Sidebar (Slide in/out) */}
            <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: isMenuOpen ? 0 : '-100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                // --- START: Update Mobile Sidebar Styles ---
                className="md:hidden fixed top-0 left-0 h-full w-64 p-6 bg-card-light/90 dark:bg-card-dark/80 backdrop-blur-lg border-r border-border-light dark:border-border-color z-50 flex flex-col"
                // --- END: Update Mobile Sidebar Styles ---
            >
                <div>
                    <div className="flex justify-between items-center mb-8">
                         {/* --- Updated Heading Color --- */}
                        <h1 className="text-2xl font-bold text-text-light-primary dark:text-white">NajuAnime+</h1>
                        <button onClick={() => setIsMenuOpen(false)} className="text-text-light-secondary dark:text-gray-300 hover:text-text-light-primary dark:hover:text-white"><X /></button>
                    </div>
                    <nav className="flex flex-col gap-4">
                        {mobileNavLinks}
                    </nav>
                </div>
                <div className="mt-auto">
                    {session ? (
                         <button onClick={handleLogout} className={getLogoutButtonClasses()}>
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    ) : (
                        <button onClick={() => setIsAuthModalOpen(true)} className={getLoginButtonClasses()}>
                            <LogIn size={20} />
                            <span>Login / Sign Up</span>
                        </button>
                    )}
                </div>
            </motion.aside>

            {/* Desktop Sidebar (Static) */}
             {/* --- START: Update Desktop Sidebar Styles --- */}
            <aside className="hidden md:block w-64 p-6 bg-card-light dark:bg-card-dark/30 backdrop-blur-lg border-r border-border-light dark:border-border-color shrink-0 h-screen sticky top-0 flex-col justify-between">
            {/* --- END: Update Desktop Sidebar Styles --- */}
                <div>
                     {/* --- Updated Heading Color --- */}
                    <h1 className="text-2xl font-bold mb-8 text-text-light-primary dark:text-white">NajuAnime+</h1>
                    <nav className="flex flex-col gap-4">
                       {navLinks}
                    </nav>
                </div>
                 <div className="mt-auto absolute bottom-6 w-[calc(100%-3rem)]"> {/* Added width to prevent overflow */}
                    {session ? (
                        <button onClick={handleLogout} className={getLogoutButtonClasses()}>
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    ) : (
                        <button onClick={() => setIsAuthModalOpen(true)} className={getLoginButtonClasses()}>
                            <LogIn size={20} />
                            <span>Login / Sign Up</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}