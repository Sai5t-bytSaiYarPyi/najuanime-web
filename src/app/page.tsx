// src/app/page.tsx
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center pt-20">
      <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-accent-green to-accent-purple text-transparent bg-clip-text">
        Unlock Your Anime Universe
      </h1>
      <p className="text-gray-300 mb-8 max-w-xl">
        Watch the latest anime with Myanmar subtitles and read popular manhwa for free.
      </p>
      
      {session ? (
        <div className="flex flex-col items-center gap-4">
            <p className="text-lg">Welcome back, {session.user.email?.split('@')[0]}</p>
            <Link href="/my-account">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-lg">
                    Go to My Account
                </motion.div>
            </Link>
        </div>
      ) : (
        // --- START: signInWithOAuth ကို ပြင်ဆင်ခြင်း ---
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-lg" 
          onClick={() => { 
            supabase.auth.signInWithOAuth({ 
              provider: 'google', 
              options: { 
                // redirectTo မှာ /auth/callback ကို ထည့်သွင်းပေးရပါမည်။
                redirectTo: `${window.location.origin}/auth/callback` 
              } 
            }); 
          }}
        >
          Sign in with Google
        </motion.button>
        // --- END: signInWithOAuth ကို ပြင်ဆင်ခြင်း ---
      )}

      <Link href="/manhwa" className="mt-6 text-yellow-400 hover:text-yellow-300">
        or browse free Manhwa &rarr;
      </Link>
    </motion.div>
  );
}