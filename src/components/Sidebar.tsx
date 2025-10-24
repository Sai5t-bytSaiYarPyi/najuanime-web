// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Flame, User, X, TrendingUp, LogIn, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './Auth'; // Auth component ရှိပြီးသားလို့ ယူဆပါတယ်

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
                setIsAuthModalOpen(false); // Login အောင်မြင်ရင် modal ပိတ်
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Logout ပြီးရင် Home page ကို ပြန်သွားနိုင်သည် (optional)
        // window.location.href = '/';
    };

    // --- START: Link Styles ကို Theme အရောင်များဖြင့် ပြင်ဆင် ---
    // Desktop Sidebar Link Styles
    const getLinkClasses = (href: string) => {
        const isActive = pathname === href;
        return `flex items-center gap-3 p-3 rounded-lg transition-colors relative group ${
            isActive
                ? 'text-accent-green bg-accent-green/10' // Active link: Neon green text, faint green background
                : 'text-text-dark-secondary hover:text-text-dark-primary hover:bg-white/5 dark:text-text-dark-secondary dark:hover:text-text-dark-primary dark:hover:bg-white/5' // Default & Hover
        }`;
    };

    // Mobile Sidebar Link Styles
    const getMobileLinkClasses = (href: string) => {
        const isActive = pathname === href;
         return `flex items-center gap-3 p-3 rounded-lg transition-colors relative group ${
            isActive
                ? 'text-accent-green bg-accent-green/10' // Active mobile link (desktop နဲ့ တူအောင်ထား)
                : 'text-text-dark-secondary hover:text-text-dark-primary hover:bg-white/10 dark:text-text-dark-secondary dark:hover:text-text-dark-primary dark:hover:bg-white/10' // Default mobile link
        }`;
    }

    // Login/Logout Button Styles (Light/Dark မခွဲတော့ပါ၊ Dark ကိုပဲ အခြေခံ)
     const getActionButtonClasses = () => {
        return "flex items-center w-full gap-3 p-3 rounded-lg transition-colors text-text-dark-secondary hover:text-text-dark-primary";
     }
     const getLogoutButtonClasses = () => `${getActionButtonClasses()} hover:bg-red-500/10 hover:text-red-400`;
     const getLoginButtonClasses = () => `${getActionButtonClasses()} hover:bg-green-500/10 hover:text-green-400`;
    // --- END: Link Styles ကို Theme အရောင်များဖြင့် ပြင်ဆင် ---

    // Navigation Links (Logic မပြောင်း)
    const navLinks = navItems
        .filter(item => !item.requiresAuth || (item.requiresAuth && session))
        .map((item) => (
            <Link href={item.href} key={item.label} onClick={() => setIsMenuOpen(false)}>
                <motion.div
                    whileHover={{ x: 3 }} // နည်းနည်းပဲ ရွှေ့မယ်
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className={getLinkClasses(item.href)}
                >
                    {/* Active Indicator ကို ဘယ်ဘက်မှာ ထားမယ် */}
                    {pathname === item.href && <motion.div layoutId={`active-indicator-desktop`} className="absolute left-0 top-0 h-full w-1 bg-accent-green rounded-r-full" />}
                    <item.icon size={20} className={`transition-colors ${pathname === item.href ? 'text-accent-green' : 'text-text-dark-secondary group-hover:text-text-dark-primary'}`} />
                    <span className="font-medium">{item.label}</span>
                </motion.div>
            </Link>
        ));

    const mobileNavLinks = navItems
        .filter(item => !item.requiresAuth || (item.requiresAuth && session))
        .map((item) => (
            <Link href={item.href} key={item.label} onClick={() => setIsMenuOpen(false)} className={getMobileLinkClasses(item.href)}>
                 {pathname === item.href && <motion.div layoutId={`active-indicator-mobile`} className="absolute left-0 top-0 h-full w-1 bg-accent-green rounded-r-full" />}
                 <item.icon size={20} className={`transition-colors ${pathname === item.href ? 'text-accent-green' : 'text-text-dark-secondary group-hover:text-text-dark-primary'}`} />
                 <span className="font-medium">{item.label}</span>
            </Link>
        ));

    return (
        <>
            {/* Auth Modal (onClose ကို သေချာထည့်ပေးပါ) */}
            <Auth isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

            {/* Mobile Sidebar (Slide in/out) */}
            <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: isMenuOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                // --- START: Mobile Sidebar Styles ကို Dark Theme အတွက် ပြင်ဆင် ---
                className="md:hidden fixed top-0 left-0 h-full w-64 p-5 bg-background-dark/95 backdrop-blur-md border-r border-border-color z-50 flex flex-col shadow-xl"
                // --- END: Mobile Sidebar Styles ကို Dark Theme အတွက် ပြင်ဆင် ---
            >
                {/* Sidebar Content */}
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-8">
                         {/* --- Heading Color (Dark Theme) --- */}
                        <h1 className="text-2xl font-bold text-text-dark-primary">NajuAnime+</h1>
                        <button onClick={() => setIsMenuOpen(false)} className="text-text-dark-secondary hover:text-text-dark-primary p-1 rounded-md hover:bg-white/10"><X size={22} /></button>
                    </div>
                    <nav className="flex flex-col gap-2.5"> {/* Gap နည်းနည်းကျဉ်း */}
                        {mobileNavLinks}
                    </nav>
                </div>
                {/* Bottom Action Button */}
                <div className="mt-auto pt-4 border-t border-border-color">
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

            {/* Desktop Sidebar (Static) */}
             {/* --- START: Desktop Sidebar Styles ကို Dark Theme အတွက် ပြင်ဆင် --- */}
            <aside className="hidden md:flex w-60 p-5 bg-card-dark border-r border-border-color shrink-0 h-screen sticky top-0 flex-col">
            {/* --- END: Desktop Sidebar Styles ကို Dark Theme အတွက် ပြင်ဆင် --- */}
                {/* Sidebar Content */}
                <div className="flex-grow">
                     {/* --- Heading Color (Dark Theme) --- */}
                    <h1 className="text-2xl font-bold mb-8 text-text-dark-primary">NajuAnime+</h1>
                    <nav className="flex flex-col gap-2.5"> {/* Gap နည်းနည်းကျဉ်း */}
                       {navLinks}
                    </nav>
                </div>
                 {/* Bottom Action Button */}
                 <div className="mt-auto pt-4 border-t border-border-color">
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