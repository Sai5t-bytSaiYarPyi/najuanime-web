// src/app/my-account/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader, AlertTriangle, User as UserIcon, ListVideo, Settings, Edit3, UploadCloud, Save, XCircle, AtSign } from 'lucide-react'; // AtSign icon ထည့်ပါ

// --- Type Definitions --- (No change)
type Profile = {
  id: string;
  naju_id: string;
  subscription_expires_at: string | null;
  subscription_status: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
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

// --- START: ProfileTabContent ကို Edit Username အတွက် ပြင်ဆင် ---
const ProfileTabContent = ({
    profile,
    uploadingBanner, bannerInputRef, handleImageUpload, setUploadingBanner,
    uploadingAvatar, avatarInputRef, setUploadingAvatar,
    usernameDisplay, // <-- ဒီ prop ကို ဖယ်ထုတ်ပြီး profile ကနေ တိုက်ရိုက်သုံးပါမယ်
    isSubscribed,
    // Edit Bio props
    isEditingBio, setIsEditingBio, editingBioText, setEditingBioText, handleSaveBio, savingBio,
    // Edit Username props
    isEditingUsername, setIsEditingUsername, editingUsernameText, setEditingUsernameText, handleSaveUsername, savingUsername
}: any) => {

    const startEditingBio = () => { setIsEditingBio(true); setEditingBioText(profile?.bio || ''); };
    const cancelEditingBio = () => { setIsEditingBio(false); };

    const startEditingUsername = () => { setIsEditingUsername(true); setEditingUsernameText(profile?.naju_id || ''); };
    const cancelEditingUsername = () => { setIsEditingUsername(false); };

    // usernameDisplay prop အစား profile ကနေ တိုက်ရိုက်ယူသုံးပါ
    const displayUsername = profile?.naju_id || 'User'; // Fallback

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Banner */}
            <div className="h-40 md:h-56 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-lg relative shadow-lg group overflow-hidden">
                {profile?.banner_url ? ( <Image src={profile.banner_url} alt="Profile Banner" fill style={{ objectFit: 'cover' }} className="rounded-lg" priority sizes="(max-width: 768px) 100vw, 1184px"/> ) : ( <div className="absolute inset-0 flex items-center justify-center text-gray-500">Default Banner Area</div> )}
                 <button onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner || savingUsername || savingBio} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors text-xs opacity-0 group-hover:opacity-100 flex items-center gap-1 z-10 disabled:opacity-50 disabled:cursor-not-allowed">
                     {uploadingBanner ? <Loader size={14} className="animate-spin"/> : <UploadCloud size={14} />} {uploadingBanner ? 'Uploading...' : 'Change Banner'} </button>
                 <input type="file" ref={bannerInputRef} onChange={(e) => handleImageUpload(e, 'banners', setUploadingBanner)} accept="image/png, image/jpeg, image/webp, image/gif" style={{ display: 'none' }} />
            </div>

            {/* Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20 px-6">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background-dark bg-gray-600 flex items-center justify-center overflow-hidden shadow-xl shrink-0 group">
                    {profile?.avatar_url ? ( <Image src={profile.avatar_url} alt="User Avatar" fill style={{ objectFit: 'cover' }} className="rounded-full" sizes="(max-width: 768px) 128px, 160px"/> ) : ( <UserIcon size={64} className="text-gray-400" /> )}
                     <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar || savingUsername || savingBio} className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer z-10 disabled:opacity-50 disabled:cursor-not-allowed">
                         {uploadingAvatar ? <Loader size={20} className="animate-spin mb-1"/> : <UploadCloud size={20} className="mb-1"/>} {uploadingAvatar ? 'Uploading...' : 'Change Avatar'} </button>
                     <input type="file" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, 'avatars', setUploadingAvatar)} accept="image/png, image/jpeg, image/webp, image/gif" style={{ display: 'none' }} />
                </div>
                {/* Username Display/Edit Section */}
                <div className="text-center sm:text-left pb-2 flex-grow">
                    {isEditingUsername ? (
                        <div className="space-y-2">
                             <div className="relative">
                                 <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                 <input
                                     type="text"
                                     value={editingUsernameText}
                                     onChange={(e) => setEditingUsernameText(e.target.value)}
                                     placeholder="Enter new username"
                                     className="w-full max-w-xs p-2 pl-8 rounded bg-gray-700 border border-border-color text-lg font-bold focus:outline-none focus:ring-1 focus:ring-accent-green"
                                     maxLength={20} // Optional length limit
                                 />
                             </div>
                             <div className="flex gap-2 justify-center sm:justify-start">
                                 <button onClick={cancelEditingUsername} disabled={savingUsername} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-xs font-semibold disabled:opacity-50">
                                     <XCircle size={14} className="inline mr-1"/> Cancel </button>
                                 <button onClick={() => handleSaveUsername(editingUsernameText)} disabled={savingUsername || editingUsernameText.trim().length < 3} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-xs font-semibold disabled:bg-gray-500 disabled:cursor-wait flex items-center gap-1">
                                     {savingUsername ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingUsername ? 'Saving...' : 'Save'} </button>
                             </div>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{displayUsername}</h1>
                            <p className="text-gray-400 font-mono text-sm">@{profile?.naju_id || 'N/A'}</p>
                        </div>
                    )}
                </div>
                {/* Edit Username Button */}
                {!isEditingUsername && (
                    <div className="sm:ml-auto">
                        <button onClick={startEditingUsername} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50" disabled={savingBio || savingUsername}>
                            <Edit3 size={14} /> Edit Username
                        </button>
                    </div>
                )}
            </div>

            {/* Bio, Subscription */}
            <div className="px-6 space-y-4">
                 <div className="bg-card-dark p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-gray-300">About Me</h3>
                        {!isEditingBio && ( <button onClick={startEditingBio} className="text-xs text-gray-400 hover:text-white disabled:opacity-50" disabled={savingBio || savingUsername}> <Edit3 size={12} className="inline mr-1"/> Edit Bio </button> )}
                    </div>
                    {isEditingBio ? (
                        <div className="mt-2 space-y-3">
                            <textarea value={editingBioText} onChange={(e) => setEditingBioText(e.target.value)} placeholder="Tell us about yourself..." className="w-full p-2 rounded bg-gray-700 border border-border-color min-h-[100px] text-sm focus:outline-none focus:ring-1 focus:ring-accent-green" rows={4} maxLength={500} />
                            <div className="flex justify-end gap-2">
                                <button onClick={cancelEditingBio} disabled={savingBio} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-xs font-semibold disabled:opacity-50"> <XCircle size={14} className="inline mr-1"/> Cancel </button>
                                <button onClick={() => handleSaveBio(editingBioText)} disabled={savingBio || savingUsername} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-xs font-semibold disabled:bg-gray-500 disabled:cursor-wait flex items-center gap-1"> {savingBio ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingBio ? 'Saving...' : 'Save Bio'} </button>
                            </div>
                        </div>
                    ) : ( profile?.bio ? ( <p className="text-gray-400 text-sm whitespace-pre-wrap">{profile.bio}</p> ) : ( <p className="text-gray-400 text-sm italic">No bio added yet.</p> ) )}
                 </div>
                 <div className="bg-card-dark p-4 rounded-lg shadow-md">
                     <h3 className="font-semibold text-gray-300 mb-1">Subscription</h3>
                     {isSubscribed ? ( /* ... subscription active view ... */ <div className="flex items-center gap-2"> <span className="w-3 h-3 bg-green-500 rounded-full inline-block animate-pulse"></span> <span className="text-green-400 font-medium">ACTIVE</span> <span className="text-gray-400 text-sm">(Expires: {profile?.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : 'N/A'})</span> </div> ) : ( /* ... subscription inactive view ... */ <div className="flex items-center gap-2"> <span className={`w-3 h-3 ${profile?.subscription_status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'} rounded-full inline-block`}></span> <span className={`${profile?.subscription_status === 'expired' ? 'text-red-400' : 'text-yellow-400'} font-medium`}> {profile?.subscription_status === 'expired' ? 'EXPIRED' : 'INACTIVE'} </span> <Link href="/subscribe" className="ml-auto text-blue-400 hover:underline text-sm font-semibold">Subscribe Now</Link> </div> )}
                </div>
            </div>
        </motion.div>
    );
}
// --- END: ProfileTabContent ကို Edit Username အတွက် ပြင်ဆင် ---


