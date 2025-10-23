// src/app/my-account/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion'; // AnimatePresence ထပ်ထည့်
import Image from 'next/image';
import { Loader, AlertTriangle, User as UserIcon, ListVideo, Settings, Edit3 } from 'lucide-react'; // Icons ထပ်ထည့်

// --- Type Definitions (unchanged) ---
type Profile = {
  naju_id: string;
  subscription_expires_at: string | null;
  subscription_status: string | null;
  // --- အနာဂတ်အတွက် fields ---
  // username: string | null; // Database မှာ username column ထည့်ပြီးရင်သုံးရန်
  // bio: string | null;
  // avatar_url: string | null;
  // banner_url: string | null;
};
type Receipt = {
  id: string;
  created_at: string;
  receipt_url: string;
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

// --- Tab Definition ---
type Tab = 'profile' | 'anime_list' | 'settings';

export default function MyAccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [animeList, setAnimeList] = useState<UserAnimeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('profile'); // Active tab state

  // --- Data Fetching Logic (unchanged) ---
  const setupUser = useCallback(async (user: User) => { /* ... */
    setError(null);
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
    } catch (err: any) { console.error("Error fetching user data:", err); setError("Could not load account details."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { /* ... (unchanged session check) ... */
    setLoading(true);
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) { setError("Could not check status."); setLoading(false); return; }
      setSession(session);
      if (session) { await setupUser(session.user); }
      else { setLoading(false); }
    };
    checkSession();
   }, [setupUser]);

  // --- Delete Receipt Logic (unchanged) ---
  const handleDeleteReceipt = async (receiptId: string, receiptPath: string) => { /* ... */
      if (window.confirm('Delete this submission?')) {
          const { error: dbError } = await supabase.from('payment_receipts').delete().eq('id', receiptId);
          if (dbError) { alert('Failed: ' + dbError.message); return; }
          const { error: storageError } = await supabase.storage.from('receipts').remove([receiptPath]);
          if (storageError) { console.warn('Storage delete failed:', storageError.message); }
          setReceipts(receipts.filter(r => r.id !== receiptId)); alert('Deleted.');
      }
   };

  // --- Loading State ---
  if (loading) { /* ... (unchanged loading UI) ... */
     return (<div className="flex min-h-[calc(100vh-200px)] items-center justify-center text-white"><Loader className="animate-spin mr-2" size={24} /> Loading...</div>);
  }
  // --- Error State ---
  if (error) { /* ... (unchanged error UI) ... */
      return (<div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-red-400"><AlertTriangle className="mb-2" size={32} /><p>{error}</p></div>);
  }
  // --- Not Logged In State ---
  if (!session || !profile) { /* ... (unchanged logged out UI) ... */
     return (<div className="flex flex-col items-center justify-center text-center pt-20 text-white"><h1 className="text-3xl font-bold mb-4">Please Log In</h1><p className="text-gray-300 mb-8">Login required.</p><p className="text-gray-400">Use the Login button in the sidebar.</p></div>);
  }

  // --- Subscription Status Logic (unchanged) ---
  const isSubscribed = profile.subscription_status === 'active' && profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;
  const usernameDisplay = session.user.email?.split('@')[0] || 'User'; // Get username from email for now

  // --- Tab Content Components ---

  const ProfileTabContent = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Banner Placeholder */}
        <div className="h-40 md:h-56 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-lg relative shadow-lg">
            {/* Banner Image will go here */}
             <button className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors text-xs">
                 <Edit3 size={14} className="inline mr-1"/> Change Banner
             </button>
        </div>

        {/* Avatar & Basic Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20 px-6">
            {/* Avatar Placeholder */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background-dark bg-gray-600 flex items-center justify-center overflow-hidden shadow-xl shrink-0">
                 <UserIcon size={64} className="text-gray-400" />
                 <button className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-xs">
                      <Edit3 size={14} className="mr-1"/> Change
                 </button>
            </div>
            <div className="text-center sm:text-left pb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{usernameDisplay}</h1>
                <p className="text-gray-400 font-mono text-sm">@{profile.naju_id}</p>
            </div>
             <div className="sm:ml-auto">
                 {/* Edit Profile Button Placeholder */}
                 <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5">
                      <Edit3 size={14} /> Edit Profile
                 </button>
             </div>
        </div>

        {/* Bio Placeholder */}
        <div className="px-6 space-y-4">
             <div className="bg-card-dark p-4 rounded-lg shadow-md">
                 <h3 className="font-semibold text-gray-300 mb-1">About Me</h3>
                 <p className="text-gray-400 text-sm italic">
                    No bio added yet. Click 'Edit Profile' to add one!
                 </p>
             </div>

             {/* Subscription Status */}
             <div className="bg-card-dark p-4 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-300 mb-1">Subscription</h3>
                {isSubscribed ? (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
                        <span className="text-green-400 font-medium">ACTIVE</span>
                        <span className="text-gray-400 text-sm">(Expires on: {new Date(profile.subscription_expires_at!).toLocaleDateString()})</span>
                    </div>
                ) : (
                     <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full inline-block"></span>
                        <span className="text-yellow-400 font-medium">{profile.subscription_status === 'expired' ? 'EXPIRED' : 'INACTIVE'}</span>
                        <Link href="/subscribe" className="ml-auto text-blue-400 hover:underline text-sm font-semibold">Subscribe Now</Link>
                    </div>
                )}
            </div>
            {/* Statistics Placeholder */}
            {/* Favorites Placeholder */}
            {/* Recent Activity Placeholder */}
        </div>
    </motion.div>
  );

  const AnimeListTabContent = () => (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* TODO: Add sub-tabs for Watching, Completed etc. */}
        {animeList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
                {animeList.map(item => {
                    const anime = item.anime_series && item.anime_series.length > 0 ? item.anime_series[0] : null;
                    if (!anime) return null;
                    return (
                        <Link href={`/anime/${anime.id}`} key={`${anime.id}-${item.status}`} className="group relative transition-transform duration-200 ease-in-out hover:-translate-y-1">
                             <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg border border-transparent group-hover:border-accent-green">
                                <Image src={anime.poster_url || '/placeholder.png'} alt={anime.title_english || 'Poster'} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute top-1 right-1 m-1"><span className="bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded">{item.status.replace('_', ' ').toUpperCase()}</span></div>
                                <div className="absolute bottom-0 left-0 p-2 w-full"><h3 className="text-sm font-semibold text-white truncate group-hover:text-accent-green">{anime.title_english || anime.title_romaji}</h3></div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        ) : (
             <div className="bg-card-dark p-8 rounded-lg text-center shadow-md mt-6"><p className="text-gray-400">Your anime list is empty.</p><Link href="/anime" className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold">Browse Anime</Link></div>
        )}
     </motion.div>
  );

  const SettingsTabContent = () => (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h2 className="text-2xl font-bold">Account Settings</h2>
         {/* Edit Profile Section Placeholder */}
         <div className="bg-card-dark p-6 rounded-lg shadow-md">
             <h3 className="text-xl font-semibold mb-3">Edit Profile</h3>
             <p className="text-gray-400 text-sm">Username, Bio, etc. (Coming Soon)</p>
         </div>
         {/* Account Management Placeholder */}
          <div className="bg-card-dark p-6 rounded-lg shadow-md">
             <h3 className="text-xl font-semibold mb-3">Account Management</h3>
             <p className="text-gray-400 text-sm">Change Email, Change Password. (Coming Soon)</p>
         </div>
         {/* Receipt Submissions (Moved Here) */}
         <div className="bg-card-dark p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">My Receipt Submissions</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {receipts.length > 0 ? receipts.map(r => (
                    <div key={r.id} className="p-3 bg-gray-700 rounded-md flex justify-between items-center gap-4">
                        <div>
                            <p className="text-sm text-gray-300">Submitted: {new Date(r.created_at).toLocaleString()}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-full ${ r.status === 'approved' ? 'bg-green-500 text-green-950' : r.status === 'rejected' ? 'bg-red-500 text-red-950' : 'bg-yellow-500 text-yellow-950'}`}>{r.status.toUpperCase()}</span>
                        </div>
                        {(r.status === 'pending' || r.status === 'rejected') && (<button onClick={() => handleDeleteReceipt(r.id, r.receipt_url)} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white font-medium transition-colors">Delete</button>)}
                    </div>
                )) : <p className="text-gray-400">No submission history.</p>}
            </div>
             {receipts.length >= 0 && (<Link href="/subscribe" className="mt-4 inline-block text-accent-green hover:underline text-sm">Submit another receipt &rarr;</Link>)}
         </div>
          {/* Danger Zone Placeholder */}
          <div className="bg-red-900/30 border border-red-700 p-6 rounded-lg shadow-md">
             <h3 className="text-xl font-semibold mb-3 text-red-300">Danger Zone</h3>
             <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Delete My Account (Coming Soon)</button>
             <p className="text-red-300 text-xs mt-2">This action is permanent and cannot be undone.</p>
         </div>
     </motion.div>
  );


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8 border-b border-border-color">
            <nav className="-mb-px flex space-x-6 sm:space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'profile'
                        ? 'border-accent-green text-accent-green'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    }`}
                >
                   <UserIcon size={16} className="inline mr-1.5"/> Profile
                </button>
                 <button
                    onClick={() => setActiveTab('anime_list')}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'anime_list'
                        ? 'border-accent-green text-accent-green'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    }`}
                >
                   <ListVideo size={16} className="inline mr-1.5"/> Anime List
                </button>
                 <button
                    onClick={() => setActiveTab('settings')}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'settings'
                        ? 'border-accent-green text-accent-green'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    }`}
                >
                   <Settings size={16} className="inline mr-1.5"/> Settings
                </button>
            </nav>
        </div>

        {/* Tab Content */}
        <div>
            <AnimatePresence mode="wait">
                {activeTab === 'profile' && <ProfileTabContent key="profile" />}
                {activeTab === 'anime_list' && <AnimeListTabContent key="anime_list" />}
                {activeTab === 'settings' && <SettingsTabContent key="settings" />}
            </AnimatePresence>
        </div>
    </div>
  );
}