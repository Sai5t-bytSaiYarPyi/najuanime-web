'use client';
import { useEffect } from 'react';

const THEME_KEY = 'theme'; // 'dark' | 'light'
const SPOILER_KEY = 'hideSpoilers'; // 'true' | 'false'

export default function ClientPrefs() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const theme = (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark';
      const hideSpoilers = localStorage.getItem(SPOILER_KEY) ?? 'false';
      root.setAttribute('data-theme', theme);
      root.setAttribute('data-hide-spoilers', hideSpoilers);
    };

    apply();

    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY || e.key === SPOILER_KEY) apply();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return null;
}