// --- AnimeListTabContent and SettingsTabContent (အတိုချုံ့ထားပါသည် - မပြောင်းလဲပါ) ---
const AnimeListTabContent = ({ animeList }: any) => ( /* ... code ... */
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
const SettingsTabContent = ({ receipts, loading, handleDeleteReceipt }: any) => ( /* ... code ... */
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
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editingBioText, setEditingBioText] = useState('');
    const [savingBio, setSavingBio] = useState(false);

    // --- START: Edit Username States ---
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [editingUsernameText, setEditingUsernameText] = useState('');
    const [savingUsername, setSavingUsername] = useState(false); // Saving state for username
    // --- END: Edit Username States ---

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // --- Data Fetching Logic (unchanged) ---
    const setupUser = useCallback(async (user: User) => { /* ... */
        console.log("Setting up user data in parallel for:", user.id); setError(null);
        try {
            const [profileResponse, receiptsResponse, animeListResponse] = await Promise.all([
                supabase.from('profiles').select('id, naju_id, subscription_expires_at, subscription_status, avatar_url, banner_url, bio').eq('id', user.id).single(),
                supabase.from('payment_receipts').select('id, created_at, receipt_url, status').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('user_anime_list').select('status, anime_series (id, poster_url, title_english, title_romaji)').eq('user_id', user.id).order('updated_at', { ascending: false })
            ]);
            console.log("Profile response:", profileResponse); console.log("Receipts response:", receiptsResponse); console.log("Anime list response:", animeListResponse);
            if (profileResponse.error && profileResponse.error.code !== 'PGRST116') throw new Error(`Profile fetch failed: ${profileResponse.error.message} (Code: ${profileResponse.error.code})`);
            if (profileResponse.status !== 200 && profileResponse.status !== 406) throw new Error(`Profile fetch status error: ${profileResponse.statusText} (Status: ${profileResponse.status})`);
            if (profileResponse.data === null && !profileResponse.error) console.warn("Profile data is null but no error reported.");
            if (receiptsResponse.error) throw new Error(`Receipts fetch failed: ${receiptsResponse.error.message}`);
            if (animeListResponse.error) throw new Error(`Anime list fetch failed: ${animeListResponse.error.message}`);
            setProfile(profileResponse.data ? profileResponse.data as Profile : null);
            setReceipts(receiptsResponse.data as Receipt[] || []);
            const fetchedAnimeList = animeListResponse.data;
            if (fetchedAnimeList && Array.isArray(fetchedAnimeList)) {
                 const correctlyTypedList: UserAnimeListItem[] = fetchedAnimeList.map((item: any) => {
                     const animeSeriesData = item.anime_series;
                     const typedAnimeSeries = (animeSeriesData && typeof animeSeriesData === 'object' && animeSeriesData !== null) ? { id: animeSeriesData.id, poster_url: animeSeriesData.poster_url, title_english: animeSeriesData.title_english, title_romaji: animeSeriesData.title_romaji } : null;
                     return { status: item.status, anime_series: typedAnimeSeries };
                 }); setAnimeList(correctlyTypedList);
            } else { setAnimeList([]); }
            console.log("User data setup successful (parallel)."); return true;
        } catch (err: any) {
            console.error("Error during parallel setupUser:", err); setError(`Could not load account details: ${err.message}. Please try refreshing the page.`);
            setProfile(null); setReceipts([]); setAnimeList([]); return false;
        }
     }, []);

    // --- Session Check, useEffect, Delete Receipt, Image Upload (unchanged) ---
    const checkSessionAndSetup = useCallback(async (isRetry = false) => { /* ... */
        console.log(`checkSessionAndSetup called. Is Retry: ${isRetry}`); setLoading(true); setError(null);
        try {
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession(); console.log("getSession result:", { currentSession, sessionError });
            if (sessionError) throw new Error(`Failed to check authentication session: ${sessionError.message}`);
            setSession(currentSession);
            if (currentSession && currentSession.user) {
                console.log("Session found, calling setupUser..."); const setupSuccess = await setupUser(currentSession.user);
                 if (!setupSuccess && !isRetry) console.log("Initial setupUser failed.");
            } else { console.log("No session found, clearing data."); setProfile(null); setReceipts([]); setAnimeList([]); }
        } catch (err: any) { console.error("Error in checkSessionAndSetup:", err); setError(err.message || "An unexpected error occurred while loading account data."); setProfile(null); setReceipts([]); setAnimeList([]);
        } finally { console.log("Setting loading to false in checkSessionAndSetup finally block."); setLoading(false); }
     }, [setupUser]);
    useEffect(() => { /* ... */
        console.log("MyAccountPage useEffect running."); let isMounted = true; checkSessionAndSetup();
        const { data: authListener } = supabase.auth.onAuthStateChange( (event, newSession) => {
                if (!isMounted) return; console.log("Auth state changed:", event, newSession);
                const previousUserId = session?.user?.id; const newUserId = newSession?.user?.id; setSession(newSession);
                if (newUserId !== previousUserId) { console.log(`User change detected (Event: ${event}, Prev: ${previousUserId}, New: ${newUserId}). Triggering data reload.`); checkSessionAndSetup();
                } else { console.log(`Auth event '${event}' occurred, user ID (${newUserId}) unchanged. No full reload triggered.`); } } );
        return () => { console.log("MyAccountPage useEffect cleanup."); isMounted = false; authListener?.subscription.unsubscribe(); };
     }, [checkSessionAndSetup, session?.user?.id]);
    const handleDeleteReceipt = async (receiptId: string, receiptPath: string | null) => { /* ... */
        if (!receiptPath) { alert('Receipt path missing...'); return; } if (window.confirm('Are you sure you want to delete this submission?')) { setLoading(true); try {
                const { error: dbError } = await supabase.from('payment_receipts').delete().eq('id', receiptId); if (dbError) throw dbError;
                const { error: storageError } = await supabase.storage.from('receipts').remove([receiptPath]); if (storageError) console.warn('Storage delete failed (DB record deleted successfully):', storageError.message);
                setReceipts(prevReceipts => prevReceipts.filter(r => r.id !== receiptId)); alert('Submission deleted.');
            } catch (err: any) { console.error("Error deleting receipt:", err); alert('Failed to delete submission: ' + err.message);
            } finally { setLoading(false); } }
     };
    const handleImageUpload = async ( event: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'banners', setLoadingState: (loading: boolean) => void ) => { /* ... */
        if (!session?.user) { setError("You must be logged in to upload images."); return; } if (!event.target.files || event.target.files.length === 0) { return; } const file = event.target.files[0];
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']; if (!allowedTypes.includes(file.type)) { setError("Invalid file type. Please upload PNG, JPG, WEBP, or GIF."); if (event.target) event.target.value = ''; return; }
        const maxSize = 5 * 1024 * 1024; if (file.size > maxSize) { setError("File is too large. Maximum size is 5MB."); if (event.target) event.target.value = ''; return; }
        const fileExt = file.name.split('.').pop(); const baseFileName = bucket === 'avatars' ? `${session.user.id}` : `${session.user.id}_banner`; const fileName = `${baseFileName}.${fileExt}`; const filePath = `${session.user.id}/${fileName}`;
        setLoadingState(true); setError(null); try {
            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true }); if (uploadError) throw uploadError;
            const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}?t=${new Date().getTime()}`; if (!publicUrl) throw new Error("Could not construct public URL.");
            const updates: Partial<Profile> = bucket === 'avatars' ? { avatar_url: publicUrl } : { banner_url: publicUrl }; let currentProfile = profile;
            if (!currentProfile) { const { data: refetchedProfile, error: refetchError } = await supabase.from('profiles').select('*').eq('id', session.user.id).single(); if (refetchError || !refetchedProfile) throw new Error("Profile not found, cannot update image URL."); currentProfile = refetchedProfile as Profile; setProfile(currentProfile); }
            const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', session.user.id); if (updateError) throw updateError;
            setProfile(prev => { if (!prev) { console.error("setProfile called in handleImageUpload when profile state was unexpectedly null after refetch attempt."); return { id: session.user.id, ...updates } as Profile; } return { ...prev, ...updates }; });
            alert(`${bucket === 'avatars' ? 'Avatar' : 'Banner'} updated successfully!`);
        } catch (err: any) { console.error(`Upload Error (${bucket}):`, err); setError(`Failed to update ${bucket === 'avatars' ? 'avatar' : 'banner'}: ${err.message || 'Unknown error'}`);
        } finally { setLoadingState(false); if (event.target) event.target.value = ''; }
     };

    // --- Save Bio Function (unchanged) ---
    const handleSaveBio = async (newBio: string) => { /* ... */
        if (!session?.user || !profile) { setError("Cannot save bio: User or profile not loaded."); return; } setSavingBio(true); setError(null);
        try {
            const trimmedBio = newBio.trim(); const { error: updateError } = await supabase .from('profiles') .update({ bio: trimmedBio || null }) .eq('id', session.user.id);
            if (updateError) throw updateError; setProfile(prev => prev ? { ...prev, bio: trimmedBio || null } : null); setIsEditingBio(false);
        } catch (err: any) { console.error("Error saving bio:", err); setError(`Failed to save bio: ${err.message}`);
        } finally { setSavingBio(false); }
     };

    // --- START: Save Username Function ---
    const handleSaveUsername = async (newUsername: string) => {
        if (!session?.user || !profile) {
            setError("Cannot save username: User or profile not loaded.");
            return;
        }
        const trimmedUsername = newUsername.trim();
        // Basic Validation (Client-side)
        if (trimmedUsername.length < 3) {
            setError("Username must be at least 3 characters long.");
            return;
        }
        if (trimmedUsername.length > 20) {
            setError("Username cannot be longer than 20 characters.");
            return;
        }
        // Allow letters, numbers, underscores, hyphens (Adjust regex as needed)
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(trimmedUsername)) {
            setError("Username can only contain letters, numbers, underscores (_), and hyphens (-).");
            return;
        }
        // Avoid saving if username hasn't changed
        if (trimmedUsername === profile.naju_id) {
            setIsEditingUsername(false); // Just close the editor
            return;
        }

        setSavingUsername(true);
        setError(null);
        try {
            // Check for uniqueness (using Supabase RPC function is better, but simple check for now)
            // Note: This simple check has race conditions. A proper solution uses DB constraints or RPC.
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('id')
                .eq('naju_id', trimmedUsername)
                .neq('id', session.user.id) // Exclude self
                .limit(1)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // Ignore '0 rows' error
                 throw new Error(`Username check failed: ${checkError.message}`);
            }
            if (existingUser) {
                throw new Error(`Username "${trimmedUsername}" is already taken.`);
            }

            // Update username in the database
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ naju_id: trimmedUsername })
                .eq('id', session.user.id);

            if (updateError) throw updateError;

            // Update local state
            setProfile(prev => prev ? { ...prev, naju_id: trimmedUsername } : null);
            setIsEditingUsername(false); // Close edit mode
            // alert('Username updated successfully!'); // Optional success message

        } catch (err: any) {
            console.error("Error saving username:", err);
            // Display specific error message if available
            setError(err.message || 'Failed to save username.');
        } finally {
            setSavingUsername(false);
        }
    };
    // --- END: Save Username Function ---


    // --- RENDER LOGIC --- (unchanged checks)
    if (loading) { return (<div className="flex min-h-[calc(100vh-200px)] items-center justify-center text-white"><Loader className="animate-spin mr-2" size={24} /> Loading Account...</div>); }
     if (error) { return ( <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-red-400 text-center px-4"> <AlertTriangle className="mb-2" size={32} /> <p className="font-semibold">Failed to Load Account Details</p> <p className="text-sm text-gray-400 mt-1 mb-4">{error}</p> <button onClick={() => checkSessionAndSetup(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white"> Try Again </button> </div> ); }
    if (!session || !session.user) { return (<div className="flex flex-col items-center justify-center text-center pt-20 text-white"><h1 className="text-3xl font-bold mb-4">Please Log In</h1><p className="text-gray-300 mb-8">You need to be logged in to view your account.</p><p className="text-gray-400">Use the Login button in the sidebar.</p></div>); }
     if (!profile) { return ( <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-yellow-400 text-center px-4"> <AlertTriangle className="mb-2" size={32} /> <p className="font-semibold">Account Profile Not Found</p> <p className='text-sm text-gray-400 mt-2'>We couldn't find your profile details. This might be a temporary issue or your profile setup might be incomplete.</p> <button onClick={() => checkSessionAndSetup(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white mr-2"> Retry Loading </button> <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold text-white"> Log Out </button> </div> ); }

    console.log("Rendering main account content...");
    const isSubscribed = profile.subscription_status === 'active' && profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;
    // usernameDisplay is now handled inside ProfileTabContent

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
                    {/* --- START: Pass Edit Username state and functions to ProfileTabContent --- */}
                    {activeTab === 'profile' &&
                        <ProfileTabContent
                            key="profile"
                            profile={profile}
                            uploadingBanner={uploadingBanner} bannerInputRef={bannerInputRef} handleImageUpload={handleImageUpload} setUploadingBanner={setUploadingBanner}
                            uploadingAvatar={uploadingAvatar} avatarInputRef={avatarInputRef} setUploadingAvatar={setUploadingAvatar}
                            // usernameDisplay prop is removed
                            isSubscribed={isSubscribed}
                            // Edit Bio props
                            isEditingBio={isEditingBio} setIsEditingBio={setIsEditingBio} editingBioText={editingBioText} setEditingBioText={setEditingBioText} handleSaveBio={handleSaveBio} savingBio={savingBio}
                            // Edit Username props
                            isEditingUsername={isEditingUsername}
                            setIsEditingUsername={setIsEditingUsername}
                            editingUsernameText={editingUsernameText}
                            setEditingUsernameText={setEditingUsernameText}
                            handleSaveUsername={handleSaveUsername}
                            savingUsername={savingUsername}
                        />
                    }
                    {/* --- END: Pass Edit Username state and functions --- */}
                    {activeTab === 'anime_list' && <AnimeListTabContent key="anime_list" animeList={animeList} />}
                    {activeTab === 'settings' && <SettingsTabContent key="settings" receipts={receipts} loading={loading} handleDeleteReceipt={handleDeleteReceipt} />}
                </AnimatePresence>
            </div>
            {/* --- START: Global Error Display (Optional) --- */}
            {/* Display general errors at the bottom if needed */}
            {error && (
                 <div className="fixed bottom-4 right-4 max-w-sm bg-red-800 text-white p-4 rounded-lg shadow-lg flex items-start gap-3 z-50">
                     <AlertTriangle size={20} className="mt-0.5 shrink-0"/>
                     <div>
                         <p className="font-semibold text-sm">Error</p>
                         <p className="text-xs">{error}</p>
                     </div>
                     <button onClick={() => setError(null)} className="ml-auto text-red-200 hover:text-white"><XCircle size={16}/></button>
                 </div>
            )}
            {/* --- END: Global Error Display --- */}
        </div>
    );
}