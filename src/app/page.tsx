'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check for an existing session when the component mounts
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes in authentication state (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Redirect back to the home page after login
      },
    });
    if (error) {
      console.error('Error logging in:', error.message);
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">NajuAnime</h1>
        {session ? (
          <div>
            <p className="mb-4">Welcome, {session.user.email}</p>
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