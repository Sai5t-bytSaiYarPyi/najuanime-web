// src/app/my-account/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

type Profile = {
  naju_id: string;
  subscription_expires_at: string | null;
};
type Receipt = {
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
};

// --- START: TYPE DEFINITION FIX ---
// Changed anime_series to be an array of objects to match Supabase's response
type UserAnimeListItem = {
  status: string;
  anime_series: {
    id: string;
    poster_url: string | null;
    title_english: string | null;
    title_romaji: string | null;
  }[]; // It's an array now
};
// --- END: TYPE DEFINITION FIX ---

export default function MyAccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [animeList, setAnimeList] = useState<UserAnimeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const setupUser = useCallback(async (user: User) => {
    const [profileResponse, receiptsResponse, animeListResponse] = await Promise.all([
      supabase.from('profiles').select('naju_id, subscription_expires_at').eq('id', user.id).single(),
      supabase.from('payment_receipts').select('created_at, status').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_anime_list').select('status, anime_series(id, poster_url, title_english, title_romaji)').eq('user_id', user.id).order('updated_at', { ascending: false })
    ]);

    if (profileResponse.data) setProfile(profileResponse.data as Profile);
    if (receiptsResponse.data) setReceipts(receiptsResponse.data as Receipt[]);
    if (animeListResponse.data) setAnimeList(animeListResponse.data as UserAnimeListItem[]);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        await setupUser(session.user);
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [setupUser]);

  const isSubscribed = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900"></div>;
  }
  
  if (!session || !profile) {
    return (
        <div className="flex flex-col items-center justify-center text-center pt-20">
            <h1 className="text-3xl font-bold mb-4">Please Log In</h1>
            <p className="text-gray-300 mb-8">You need to be logged in to view your account details.</p>
            <Link href="/" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-lg">
                Go to Homepage
            </Link>
        </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold">My Account</h1>
                <p className="text-gray-400">{session.user.email}</p>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card-dark p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">User ID</h2>
                <p className="text-gray-300 font-mono text-2xl">{profile.naju_id}</p>
            </div>
            <div className="bg-card-dark p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Subscription Status</h2>
                {isSubscribed ? (
                    <>
                        <p className="text-green-400 font-bold text-lg">ACTIVE</p>
                        <p className="text-gray-400">Expires on: {new Date(profile.subscription_expires_at!).toLocaleDateString()}</p>
                    </>
                ) : (
                    <>
                        <p className="text-yellow-400 font-bold text-lg">INACTIVE</p>
                        <Link href="/subscribe" className="mt-2 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">Subscribe Now</Link>
                    </>
                )}
            </div>
        </div>
        
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">My Anime List</h2>
            {animeList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {animeList.map(item => {
                        // --- START: JSX FIX ---
                        // Get the first item from the anime_series array
                        const anime = Array.isArray(item.anime_series) ? item.anime_series[0] : item.anime_series;
                        if (!anime) return null;
                        // --- END: JSX FIX ---
                        
                        return (
                        <Link href={`/anime/${anime.id}`} key={anime.id} className="group relative">
                            <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-lg">
                                <Image
                                    src={anime.poster_url || '/placeholder.png'}
                                    alt={anime.title_english || 'Poster'}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                />
                                <div className="absolute top-0 right-0 m-2">
                                    <span className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {item.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <h3 className="mt-2 text-sm font-semibold truncate group-hover:text-green-400">
                                {anime.title_english || anime.title_romaji}
                            </h3>
                        </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-card-dark p-8 rounded-lg text-center">
                    <p className="text-gray-400">Your anime list is empty. Start by adding some anime!</p>
                </div>
            )}
        </div>

        <div className="mt-8 bg-card-dark p-6 rounded-lg">
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
    </motion.div>
  );
}