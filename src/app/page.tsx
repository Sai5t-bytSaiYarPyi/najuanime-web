'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Link from 'next/link';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false); // New state for subscription
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Check for admin role
        const userRoles = session.user.app_metadata?.roles || [];
        setIsAdmin(userRoles.includes('admin'));

        // Check for active subscription
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_expires_at')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const isActive = profile.subscription_status === 'active';
          const isNotExpired = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;
          setIsSubscribed(isActive && isNotExpired);
        }
      }
      setLoading(false);
    };

    setupUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Re-run setup on auth change
      setupUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsSubscribed(false);
    setSession(null);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">NajuAnime</h1>
        {session ? (
          <div>
            <p className="mb-4">Welcome, {session.user.email}</p>
            
            {isSubscribed && (
               <Link href="/anime" className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold mb-4">
                 Watch Anime
               </Link>
            )}
            
            {isAdmin && (
              <Link href="/admin" className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold mb-4 ml-2">
                Admin Dashboard
              </Link>
            )}
            
            <br />
            <button
              onClick={signOut}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold mt-4"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4">Please sign in to continue.</p>
            {/* This was a Link, now it's a button. This fixes the build error. */}
            <button 
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
                onClick={() => {
                    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
                }}
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </main>
  );
}