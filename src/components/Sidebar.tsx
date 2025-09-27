// src/components/Sidebar.tsx
import Link from 'next/link';
// --- THIS IS THE FIX ---
// We need to import the icons we are using from the lucide-react library.
import { Home, Clapperboard, Flame, User } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/manhwa', label: 'Manhwa', icon: Flame },
    { href: '/anime', label: 'Anime', icon: Clapperboard },
    { href: '/my-account', label: 'My Account', icon: User },
];

export default function Sidebar() {
    return (
        // Hidden on mobile (screens smaller than md), visible on desktop
        <aside className="hidden md:block w-64 p-6 bg-card-dark/30 backdrop-blur-lg border-r border-border-color shrink-0">
            <h1 className="text-2xl font-bold mb-8 text-white">NajuAnime+</h1>
            <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                    <Link href={item.href} key={item.label} className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-accent-purple hover:text-white transition-colors">
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
}