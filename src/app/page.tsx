'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';

// Define types for our data
type Profile = {
  naju_id: string;
  subscription_expires_at: string | null;
};
type Receipt = {
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
};

export default function HomePageAsDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  const setupUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);

    if (session) {
      const user = session.user;
      const userRoles = user.app_metadata?.roles || [];
      setIsAdmin(userRoles.includes('admin'));

      // Fetch profile and receipts in parallel for speed
      const [profileResponse, receiptsResponse] = await Promise.all([
        supabase.from('profiles').select('naju_id, subscription_expires_at').eq('id', user.id).single(),
        supabase.from('payment_receipts').select('created_at, status').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (profileResponse.data) setProfile(profileResponse.data as Profile);
      if (receiptsResponse.data) setReceipts(receiptsResponse.data as Receipt[]);

    } else {
      // Clear all data on logout
      setIsAdmin(false);
      setProfile(null);
      setReceipts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setupUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setupUser();
    });
    return () => subscription.unsubscribe();
  }, [setupUser]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const isSubscribed = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;

  // Render loading state
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900"></div>;
  }
  
  // Render different views based on login status
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {session && profile ? (
          // --- LOGGED-IN VIEW (USER DASHBOARD) ---
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Welcome, {session.user.email?.split('@')[0]}</h1>
                <p className="text-gray-400 font-mono">User ID: {profile.naju_id}</p>
              </div>
              <button onClick={signOut} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold">Sign Out</button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Subscription Status Card */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Subscription Status</h2>
                {isSubscribed ? (
                  <>
                    <p className="text-green-400 font-bold text-lg">ACTIVE</p>
                    <p className="text-gray-400">Expires on: {new Date(profile.subscription_expires_at!).toLocaleDateString()}</p>
                    <Link href="/anime" className="mt-4 inline-block px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md">Watch Anime</Link>
                  </>
                ) : (
                  <>
                    <p className="text-yellow-400 font-bold text-lg">INACTIVE</p>
                    <p className="text-gray-400">You do not have an active subscription.</p>
                    <Link href="/subscribe" className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">Subscribe Now</Link>
                  </>
                )}
              </div>

              {/* Quick Access Card */}
              <div className="bg-gray-800 p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">Quick Access</h2>
                  <div className="flex flex-col items-start gap-3">
                    <Link href="/manhwa" className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md">Read Manhwa (Free)</Link>
                    {isAdmin && (
                        <Link href="/admin" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md">Admin Dashboard</Link>
                    )}
                  </div>
              </div>
            </div>
            
            {/* Receipt History */}
            <div className="mt-8 bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">My Receipt Submissions</h2>
                <div className="space-y-3">
                {receipts.length > 0 ? receipts.map(r => (
                    <div key={r.created_at} className="p-3 bg-gray-700 rounded-md flex justify-between items-center">
                    <p>Submitted on: {new Date(r.created_at).toLocaleString()}</p>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${ r.status === 'approved' ? 'bg-green-500' : r.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                        {r.status.toUpperCase()}
                    </span>
                    </div>
                )) : <p className="text-gray-400">You have no submission history.</p>}
                </div>
            </div>
          </div>
        ) : (
          // --- LOGGED-OUT VIEW (LANDING PAGE) ---
          <div className="flex flex-col items-center justify-center text-center pt-20">
            <h1 className="text-5xl font-bold mb-4">Welcome to NajuAnime</h1>
            <p className="text-gray-300 mb-8 max-w-xl">Watch the latest anime with Myanmar subtitles and read popular manhwa for free. Sign in to get started.</p>
            <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-lg" onClick={() => { supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }); }}>
              Sign in with Google
            </button>
             <Link href="/manhwa" className="mt-4 text-yellow-400 hover:text-yellow-300">or browse free Manhwa &rarr;</Link>
          </div>
        )}
      </div>
    </main>
  );
}