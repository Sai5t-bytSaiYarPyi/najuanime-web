// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Flame, User, X, TrendingUp, LogIn, LogOut } from 'lucide-react'; // Added LogIn, LogOut
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react'; // Added useEffect, useState
import { supabase } from '@/lib/supabaseClient'; // Added supabase
import { Session } from '@supabase/supabase-js'; // Added Session
import Auth from './Auth'; // Added Auth

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/manhwa', label: 'Manhwa', icon: Flame },
    { href: '/anime', label: 'Anime', icon: Clapperboard },
    { href: '/top-rated', label: 'Top Rated', icon: TrendingUp },
    { href: '/my-account', label: 'My Account', icon: User, requiresAuth: true }, // Mark as auth required
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

    const navLinks = navItems
        .filter(item => !item.requiresAuth || (item.requiresAuth && session)) // Filter out auth links if not logged in
        .map((item) => (
            <Link href={item.href} key={item.label} onClick={() => setIsMenuOpen(false)}>
                <motion.div
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-3 p-3 rounded-lg text-gray-300 transition-colors relative ${pathname === item.href ? 'text-white' : 'hover:text-white'}`}
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
            <Link href={item.href} key={item.label} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-lg text-gray-300 transition-colors relative ${pathname === item.href ? 'text-white bg-accent-purple' : 'hover:bg-accent-purple/50'}`}>
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
                className="md:hidden fixed top-0 left-0 h-full w-64 p-6 bg-card-dark/80 backdrop-blur-lg border-r border-border-color z-50 flex flex-col"
            >
                <div>
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-white">NajuAnime+</h1>
                        <button onClick={() => setIsMenuOpen(false)}><X /></button>
                    </div>
                    <nav className="flex flex-col gap-4">
                        {mobileNavLinks}
                    </nav>
                </div>
                <div className="mt-auto">
                    {session ? (
                         <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-red-500/50 hover:text-white w-full transition-colors">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    ) : (
                        <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-green-500/50 hover:text-white w-full transition-colors">
                            <LogIn size={20} />
                            <span>Login / Sign Up</span>
                        </button>
                    )}
                </div>
            </motion.aside>

            {/* Desktop Sidebar (Static) */}
            <aside className="hidden md:block w-64 p-6 bg-card-dark/30 backdrop-blur-lg border-r border-border-color shrink-0 h-screen sticky top-0 flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-8 text-white">NajuAnime+</h1>
                    <nav className="flex flex-col gap-4">
                       {navLinks}
                    </nav>
                </div>
                 <div className="mt-auto absolute bottom-6">
                    {session ? (
                        <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-red-500/50 hover:text-white w-full transition-colors">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    ) : (
                        <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-green-500/50 hover:text-white w-full transition-colors">
                            <LogIn size={20} />
                            <span>Login / Sign Up</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}