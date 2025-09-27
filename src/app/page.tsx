'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion } from 'framer-motion'; // Import motion from framer-motion

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
      const [profileResponse, receiptsResponse] = await Promise.all([
        supabase.from('profiles').select('naju_id, subscription_expires_at').eq('id', user.id).single(),
        supabase.from('payment_receipts').select('created_at, status').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);
      if (profileResponse.data) setProfile(profileResponse.data as Profile);
      if (receiptsResponse.data) setReceipts(receiptsResponse.data as Receipt[]);
    } else {
      setIsAdmin(false); setProfile(null); setReceipts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setupUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { setupUser(); });
    return () => subscription.unsubscribe();
  }, [setupUser]);

  async function signOut() { await supabase.auth.signOut(); }

  const isSubscribed = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) { return <div className="flex min-h-screen items-center justify-center bg-gray-900"></div>; }
  
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {session && profile ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants} className="flex flex-wrap justify-between items-center mb-10 gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold">Welcome, <span className="text-green-400">{session.user.email?.split('@')[0]}</span></h1>
                <p className="text-gray-400 font-mono text-sm">User ID: {profile.naju_id}</p>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={signOut} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-semibold shadow-lg">Sign Out</motion.button>
            </motion.div>

            <motion.div variants={containerVariants} className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Subscription & Access Column */}
              <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm">
                  <h2 className="text-xl font-bold mb-4">Subscription Status</h2>
                  {isSubscribed ? (
                    <>
                      <p className="text-green-400 font-bold text-lg">ACTIVE</p>
                      <p className="text-gray-400">Expires on: {new Date(profile.subscription_expires_at!).toLocaleDateString()}</p>
                      <Link href="/anime"><motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4 text-center w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg shadow-md cursor-pointer">Watch Anime</motion.div></Link>
                    </>
                  ) : (
                    <>
                      <p className="text-yellow-400 font-bold text-lg">INACTIVE</p>
                      <p className="text-gray-400">You do not have an active subscription.</p>
                      <Link href="/subscribe"><motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="mt-4 text-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md cursor-pointer">Subscribe Now</motion.div></Link>
                    </>
                  )}
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm">
                  <h2 className="text-xl font-bold mb-4">Quick Access</h2>
                  <div className="flex flex-col items-start gap-3">
                    <Link href="/manhwa"><motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg shadow-md cursor-pointer">Read Manhwa (Free)</motion.div></Link>
                    {isAdmin && (<Link href="/admin"><motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md cursor-pointer">Admin Dashboard</motion.div></Link>)}
                  </div>
                </div>
              </motion.div>
              
              {/* Receipt History Column */}
              <motion.div variants={itemVariants} className="lg:col-span-2 bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4">My Receipt Submissions</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {receipts.length > 0 ? receipts.map(r => (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} key={r.created_at} className="p-4 bg-gray-700/70 rounded-lg flex justify-between items-center">
                    <div>
                        <p>Submitted on: {new Date(r.created_at).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleTimeString()}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${ r.status === 'approved' ? 'bg-green-500/80 text-white' : r.status === 'rejected' ? 'bg-red-500/80 text-white' : 'bg-yellow-500/80 text-black'}`}>
                      {r.status.toUpperCase()}
                    </span>
                  </motion.div>
                )) : <p className="text-gray-400">You have no submission history.</p>}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center text-center pt-20">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">Welcome to NajuAnime</h1>
            <p className="text-gray-300 mb-8 max-w-xl text-lg">Watch the latest anime with Myanmar subtitles and read popular manhwa for free. Sign in to get started.</p>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold text-lg shadow-lg" onClick={() => { supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }); }}>
              Sign in with Google
            </motion.button>
            <Link href="/manhwa" className="mt-4 text-yellow-400 hover:text-yellow-300 transition-colors">or browse free Manhwa &rarr;</Link>
          </motion.div>
        )}
      </div>
    </main>
  );
}