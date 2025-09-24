'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Link from 'next/link'; // Import Link

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // State to check for admin role

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Check for admin role when session is loaded
      const userRoles = session?.user?.app_metadata?.roles || [];
      setIsAdmin(userRoles.includes('admin'));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Check for admin role on auth state change
      const userRoles = session?.user?.app_metadata?.roles || [];
      setIsAdmin(userRoles.includes('admin'));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setIsAdmin(false); // Reset admin state on logout
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">NajuAnime</h1>
        {session ? (
          <div>
            <p className="mb-4">Welcome, {session.user.email}</p>
            {/* Conditionally render the admin link */}
            {isAdmin && (
              <Link href="/admin" className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold mb-4">
                Go to Admin Dashboard
              </Link>
            )}
            <br />
            <button
              onClick={signOut}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4">Please sign in to continue.</p>
            <button
              onClick={signInWithGoogle}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </main>
  );
}