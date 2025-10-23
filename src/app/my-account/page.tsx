// src/app/my-account/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader, AlertTriangle, User as UserIcon, ListVideo, Settings, Edit3, UploadCloud } from 'lucide-react';

// --- Type Definitions ---
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

// --- Helper: Tab Content Components ---
// (ဒီအပိုင်းက Component တွေ မပြောင်းလဲပါ၊ အတိုချုံ့ထားလိုက်ပါတယ်)
const ProfileTabContent = ({ profile, uploadingBanner, bannerInputRef, handleImageUpload, setUploadingBanner, uploadingAvatar, avatarInputRef, setUploadingAvatar, usernameDisplay, isSubscribed }: any) => (
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

const AnimeListTabContent = ({ animeList }: any) => (
   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {animeList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
              {animeList.map((item: UserAnimeListItem) => {
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

const SettingsTabContent = ({ receipts, loading, handleDeleteReceipt }: any) => (
   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold">Account Settings</h2>
       <div className="bg-card-dark p-6 rounded-lg shadow-md"><h3 className="text-xl font-semibold mb-3">Edit Profile</h3><p className="text-gray-400 text-sm">(Coming Soon)</p></div>
       <div className="bg-card-dark p-6 rounded-lg shadow-md"><h3 className="text-xl font-semibold mb-3">Change Password</h3><p className="text-gray-400 text-sm">(Coming Soon)</p></div>
       <div className="bg-card-dark p-6 rounded-lg shadow-md">
           <h3 className="text-xl font-semibold mb-4">My Receipt Submissions</h3>
           <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
               {receipts.length > 0 ? receipts.map((r: Receipt) => (
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


// --- Main Component ---
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

    // --- START: Data Fetching Logic ကို Parallel Fetching ဖြင့် ပြင်ဆင် ---
    const setupUser = useCallback(async (user: User) => {
        console.log("Setting up user data in parallel for:", user.id);
        setError(null); // Reset error before fetching

        try {
            // Promise.all ကိုသုံးပြီး တစ်ပြိုင်နက်တည်း fetch လုပ်ပါမယ်
            const [profileResponse, receiptsResponse, animeListResponse] = await Promise.all([
                supabase.from('profiles').select('id, naju_id, subscription_expires_at, subscription_status, avatar_url, banner_url').eq('id', user.id).single(),
                supabase.from('payment_receipts').select('id, created_at, receipt_url, status').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('user_anime_list').select('status, anime_series (id, poster_url, title_english, title_romaji)').eq('user_id', user.id).order('updated_at', { ascending: false })
            ]);

            console.log("Profile response:", profileResponse);
            console.log("Receipts response:", receiptsResponse);
            console.log("Anime list response:", animeListResponse);

            // Error Handling ကို ပိုတိကျအောင် စစ်ဆေးပါ
            if (profileResponse.error && profileResponse.error.code !== 'PGRST116') { // PGRST116 = 0 rows found
                throw new Error(`Profile fetch failed: ${profileResponse.error.message} (Code: ${profileResponse.error.code})`);
            }
             if (profileResponse.status !== 200 && profileResponse.status !== 406) { // 406 might happen if 0 rows with .single()
                 throw new Error(`Profile fetch status error: ${profileResponse.statusText} (Status: ${profileResponse.status})`);
             }
             // Data null ဖြစ်ပြီး error လည်း null ဖြစ်နေတဲ့ case ကို သတိထားစစ်ဆေးဖို့ Log ထုတ်ကြည့်ပါ
             if (profileResponse.data === null && !profileResponse.error) {
                 console.warn("Profile data is null but no error reported. This might indicate an RLS issue or missing profile row.");
                 // Decide if this should be treated as an error or just an empty profile
                 // throw new Error("Profile data not found."); // Option: Treat as error
             }


            if (receiptsResponse.error) {
                throw new Error(`Receipts fetch failed: ${receiptsResponse.error.message}`);
            }
            if (animeListResponse.error) {
                throw new Error(`Anime list fetch failed: ${animeListResponse.error.message}`);
            }

            // Update State ONLY after all fetches are successful (or handled)
            setProfile(profileResponse.data ? profileResponse.data as Profile : null); // Handle null case explicitly
            setReceipts(receiptsResponse.data as Receipt[] || []);

            const fetchedAnimeList = animeListResponse.data;
            if (fetchedAnimeList && Array.isArray(fetchedAnimeList)) {
                 const correctlyTypedList: UserAnimeListItem[] = fetchedAnimeList.map((item: any) => {
                     const animeSeriesData = item.anime_series;
                     const typedAnimeSeries = (animeSeriesData && typeof animeSeriesData === 'object' && animeSeriesData !== null)
                         ? { id: animeSeriesData.id, poster_url: animeSeriesData.poster_url, title_english: animeSeriesData.title_english, title_romaji: animeSeriesData.title_romaji } : null;
                     return { status: item.status, anime_series: typedAnimeSeries };
                 });
                 setAnimeList(correctlyTypedList);
            } else {
                setAnimeList([]);
            }

            console.log("User data setup successful (parallel).");
            return true; // Indicate success

        } catch (err: any) {
            console.error("Error during parallel setupUser:", err);
            // Error message မှာ ဘာကြောင့် fail ဖြစ်လဲ ပိုပေါ်အောင် ပြင်ဆင်ပါ
            setError(`Could not load account details: ${err.message}. Please try refreshing the page.`);
            setProfile(null); // Clear data on error
            setReceipts([]);
            setAnimeList([]);
            return false; // Indicate failure
        }
        // Loading state is handled by the caller (checkSessionAndSetup)
    }, []); // Empty dependencies, memoized once
    // --- END: Data Fetching Logic ကို Parallel Fetching ဖြင့် ပြင်ဆင် ---

    // --- Session Check and Initial Load Function ---
    const checkSessionAndSetup = useCallback(async (isRetry = false) => {
        console.log(`checkSessionAndSetup called. Is Retry: ${isRetry}`);
        setLoading(true);
        setError(null);

        try {
            // Added explicit error check after getSession
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            console.log("getSession result:", { currentSession, sessionError });

            if (sessionError) {
                // Throw specific error for session fetching failure
                throw new Error(`Failed to check authentication session: ${sessionError.message}`);
            }

            setSession(currentSession);

            if (currentSession && currentSession.user) {
                console.log("Session found, calling setupUser...");
                const setupSuccess = await setupUser(currentSession.user);
                // If setupUser fails, the error state is already set inside it.
                 if (!setupSuccess && !isRetry) {
                     // Optionally, you could try one automatic retry here if needed,
                     // but the current logic lets the user click "Try Again".
                     console.log("Initial setupUser failed.");
                 }
            } else {
                console.log("No session found, clearing data.");
                setProfile(null);
                setReceipts([]);
                setAnimeList([]);
                // No error state needed if user is simply not logged in
            }
        } catch (err: any) {
             console.error("Error in checkSessionAndSetup:", err);
             // Ensure error state is always set on failure
             setError(err.message || "An unexpected error occurred while loading account data.");
             // Clear potentially partially loaded data
             setProfile(null);
             setReceipts([]);
             setAnimeList([]);
        } finally {
            console.log("Setting loading to false in checkSessionAndSetup finally block.");
            setLoading(false);
        }
    }, [setupUser]); // Depends only on the memoized setupUser

    // --- useEffect Hook for Initial Load and Auth Changes ---
    // (Auth Change handling logic remains similar, relying on checkSessionAndSetup)
    useEffect(() => {
        console.log("MyAccountPage useEffect running.");
        let isMounted = true;
        // let initialLoadHandled = false; // Removed this, checkSessionAndSetup handles initial load

        checkSessionAndSetup(); // Initial load attempt

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, newSession) => {
                if (!isMounted) return;
                console.log("Auth state changed:", event, newSession);

                const previousUserId = session?.user?.id;
                const newUserId = newSession?.user?.id;

                 // Update session state regardless
                 setSession(newSession);

                // --- Simplified Logic: Reload data if user changes ---
                // Avoids complex logic for duplicate SIGNED_IN events
                if (newUserId !== previousUserId) {
                    console.log(`User change detected (Event: ${event}, Prev: ${previousUserId}, New: ${newUserId}). Triggering data reload.`);
                    checkSessionAndSetup(); // Reload all data for the new (or logged out) user
                } else {
                     console.log(`Auth event '${event}' occurred, user ID (${newUserId}) unchanged. No full reload triggered.`);
                     // Optionally handle USER_UPDATED: maybe just refetch profile silently?
                     // if (event === 'USER_UPDATED' && newSession?.user) {
                     //    console.log("Handling USER_UPDATED silently...");
                     //    // supabase.from('profiles')... // Example: refetch profile only
                     // }
                }
            }
        );

        return () => {
            console.log("MyAccountPage useEffect cleanup.");
            isMounted = false;
            authListener?.subscription.unsubscribe();
        };
        // Use session?.user?.id to re-run effect if the user object *identity* changes
    }, [checkSessionAndSetup, session?.user?.id]);



    // --- Delete Receipt Logic --- (unchanged)
    const handleDeleteReceipt = async (receiptId: string, receiptPath: string | null) => {
        if (!receiptPath) { alert('Receipt path missing...'); return; }
        if (window.confirm('Are you sure you want to delete this submission?')) {
            setLoading(true); // Indicate loading
            try {
                // First delete the database record
                const { error: dbError } = await supabase.from('payment_receipts').delete().eq('id', receiptId);
                if (dbError) throw dbError;

                // If database deletion is successful, delete from storage
                const { error: storageError } = await supabase.storage.from('receipts').remove([receiptPath]);
                // Log storage error but don't necessarily throw, as the DB record is gone
                if (storageError) console.warn('Storage delete failed (DB record deleted successfully):', storageError.message);

                // Update local state
                setReceipts(prevReceipts => prevReceipts.filter(r => r.id !== receiptId));
                alert('Submission deleted.');
            } catch (err: any) {
                console.error("Error deleting receipt:", err);
                alert('Failed to delete submission: ' + err.message);
            } finally {
                setLoading(false); // Stop loading indicator
            }
        }
    };

    // --- Image Upload Logic --- (unchanged)
     const handleImageUpload = async (
         event: React.ChangeEvent<HTMLInputElement>,
         bucket: 'avatars' | 'banners',
         setLoadingState: (loading: boolean) => void
     ) => {
         if (!session?.user) { setError("You must be logged in to upload images."); return; }
         // Profile might be initially null, handle this gracefully
         // if (!profile) { setError("Profile data not loaded yet."); return; }

         if (!event.target.files || event.target.files.length === 0) { return; } // No error needed if no file selected
         const file = event.target.files[0];
         // Basic validation (can be more robust)
         const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
         if (!allowedTypes.includes(file.type)) {
             setError("Invalid file type. Please upload PNG, JPG, WEBP, or GIF.");
             if (event.target) event.target.value = ''; // Clear the input
             return;
         }
         const maxSize = 5 * 1024 * 1024; // 5MB
         if (file.size > maxSize) {
             setError("File is too large. Maximum size is 5MB.");
              if (event.target) event.target.value = ''; // Clear the input
             return;
         }


         const fileExt = file.name.split('.').pop();
         // Use a consistent naming convention, like user_id.<ext> for avatar, user_id_banner.<ext> for banner
         // This simplifies cleanup if needed and ensures only one avatar/banner per user in storage path.
         const baseFileName = bucket === 'avatars' ? `${session.user.id}` : `${session.user.id}_banner`;
         const fileName = `${baseFileName}.${fileExt}`;
         // Group files by user ID in storage
         const filePath = `${session.user.id}/${fileName}`;


         setLoadingState(true); setError(null);
         try {
              // Upsert = true allows overwriting the previous avatar/banner
             const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
             if (uploadError) throw uploadError;

             // Construct the public URL manually - getPublicUrl might include tokens if used incorrectly
             // Ensure your bucket policies allow public reads for the user's folder path
             const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}?t=${new Date().getTime()}`; // Add timestamp to break cache

             if (!publicUrl) throw new Error("Could not construct public URL.");

             const updates = bucket === 'avatars' ? { avatar_url: publicUrl } : { banner_url: publicUrl };

             // Ensure profile exists before updating
             if (!profile) {
                 // Attempt to fetch profile again if it was null
                 const { data: refetchedProfile, error: refetchError } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();
                 if (refetchError || !refetchedProfile) {
                      throw new Error("Profile not found, cannot update image URL.");
                 }
             }

             const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
             if (updateError) throw updateError;

             // Update local profile state correctly
             setProfile(prev => prev ? { ...prev, ...updates } : { id: session.user.id, ...updates } as Profile); // Handle case where profile was initially null

             alert(`${bucket === 'avatars' ? 'Avatar' : 'Banner'} updated successfully!`);
         } catch (err: any) {
             console.error(`Upload Error (${bucket}):`, err);
             setError(`Failed to update ${bucket === 'avatars' ? 'avatar' : 'banner'}: ${err.message || 'Unknown error'}`);
         } finally {
             setLoadingState(false);
             // Clear the file input after upload attempt
             if (event.target) event.target.value = '';
         }
     };


    // --- RENDER LOGIC --- (unchanged checks, simplified profile check)

    if (loading) {
        console.log("Rendering loading state...");
        return (<div className="flex min-h-[calc(100vh-200px)] items-center justify-center text-white"><Loader className="animate-spin mr-2" size={24} /> Loading Account...</div>);
    }

     // If there's an error state, show it
     if (error) {
         console.log("Rendering error state:", error);
         return (
             <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-red-400 text-center px-4">
                 <AlertTriangle className="mb-2" size={32} />
                 <p className="font-semibold">Failed to Load Account Details</p>
                 <p className="text-sm text-gray-400 mt-1 mb-4">{error}</p>
                 <button
                     onClick={() => checkSessionAndSetup(true)} // Pass true for retry
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white"
                 >
                     Try Again
                 </button>
             </div>
         );
     }

    // If no session after loading/retries, show login prompt
    if (!session || !session.user) {
        console.log("Rendering not logged in state...");
        return (<div className="flex flex-col items-center justify-center text-center pt-20 text-white"><h1 className="text-3xl font-bold mb-4">Please Log In</h1><p className="text-gray-300 mb-8">You need to be logged in to view your account.</p><p className="text-gray-400">Use the Login button in the sidebar.</p></div>);
    }

    // If session exists but profile data is still null after loading (and no error was thrown)
    // This indicates a potential issue like missing profile row or RLS problem
     if (!profile) {
         console.warn("Rendering profile not found state (session exists but profile is null).");
         return (
             <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-yellow-400 text-center px-4">
                 <AlertTriangle className="mb-2" size={32} />
                 <p className="font-semibold">Account Profile Not Found</p>
                 <p className='text-sm text-gray-400 mt-2'>We couldn't find your profile details. This might be a temporary issue or your profile setup might be incomplete.</p>
                 <button
                     onClick={() => checkSessionAndSetup(true)} // Retry fetching
                     className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white mr-2"
                 >
                     Retry Loading
                 </button>
                  <button
                     onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} // Log out and refresh
                     className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold text-white"
                 >
                     Log Out
                 </button>
             </div>
         );
     }

    // --- Main Render (if loading is false, no error, session exists, profile exists) ---
    console.log("Rendering main account content...");
    const isSubscribed = profile.subscription_status === 'active' && profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;
    // Use naju_id if available, otherwise fallback to username part of email
    const usernameDisplay = profile?.naju_id || session.user.email?.split('@')[0] || 'User';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
            {/* Tab Navigation */}
            <div className="mb-8 border-b border-border-color">
                <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                    <button onClick={() => setActiveTab('profile')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${ activeTab === 'profile' ? 'border-accent-green text-accent-green' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500' }`}><UserIcon size={16} /> Profile</button>
                    <button onClick={() => setActiveTab('anime_list')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${ activeTab === 'anime_list' ? 'border-accent-green text-accent-green' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500' }`}><ListVideo size={16} /> Anime List</button>
                    <button onClick={() => setActiveTab('settings')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${ activeTab === 'settings' ? 'border-accent-green text-accent-green' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500' }`}><Settings size={16} /> Settings</button>
                </nav>
            </div>
            {/* Tab Content */}
            <div>
                <AnimatePresence mode="wait">
                    {activeTab === 'profile' && <ProfileTabContent key="profile" profile={profile} uploadingBanner={uploadingBanner} bannerInputRef={bannerInputRef} handleImageUpload={handleImageUpload} setUploadingBanner={setUploadingBanner} uploadingAvatar={uploadingAvatar} avatarInputRef={avatarInputRef} setUploadingAvatar={setUploadingAvatar} usernameDisplay={usernameDisplay} isSubscribed={isSubscribed} />}
                    {activeTab === 'anime_list' && <AnimeListTabContent key="anime_list" animeList={animeList} />}
                    {activeTab === 'settings' && <SettingsTabContent key="settings" receipts={receipts} loading={loading} handleDeleteReceipt={handleDeleteReceipt} />}
                </AnimatePresence>
            </div>
        </div>
    );
}