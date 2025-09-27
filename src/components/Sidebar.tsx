// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clapperboard, Flame, User, X } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/manhwa', label: 'Manhwa', icon: Flame },
    { href: '/anime', label: 'Anime', icon: Clapperboard },
    { href: '/my-account', label: 'My Account', icon: User },
];

interface SidebarProps {
    isMenuOpen: boolean;
    setIsMenuOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isMenuOpen, setIsMenuOpen }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Sidebar (Slide in/out) */}
            <motion.aside 
                initial={{ x: '-100%' }}
                animate={{ x: isMenuOpen ? 0 : '-100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="md:hidden fixed top-0 left-0 h-full w-64 p-6 bg-card-dark/80 backdrop-blur-lg border-r border-border-color z-50"
            >
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-white">NajuAnime+</h1>
                    <button onClick={() => setIsMenuOpen(false)}><X /></button>
                </div>
                <nav className="flex flex-col gap-4">
                    {navItems.map((item) => (
                        <Link href={item.href} key={item.label} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 p-3 rounded-lg text-gray-300 transition-colors relative ${pathname === item.href ? 'text-white bg-accent-purple' : 'hover:bg-accent-purple/50'}`}>
                           {pathname === item.href && <motion.div layoutId="active-pill" className="absolute left-0 top-0 h-full w-1 bg-accent-green rounded-r-full" />}
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </motion.aside>

            {/* Desktop Sidebar (Static) */}
            <aside className="hidden md:block w-64 p-6 bg-card-dark/30 backdrop-blur-lg border-r border-border-color shrink-0">
                <h1 className="text-2xl font-bold mb-8 text-white">NajuAnime+</h1>
                <nav className="flex flex-col gap-4">
                    {navItems.map((item) => (
                        <Link href={item.href} key={item.label}>
                            <motion.div 
                                whileHover={{ x: 5, transition: { duration: 0.2 } }}
                                className={`flex items-center gap-3 p-3 rounded-lg text-gray-300 transition-colors relative ${pathname === item.href ? 'text-white' : 'hover:text-white'}`}
                            >
                                {pathname === item.href && <motion.div layoutId="active-pill-desktop" className="absolute left-0 top-0 h-full w-1 bg-accent-green rounded-r-full" />}
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </motion.div>
                        </Link>
                    ))}
                </nav>
            </aside>
        </>
    );
}