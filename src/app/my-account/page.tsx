// src/app/my-account/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader, AlertTriangle, User as UserIcon, ListVideo, Settings, Edit3, UploadCloud } from 'lucide-react';

// --- Type Definitions --- (No changes here)
type Profile = {
  id: string;
  naju_id: string;
  subscription_expires_at: string | null;
  subscription_status: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};
type Receipt = { id: string; created_at: string; receipt_url: string; status: 'pending' | 'approved' | 'rejected'; };
type UserAnimeListItem = {
    status: string;
    anime_series: {
        id: string;
        poster_url: string | null;
        title_english: string | null;
        title_romaji: string | null;
    } | null;
};
type Tab = 'profile' | 'anime_list' | 'settings';

export default function MyAccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [animeList, setAnimeList] = useState<UserAnimeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // --- Data Fetching Logic ---
  const setupUser = useCallback(async (user: User) => {
    console.log("Setting up user data for:", user.id);
    //setError(null); // Let the caller reset error before calling setupUser
    let success = false;
    try {
        const [profileResponse, receiptsResponse, animeListResponse] = await Promise.all([
            supabase.from('profiles').select('id, naju_id, subscription_expires_at, subscription_status, avatar_url, banner_url').eq('id', user.id).single(),
            supabase.from('payment_receipts').select('id, created_at, receipt_url, status').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('user_anime_list').select('status, anime_series (id, poster_url, title_english, title_romaji)').eq('user_id', user.id).order('updated_at', { ascending: false })
        ]);

        console.log("Profile response:", profileResponse);
        console.log("Receipts response:", receiptsResponse);
        console.log("Anime list response:", animeListResponse);

        if (profileResponse.error && profileResponse.error.code !== 'PGRST116') throw new Error(`Profile fetch failed: ${profileResponse.error.message}`);
        if (receiptsResponse.error) throw new Error(`Receipts fetch failed: ${receiptsResponse.error.message}`);
        if (animeListResponse.error) throw new Error(`Anime list fetch failed: ${animeListResponse.error.message}`);

        setProfile(profileResponse.data ? profileResponse.data as Profile : null);
        setReceipts(receiptsResponse.data as Receipt[] || []);

        const fetchedAnimeList = animeListResponse.data;
        if (fetchedAnimeList && Array.isArray(fetchedAnimeList)) {
          const correctlyTypedList: UserAnimeListItem[] = fetchedAnimeList.map((item: any) => {
             const animeSeriesData = item.anime_series;
             const typedAnimeSeries = (animeSeriesData && typeof animeSeriesData === 'object' && animeSeriesData !== null)
                ? {
                    id: animeSeriesData.id, poster_url: animeSeriesData.poster_url,
                    title_english: animeSeriesData.title_english, title_romaji: animeSeriesData.title_romaji
                  } : null;
             return { status: item.status, anime_series: typedAnimeSeries };
           });
          setAnimeList(correctlyTypedList);
        } else {
          setAnimeList([]);
        }

        success = true;
        console.log("User data setup successful.");
        return true; // Indicate success
    } catch (err: any) {
        console.error("Error during setupUser:", err);
        setError(`Could not load account details: ${err.message}. Please try refreshing the page.`);
        return false; // Indicate failure
    }
    // setLoading(false) is handled by the caller (useEffect)
  }, []); // Keep dependencies empty

  // --- START: Moved checkSessionAndSetup function outside useEffect ---
  // Wrap with useCallback to memoize the function reference.
  // Dependencies: setupUser (which is also memoized)
  const checkSessionAndSetup = useCallback(async (isInitialLoad = false) => {
      console.log(`Checking session... (Initial Load: ${isInitialLoad})`);
      setLoading(true); // Always start loading for checks/refreshes
      setError(null);

      try {
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          console.log("getSession result:", { currentSession, sessionError });

          // No need for isMounted check here as it's called from useEffect or onClick

          if (sessionError) throw new Error(`Session check failed: ${sessionError.message}`);

          setSession(currentSession); // Update session state

          if (currentSession && currentSession.user) {
              console.log("Session found, calling setupUser...");
              await setupUser(currentSession.user);
          } else {
              console.log("No session found, clearing data.");
              setProfile(null);
              setReceipts([]);
              setAnimeList([]);
          }
      } catch (err: any) {
           console.error("Error in checkSessionAndSetup:", err);
           // Set error state here so the UI can display it
           setError(err.message || "An error occurred while loading account data.");
      } finally {
          // --- Centralized setLoading(false) ---
          console.log("Setting loading to false in checkSessionAndSetup finally block.");
          setLoading(false);
      }
  }, [setupUser]); // Dependency on setupUser
  // --- END: Moved checkSessionAndSetup function ---

  // --- useEffect Hook for Session Check and Data Loading ---
  useEffect(() => {
    console.log("MyAccountPage useEffect running.");
    let isMounted = true;
    let initialLoadHandled = false;

    // Call the check function on initial mount
    checkSessionAndSetup(true); // Pass true for initial load flag

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession);
        if (!isMounted) return;

        const previousUserId = session?.user?.id;
        const newUserId = newSession?.user?.id;

        // Set session first
        setSession(newSession);

        // Avoid reload if it's the initial SIGNED_IN event (already handled by initial checkSessionAndSetup)
        if (event === 'SIGNED_IN' && initialLoadHandled && newUserId === previousUserId) {
            console.log("Ignoring initial duplicate SIGNED_IN event.");
            return;
        }
        // Mark initial load as handled after the first auth event (or initial check finishes)
        initialLoadHandled = true;


        if (newUserId !== previousUserId) { // User actually changed
            console.log(`User change detected (${event}). Previous: ${previousUserId}, New: ${newUserId}`);
            setLoading(true);
            setError(null);
            if (newSession && newSession.user) {
                console.log("User logged in or switched. Refetching data.");
                await setupUser(newSession.user); // setupUser now returns success/fail but doesn't handle loading
                setLoading(false); // Manually set loading false after setupUser finishes
            } else {
                console.log("User logged out. Clearing data.");
                setProfile(null);
                setReceipts([]);
                setAnimeList([]);
                setLoading(false);
            }
        } else if (event === 'USER_UPDATED' && newSession && newSession.user) {
            console.log("User updated. Silently refreshing profile maybe?");
            // Silently refresh profile
            // const { data } = await supabase.from('profiles')...
            // if (data && isMounted) setProfile(data as Profile);
        } else {
            console.log(`Auth event '${event}' occurred, user ID (${newUserId}) unchanged. No major reload triggered.`);
        }
      }
    );

     // Cleanup function
     return () => {
       console.log("MyAccountPage useEffect cleanup.");
       isMounted = false;
       authListener?.subscription.unsubscribe();
     };
     // Add checkSessionAndSetup to dependencies? No, it's memoized. Keep session.
   }, [setupUser, session, checkSessionAndSetup]); // <-- Added checkSessionAndSetup dependency

  // --- Delete Receipt Logic --- (unchanged)
  const handleDeleteReceipt = async (receiptId: string, receiptPath: string | null) => {
       if (!receiptPath) { alert('Receipt path missing...'); return; }
       if (window.confirm('Delete submission?')) {
          setLoading(true);
          try {
              const { error: dbError } = await supabase.from('payment_receipts').delete().eq('id', receiptId);
              if (dbError) throw dbError;
              const { error: storageError } = await supabase.storage.from('receipts').remove([receiptPath]);
              if (storageError) console.warn('Storage delete failed:', storageError.message);
              setReceipts(prevReceipts => prevReceipts.filter(r => r.id !== receiptId));
              alert('Deleted.');
          } catch (err: any) {
              console.error("Error deleting receipt:", err);
              alert('Failed: ' + err.message);
          } finally { setLoading(false); }
      }
  };

  // --- Image Upload Logic --- (unchanged)
  const handleImageUpload = async (
      event: React.ChangeEvent<HTMLInputElement>,
      bucket: 'avatars' | 'banners',
      setLoadingState: (loading: boolean) => void
  ) => {
      if (!session?.user || !profile) { setError("User/profile missing."); return; }
      if (!event.target.files || event.target.files.length === 0) { setError("No file."); return; }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      setLoadingState(true); setError(null);
      try {
          const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
          const publicUrl = urlData.publicUrl;
          if (!publicUrl) throw new Error("No public URL.");
          const updates = bucket === 'avatars' ? { avatar_url: publicUrl } : { banner_url: publicUrl };
          const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
          if (updateError) throw updateError;
          setProfile(prev => prev ? { ...prev, ...updates } : null);
          alert(`${bucket} updated!`);
      } catch (err: any) {
          console.error(`Upload Error (${bucket}):`, err);
          setError(`Failed: ${err.message || ''}`);
      } finally {
          setLoadingState(false);
          if (event.target) event.target.value = '';
      }
  };


  // --- Loading State --- (unchanged)
  if (loading) {
      console.log("Rendering loading state...");
      return (<div className="flex min-h-[calc(100vh-200px)] items-center justify-center text-white"><Loader className="animate-spin mr-2" size={24} /> Loading...</div>);
  }

  // --- Error State ---
  if (error) {
      console.log("Rendering error state:", error);
      return (
          <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-red-400 text-center px-4">
              <AlertTriangle className="mb-2" size={32} />
              <p className="font-semibold">Failed to Load Account Details</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">{error}</p>
              <button
                  // --- FIX: Correct function name is used here ---
                  onClick={() => checkSessionAndSetup()} // Call the memoized function directly
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white"
              >
                  Try Again
              </button>
          </div>
      );
  }


  // --- Not Logged In State --- (unchanged)
  if (!session || !session.user) {
      console.log("Rendering not logged in state...");
      return (<div className="flex flex-col items-center justify-center text-center pt-20 text-white"><h1 className="text-3xl font-bold mb-4">Please Log In</h1><p className="text-gray-300 mb-8">Login required.</p><p className="text-gray-400">Use the Login button in the sidebar.</p></div>);
  }

  // --- Profile Not Ready State --- (unchanged)
  if (!profile) {
    console.log("Rendering profile not ready state...");
    return (
        <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-yellow-400 text-center">
            <AlertTriangle className="mb-2" size={32} />
            <p className="font-semibold">Profile data not available.</p>
            <p className='text-sm text-gray-400 mt-2'>(Please try refreshing.)</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white"
            >
                Refresh Page
            </button>
        </div>
    );
  }

  // --- Main Render Logic --- (unchanged)
  console.log("Rendering main content...");
  const isSubscribed = profile.subscription_status === 'active' && profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;
  const usernameDisplay = profile?.naju_id || session.user.email?.split('@')[0] || 'User';

  // --- Tab Content Components --- (unchanged)
  // ... (ProfileTabContent, AnimeListTabContent, SettingsTabContent remain the same) ...
  const ProfileTabContent = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Banner */}
        <div className="h-40 md:h-56 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-lg relative shadow-lg group overflow-hidden">
            {profile?.banner_url ? (
                <Image src={profile.banner_url} alt="Profile Banner" fill style={{ objectFit: 'cover' }} className="rounded-lg" priority sizes="(max-width: 768px) 100vw, 1184px"/>
            ) : ( <div className="absolute inset-0 flex items-center justify-center text-gray-500">Default Banner Area</div> )}
             <button onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors text-xs opacity-0 group-hover:opacity-100 flex items-center gap-1 z-10">
                 {uploadingBanner ? <Loader size={14} className="animate-spin"/> : <UploadCloud size={14} />} {uploadingBanner ? 'Uploading...' : 'Change Banner'}
             </button>
             <input type="file" ref={bannerInputRef} onChange={(e) => handleImageUpload(e, 'banners', setUploadingBanner)} accept="image/png, image/jpeg, image/webp, image/gif" style={{ display: 'none' }} />
        </div>

        {/* Avatar & Basic Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20 px-6">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background-dark bg-gray-600 flex items-center justify-center overflow-hidden shadow-xl shrink-0 group">
                {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="User Avatar" fill style={{ objectFit: 'cover' }} className="rounded-full" sizes="(max-width: 768px) 128px, 160px"/>
                ) : ( <UserIcon size={64} className="text-gray-400" /> )}
                 <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer z-10">
                     {uploadingAvatar ? <Loader size={20} className="animate-spin mb-1"/> : <UploadCloud size={20} className="mb-1"/>} {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                 </button>
                 <input type="file" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, 'avatars', setUploadingAvatar)} accept="image/png, image/jpeg, image/webp, image/gif" style={{ display: 'none' }} />
            </div>
            <div className="text-center sm:text-left pb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{usernameDisplay}</h1>
                <p className="text-gray-400 font-mono text-sm">@{profile?.naju_id || 'N/A'}</p>
            </div>
            <div className="sm:ml-auto">
                 <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50" disabled>
                     <Edit3 size={14} /> Edit Profile (Soon)
                 </button>
            </div>
        </div>

        {/* Bio, Subscription */}
        <div className="px-6 space-y-4">
             <div className="bg-card-dark p-4 rounded-lg shadow-md"><h3 className="font-semibold text-gray-300 mb-1">About Me</h3><p className="text-gray-400 text-sm italic">No bio added yet.</p></div>
             <div className="bg-card-dark p-4 rounded-lg shadow-md">
                 <h3 className="font-semibold text-gray-300 mb-1">Subscription</h3>
                 {isSubscribed ? (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full inline-block animate-pulse"></span>
                        <span className="text-green-400 font-medium">ACTIVE</span>
                        <span className="text-gray-400 text-sm">(Expires: {profile?.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : 'N/A'})</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 ${profile?.subscription_status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'} rounded-full inline-block`}></span>
                        <span className={`${profile?.subscription_status === 'expired' ? 'text-red-400' : 'text-yellow-400'} font-medium`}>
                            {profile?.subscription_status === 'expired' ? 'EXPIRED' : 'INACTIVE'}
                        </span>
                        <Link href="/subscribe" className="ml-auto text-blue-400 hover:underline text-sm font-semibold">Subscribe Now</Link>
                    </div>
                 )}
            </div>
        </div>
    </motion.div>
  );

  const AnimeListTabContent = () => (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {animeList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
                {animeList.map(item => {
                    const anime = item.anime_series;
                    if (!anime) return null;
                    return (
                        <Link href={`/anime/${anime.id}`} key={`${anime.id}-${item.status}`} className="group relative transition-transform duration-200 ease-in-out hover:-translate-y-1">
                            <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg border border-transparent group-hover:border-accent-green">
                                <Image
                                    src={anime.poster_url || '/placeholder.png'}
                                    alt={anime.title_english || anime.title_romaji || 'Poster'}
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
                     );
                })}
            </div>
        ) : (
            <div className="bg-card-dark p-8 rounded-lg text-center shadow-md mt-6">
                <p className="text-gray-400">Your anime list is empty.</p>
                <Link href="/anime" className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold">
                    Browse Anime
                </Link>
            </div>
        )}
     </motion.div>
  );

  const SettingsTabContent = () => (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <h2 className="text-2xl font-bold">Account Settings</h2>
         <div className="bg-card-dark p-6 rounded-lg shadow-md"><h3 className="text-xl font-semibold mb-3">Edit Profile</h3><p className="text-gray-400 text-sm">(Coming Soon)</p></div>
         <div className="bg-card-dark p-6 rounded-lg shadow-md"><h3 className="text-xl font-semibold mb-3">Change Password</h3><p className="text-gray-400 text-sm">(Coming Soon)</p></div>
         <div className="bg-card-dark p-6 rounded-lg shadow-md">
             <h3 className="text-xl font-semibold mb-4">My Receipt Submissions</h3>
             <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                 {receipts.length > 0 ? receipts.map(r => (
                    <div key={r.id} className="p-3 bg-gray-700 rounded-md flex justify-between items-center gap-4">
                        <div>
                            <p className="text-sm text-gray-300">Submitted: {new Date(r.created_at).toLocaleString()}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                                r.status === 'approved' ? 'bg-green-500 text-green-950' :
                                r.status === 'rejected' ? 'bg-red-500 text-red-950' :
                                'bg-yellow-500 text-yellow-950'
                            }`}>
                                {r.status.toUpperCase()}
                            </span>
                        </div>
                        {(r.status === 'pending' || r.status === 'rejected') && (
                            <button
                                onClick={() => handleDeleteReceipt(r.id, r.receipt_url)}
                                disabled={loading}
                                className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white font-medium transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                        )}
                    </div>
                )) : <p className="text-gray-400">No submission history.</p>}
             </div>
            <Link href="/subscribe" className="mt-4 inline-block text-accent-green hover:underline text-sm">
                Submit another receipt &rarr;
            </Link>
         </div>
         <div className="bg-red-900/30 border border-red-700 p-6 rounded-lg shadow-md">
             <h3 className="text-xl font-semibold mb-3 text-red-300">Danger Zone</h3>
             <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50" disabled>
                 Delete Account (Soon)
             </button>
             <p className="text-red-300 text-xs mt-2">This action is permanent and cannot be undone.</p>
         </div>
     </motion.div>
  );

  // --- Main Return --- (unchanged)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
        {/* Tab Navigation */}
        <div className="mb-8 border-b border-border-color">
            <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${
                        activeTab === 'profile'
                        ? 'border-accent-green text-accent-green'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    }`}
                >
                    <UserIcon size={16} /> Profile
                </button>
                <button
                    onClick={() => setActiveTab('anime_list')}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${
                        activeTab === 'anime_list'
                        ? 'border-accent-green text-accent-green'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    }`}
                >
                    <ListVideo size={16} /> Anime List
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${
                        activeTab === 'settings'
                        ? 'border-accent-green text-accent-green'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    }`}
                >
                    <Settings size={16} /> Settings
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