// src/app/my-account/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Loader, AlertTriangle } from 'lucide-react'; // Icons for loading/error

type Profile = {
  naju_id: string;
  subscription_expires_at: string | null;
  subscription_status: string | null; // Status ကို ပါ ထည့်စစ်ဆေးရန်
};

type Receipt = {
  id: string;
  created_at: string;
  receipt_url: string; // Store path only
  status: 'pending' | 'approved' | 'rejected';
};

type UserAnimeListItem = {
  status: string;
  anime_series: {
    id: string;
    poster_url: string | null;
    title_english: string | null;
    title_romaji: string | null;
  }[] | null;
};


export default function MyAccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [animeList, setAnimeList] = useState<UserAnimeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Error state ထပ်ထည့်

  const setupUser = useCallback(async (user: User) => {
    setError(null); // Reset error before fetching
    try {
        const [profileResponse, receiptsResponse, animeListResponse] = await Promise.all([
            supabase.from('profiles').select('naju_id, subscription_expires_at, subscription_status').eq('id', user.id).single(),
            supabase.from('payment_receipts').select('id, created_at, receipt_url, status').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('user_anime_list').select('status, anime_series(id, poster_url, title_english, title_romaji)').eq('user_id', user.id).order('updated_at', { ascending: false })
        ]);

        if (profileResponse.error) throw profileResponse.error;
        if (receiptsResponse.error) throw receiptsResponse.error;
        if (animeListResponse.error) throw animeListResponse.error;

        setProfile(profileResponse.data as Profile);
        setReceipts(receiptsResponse.data as Receipt[]);
        setAnimeList(animeListResponse.data as UserAnimeListItem[]);

    } catch (err: any) {
        console.error("Error fetching user data:", err);
        setError("Could not load your account details. Please try again later.");
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true); // Ensure loading is true when effect runs
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError("Could not check authentication status.");
        setLoading(false);
        return;
      }
      setSession(session);
      if (session) {
        await setupUser(session.user);
      } else {
        setLoading(false); // No session, stop loading
      }
    };
    checkSession();
  }, [setupUser]);

  const handleDeleteReceipt = async (receiptId: string, receiptPath: string) => {
    if (window.confirm('Are you sure you want to delete this receipt submission?')) {
      // ၁။ Database က record ကို အရင်ဖျက်
      const { error: dbError } = await supabase
        .from('payment_receipts')
        .delete()
        .eq('id', receiptId);

      if (dbError) {
        alert('Failed to delete receipt from database: ' + dbError.message);
        return; // Storage က file ကို မဖျက်ခင် ရပ်လိုက်ပါ
      }

      // ၂။ Database က ဖျက်ပြီးမှ Storage က file ကို ဖျက်
      const { error: storageError } = await supabase.storage
        .from('receipts')
        .remove([receiptPath]); // receiptPath က folder/filename ပါပြီးသား

      if (storageError) {
        // Storage က ဖျက်မရလည်း record ကတော့ database မှာ မရှိတော့ပါဘူး
        console.warn('Failed to delete receipt file from storage, but record was removed:', storageError.message);
        alert('Receipt file could not be deleted from storage, but the record was removed.');
      }

      // State ကို update လုပ်ပါ
      setReceipts(receipts.filter(r => r.id !== receiptId));
      alert('Receipt submission deleted successfully.');
    }
  };


  // --- Loading State ---
  if (loading) {
    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center text-white">
            <Loader className="animate-spin mr-2" size={24} /> Loading account details...
        </div>
    );
  }

  // --- Error State ---
  if (error) {
     return (
        <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-red-400">
            <AlertTriangle className="mb-2" size={32} />
            <p>{error}</p>
        </div>
     );
  }

  // --- Not Logged In State ---
  if (!session || !profile) {
    return (
        <div className="flex flex-col items-center justify-center text-center pt-20 text-white">
            <h1 className="text-3xl font-bold mb-4">Please Log In</h1>
            <p className="text-gray-300 mb-8">You need to be logged in to view your account details.</p>
            {/* Login button ကို Auth Modal ဖွင့်ခိုင်းရန် ပြင်ရန် လိုအပ်နိုင်သည် (Sidebar ကနေ ဝင်လို့ရ) */}
            <p className="text-gray-400">Use the Login button in the sidebar.</p>
        </div>
    )
  }

  // Subscription status check (ပိုမို တိကျအောင်)
  const isSubscribed = profile.subscription_status === 'active' && profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;

  // --- Logged In State ---
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white space-y-8">
        {/* Header */}
        <div>
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-gray-400">{session.user.email}</p>
        </div>

        {/* User ID & Subscription */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card-dark p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-300 mb-2">User ID</h2>
                <p className="text-gray-100 font-mono text-2xl tracking-wider">{profile.naju_id}</p>
            </div>
            <div className="bg-card-dark p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-300 mb-2">Subscription Status</h2>
                {isSubscribed ? (
                    <>
                        <p className="text-green-400 font-bold text-lg">ACTIVE</p>
                        <p className="text-gray-400 text-sm">Expires on: {new Date(profile.subscription_expires_at!).toLocaleDateString()}</p>
                    </>
                ) : (
                    <>
                        <p className="text-yellow-400 font-bold text-lg">
                           {profile.subscription_status === 'expired' ? 'EXPIRED' : 'INACTIVE'}
                        </p>
                        <Link href="/subscribe" className="mt-2 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold">Subscribe Now</Link>
                    </>
                )}
            </div>
        </div>

        {/* My Anime List Section */}
        <div>
            <h2 className="text-2xl font-bold mb-4">My Anime List</h2>
            {animeList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
                    {animeList.map(item => {
                        const anime = item.anime_series && item.anime_series.length > 0 ? item.anime_series[0] : null;
                        if (!anime) return null;

                        return (
                        <Link href={`/anime/${anime.id}`} key={`${anime.id}-${item.status}`} className="group relative transition-transform duration-200 ease-in-out hover:-translate-y-1">
                            <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg border border-transparent group-hover:border-accent-green">
                                <Image
                                    src={anime.poster_url || '/placeholder.png'} // Placeholder image ထားရန် လိုအပ်နိုင်
                                    alt={anime.title_english || anime.title_romaji || 'Anime Poster'}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-1 right-1 m-1">
                                    <span className="bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded">
                                        {item.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 p-2 w-full">
                                    <h3 className="text-sm font-semibold text-white truncate group-hover:text-accent-green">
                                        {anime.title_english || anime.title_romaji}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="bg-card-dark p-8 rounded-lg text-center shadow-md">
                    <p className="text-gray-400">Your anime list is empty. Start exploring and add some anime!</p>
                    <Link href="/anime" className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold">Browse Anime</Link>
                </div>
            )}
        </div>

        {/* Receipt Submissions Section */}
        <div className="bg-card-dark p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">My Receipt Submissions</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2"> {/* Scrollbar အတွက် padding */}
            {receipts.length > 0 ? receipts.map(r => (
                <div key={r.id} className="p-3 bg-gray-700 rounded-md flex justify-between items-center gap-4">
                    <div className="flex-1">
                        <p className="text-sm text-gray-300">Submitted on: {new Date(r.created_at).toLocaleString()}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-full ${ r.status === 'approved' ? 'bg-green-500 text-green-950' : r.status === 'rejected' ? 'bg-red-500 text-red-950' : 'bg-yellow-500 text-yellow-950'}`}>
                            {r.status.toUpperCase()}
                        </span>
                    </div>
                    {/* ဖျက်လို့ရတဲ့ status (ဥပမာ pending or rejected) မှသာ Delete button ပြရန် */}
                    {(r.status === 'pending' || r.status === 'rejected') && (
                        <button
                          onClick={() => handleDeleteReceipt(r.id, r.receipt_url)}
                          className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white font-medium transition-colors"
                          aria-label={`Delete receipt submitted on ${new Date(r.created_at).toLocaleString()}`}
                        >
                            Delete
                        </button>
                    )}
                </div>
            )) : <p className="text-gray-400">You have no submission history.</p>}
            </div>
             {receipts.length > 0 && (
                <Link href="/subscribe" className="mt-4 inline-block text-accent-green hover:underline text-sm">
                    Submit another receipt &rarr;
                </Link>
             )}
        </div>
    </motion.div>
  );
}