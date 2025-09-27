// src/components/Sidebar.tsx
import Link from 'next/link';
import { Home, Clapperboard, Flame, User } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/manhwa', label: 'Manhwa', icon: Flame },
    { href: '/anime', label: 'Anime', icon: Clapperboard },
    // --- THIS IS THE FIX ---
    { href: '/', label: 'My Account', icon: User },
];

export default function Sidebar() {
    return (
        <aside className="hidden md:block w-64 p-6 bg-card-dark/30 backdrop-blur-lg border-r border-border-color">
            <h1 className="text-2xl font-bold mb-8">NajuAnime+</h1>
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