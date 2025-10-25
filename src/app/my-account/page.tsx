// src/app/my-account/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader, AlertTriangle, User as UserIcon, ListVideo, Settings, Edit3, UploadCloud, Save, XCircle, AtSign, BarChart2, CheckCircle, Star } from 'lucide-react';
// --- useTheme import ကို ဖယ်ရှားပါ ---
// import { useTheme } from '@/context/ThemeContext';

// --- Type Definitions (မပြောင်းပါ) ---
type ProfilePreferences = { theme?: 'light' | 'dark'; }; // ဒါကို ဖယ်ရှားလို့ရနိုင်ပေမယ့်၊ DB မှာ ရှိနေသေးရင် ထားထားပါ
type Profile = { id: string; naju_id: string; subscription_expires_at: string | null; subscription_status: string | null; avatar_url: string | null; banner_url: string | null; bio: string | null; preferences: ProfilePreferences | null; };
type Receipt = { id: string; created_at: string; receipt_url: string; status: 'pending' | 'approved' | 'rejected'; };
type UserAnimeListItem = { status: string; anime_series: { id: string; poster_url: string | null; title_english: string | null; title_romaji: string | null; } | null; };
type Tab = 'profile' | 'anime_list' | 'settings';
type ProfileStatsData = { completed_count: number; mean_score: number; } | null;


// --- Components ---
const ProfileStatsDisplay = ({ stats }: { stats: ProfileStatsData }) => {
    if (!stats) {
        // --- dark: prefix များ ဖယ်ရှား ---
        return <div className="bg-card-dark p-4 rounded-lg shadow-md text-text-dark-secondary text-sm">Loading stats...</div>;
    }
    return (
        // --- dark: prefix များ ဖယ်ရှား ---
        <div className="bg-card-dark p-4 rounded-lg shadow-md">
            <h3 className="font-semibold text-text-dark-primary mb-3 flex items-center gap-2"><BarChart2 size={16}/> Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-accent-green">{stats.completed_count ?? 0}</p>
                    <p className="text-xs text-text-dark-secondary uppercase flex items-center justify-center gap-1"><CheckCircle size={12}/> Anime Completed</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-yellow-400">{stats.mean_score?.toFixed(2) ?? 'N/A'}</p>
                    <p className="text-xs text-text-dark-secondary uppercase flex items-center justify-center gap-1"><Star size={12}/> Mean Score</p>
                </div>
            </div>
        </div>
    );
};

// --- ProfileTabContent (dark: prefix များ ဖယ်ရှား) ---
const ProfileTabContent = ({
    profile,
    uploadingBanner, bannerInputRef, handleImageUpload, setUploadingBanner,
    uploadingAvatar, avatarInputRef, setUploadingAvatar,
    isSubscribed,
    isEditingBio, setIsEditingBio, editingBioText, setEditingBioText, handleSaveBio, savingBio,
    isEditingUsername, setIsEditingUsername, editingUsernameText, setEditingUsernameText, handleSaveUsername, savingUsername,
    profileStats
}: any) => {
    const startEditingBio = () => { setIsEditingBio(true); setEditingBioText(profile?.bio || ''); };
    const cancelEditingBio = () => { setIsEditingBio(false); };
    const startEditingUsername = () => { setIsEditingUsername(true); setEditingUsernameText(profile?.naju_id || ''); };
    const cancelEditingUsername = () => { setIsEditingUsername(false); };
    const displayUsername = profile?.naju_id || 'User';

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
                                 <input type="text" value={editingUsernameText} onChange={(e) => setEditingUsernameText(e.target.value)} placeholder="Enter new username" className="w-full max-w-xs p-2 pl-8 rounded bg-gray-700 border border-border-color text-lg font-bold focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" maxLength={20} />
                             </div>
                             <div className="flex gap-2 justify-center sm:justify-start">
                                 <button onClick={cancelEditingUsername} disabled={savingUsername} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-xs font-semibold disabled:opacity-50 text-text-dark-primary"> <XCircle size={14} className="inline mr-1"/> Cancel </button>
                                 <button onClick={() => handleSaveUsername(editingUsernameText)} disabled={savingUsername || editingUsernameText.trim().length < 3 || editingUsernameText.trim() === profile?.naju_id} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-1"> {savingUsername ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingUsername ? 'Saving...' : 'Save'} </button>
                             </div>
                        </div>
                     ) : (
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-text-dark-primary">{displayUsername}</h1>
                            <p className="text-text-dark-secondary font-mono text-sm">@{profile?.naju_id || 'N/A'}</p>
                        </div>
                    )}
                </div>
                {/* Edit Username Button */}
                {!isEditingUsername && (
                    <div className="sm:ml-auto">
                        <button onClick={startEditingUsername} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50" disabled={savingBio || savingUsername}> <Edit3 size={14} /> Edit Username </button>
                    </div>
                )}
            </div>

            {/* Stats, Bio, Subscription */}
            <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Column 1: Stats & Subscription */}
                 <div className="space-y-4">
                     <ProfileStatsDisplay stats={profileStats} />
                     <div className="bg-card-dark p-4 rounded-lg shadow-md">
                         <h3 className="font-semibold text-text-dark-primary mb-1">Subscription</h3>
                         {isSubscribed ? ( <div className="flex items-center gap-2"> <span className="w-3 h-3 bg-green-500 rounded-full inline-block animate-pulse"></span> <span className="text-green-400 font-medium">ACTIVE</span> <span className="text-text-dark-secondary text-sm">(Expires: {profile?.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : 'N/A'})</span> </div> ) : ( <div className="flex items-center gap-2"> <span className={`w-3 h-3 ${profile?.subscription_status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'} rounded-full inline-block`}></span> <span className={`${profile?.subscription_status === 'expired' ? 'text-red-400' : 'text-yellow-400'} font-medium`}> {profile?.subscription_status === 'expired' ? 'EXPIRED' : 'INACTIVE'} </span> <Link href="/subscribe" className="ml-auto text-accent-blue hover:underline text-sm font-semibold">Subscribe Now</Link> </div> )} {/* */}
                    </div>
                 </div>

                 {/* Column 2: Bio */}
                 <div className="bg-card-dark p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-semibold text-text-dark-primary">About Me</h3>
                        {!isEditingBio && ( <button onClick={startEditingBio} className="text-xs text-text-dark-secondary hover:text-white disabled:opacity-50" disabled={savingBio || savingUsername}> <Edit3 size={12} className="inline mr-1"/> Edit Bio </button> )}
                    </div>
                    {isEditingBio ? (
                        <div className="mt-2 space-y-3">
                            <textarea value={editingBioText} onChange={(e) => setEditingBioText(e.target.value)} placeholder="Tell us about yourself..." className="w-full p-2 rounded bg-gray-700 border border-border-color min-h-[100px] text-sm focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" rows={4} maxLength={500} />
                            <div className="flex justify-end gap-2">
                                <button onClick={cancelEditingBio} disabled={savingBio} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold disabled:opacity-50"> <XCircle size={14} className="inline mr-1"/> Cancel </button>
                                <button onClick={() => handleSaveBio(editingBioText)} disabled={savingBio || savingUsername} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 disabled:cursor-wait flex items-center gap-1"> {savingBio ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingBio ? 'Saving...' : 'Save Bio'} </button>
                            </div>
                        </div>
                    ) : ( profile?.bio ? ( <p className="text-text-dark-secondary text-sm whitespace-pre-wrap">{profile.bio}</p> ) : ( <p className="text-text-dark-secondary text-sm italic">No bio added yet.</p> ) )}
                 </div>
            </div>
        </motion.div>
    );
};

// --- AnimeListTabContent (dark: prefix များ ဖယ်ရှား) ---
const AnimeListTabContent = ({ animeList }: any) => (
   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {animeList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
              {animeList.map((item: UserAnimeListItem) => {
                  const anime = item.anime_series;
                  if (!anime) return null;
                  return (
                      <Link href={`/anime/${anime.id}`} key={`${anime.id}-${item.status}`} className="group relative transition-transform duration-200 ease-in-out hover:-translate-y-1"> {/*/page.tsx] */}
                          <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-lg border border-transparent group-hover:border-accent-green bg-gray-800">
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
              <p className="text-text-dark-secondary">Your anime list is empty.</p>
              <Link href="/anime" className="mt-4 inline-block px-4 py-2 bg-accent-blue hover:bg-blue-700 rounded-md text-sm font-semibold text-white"> {/* */}
                  Browse Anime
              </Link>
          </div>
      )}
   </motion.div>
);

// --- SettingsTabContent (Theme Toggle ဖယ်ရှား၊ dark: prefix များ ဖယ်ရှား) ---
const SettingsTabContent = ({
    receipts,
    deletingReceipt,
    handleDeleteReceipt,
}: {
    receipts: Receipt[];
    deletingReceipt: boolean;
    handleDeleteReceipt: (receiptId: string, receiptPath: string | null) => void;
}) => {
    // --- ThemeToggle နှင့် သက်ဆိုင်ရာ logic များ ဖယ်ရှား ---

    return (
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h2 className="text-2xl font-bold text-text-dark-primary">Account Settings</h2>
           {/* --- Site Preferences Section ကို ဖယ်ရှား --- */}
           {/* <div className="bg-card-dark p-6 rounded-lg shadow-md"> ... </div> */}
           <div className="bg-card-dark p-6 rounded-lg shadow-md"><h3 className="text-xl font-semibold mb-3 text-text-dark-primary">Edit Profile</h3><p className="text-text-dark-secondary text-sm">(Coming Soon)</p></div>
           <div className="bg-card-dark p-6 rounded-lg shadow-md"><h3 className="text-xl font-semibold mb-3 text-text-dark-primary">Change Password</h3><p className="text-text-dark-secondary text-sm">(Coming Soon)</p></div>
           <div className="bg-card-dark p-6 rounded-lg shadow-md">
               <h3 className="text-xl font-semibold mb-4 text-text-dark-primary">My Receipt Submissions</h3>
               <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                   {receipts.length > 0 ? receipts.map((r: Receipt) => (
                      <div key={r.id} className="p-3 bg-gray-700 rounded-md flex justify-between items-center gap-4">
                          <div>
                              <p className="text-sm text-text-dark-secondary">Submitted: {new Date(r.created_at).toLocaleString()}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-bold rounded-full ${ r.status === 'approved' ? 'bg-green-500 text-green-950' : r.status === 'rejected' ? 'bg-red-500 text-red-950' : 'bg-yellow-500 text-yellow-950' }`}> {r.status.toUpperCase()} </span>
                          </div>
                          {(r.status === 'pending' || r.status === 'rejected') && ( <button onClick={() => handleDeleteReceipt(r.id, r.receipt_url)} disabled={deletingReceipt} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white font-medium transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"> {deletingReceipt ? 'Deleting...' : 'Delete'} </button> )}
                      </div>
                  )) : <p className="text-text-dark-secondary">No submission history.</p>}
               </div>
              <Link href="/subscribe" className="mt-4 inline-block text-accent-green hover:underline text-sm"> Submit another receipt &rarr; </Link> {/* */}
           </div>
           <div className="bg-red-900/30 border border-red-700 p-6 rounded-lg shadow-md">
               <h3 className="text-xl font-semibold mb-3 text-red-300">Danger Zone</h3>
               <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50" disabled> Delete Account (Soon) </button>
               <p className="text-red-300 text-xs mt-2">This action is permanent and cannot be undone.</p>
           </div>
       </motion.div>
    );
};


// --- Main Component (useTheme ဖယ်ရှား၊ dark: prefix များ ဖယ်ရှား) ---
export default function MyAccountPage() {
    console.log("[MyAccountPage] Component rendering...");

    // States (မပြောင်းပါ)
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
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [editingUsernameText, setEditingUsernameText] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);
    const [profileStats, setProfileStats] = useState<ProfileStatsData>(null);
    const [deletingReceipt, setDeletingReceipt] = useState(false);

    // --- isThemeLoading ကို ဖယ်ရှား ---
    // const { isThemeLoading } = useTheme();

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // --- setupUser, checkSessionAndSetup, Auth Listener (မပြောင်းပါ) ---
    const setupUser = useCallback(async (user: User) => {
        console.log("[MyAccountPage] setupUser: Starting data fetch for user:", user.id);
        setError(null);
        let profileData: Profile | null = null;
        let receiptsData: Receipt[] = [];
        let animeListData: UserAnimeListItem[] = [];
        let statsData: ProfileStatsData = null;
        try {
            console.log("[MyAccountPage] setupUser: Fetching profile...");
            const { data: fetchedProfile, error: profileError } = await supabase.from('profiles').select('id, naju_id, subscription_expires_at, subscription_status, avatar_url, banner_url, bio, preferences').eq('id', user.id).single();
             if (profileError && profileError.code !== 'PGRST116') { console.error("[MyAccountPage] setupUser: Profile fetch failed!", profileError); throw new Error(`Profile fetch failed: ${profileError.message}`); }
             console.log("[MyAccountPage] setupUser: Profile fetch successful.", fetchedProfile);
             profileData = fetchedProfile;

            console.log("[MyAccountPage] setupUser: Fetching other data in parallel...");
            const [receiptsResponse, animeListResponse, statsResponse] = await Promise.all([
                supabase.from('payment_receipts').select('id, created_at, receipt_url, status').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('user_anime_list').select('status, anime_series (id, poster_url, title_english, title_romaji)').eq('user_id', user.id).order('updated_at', { ascending: false }),
                supabase.rpc('get_user_profile_stats', { p_user_id: user.id })
            ]);

            if (receiptsResponse.error) { console.error("[MyAccountPage] setupUser: Receipts fetch failed!", receiptsResponse.error); throw new Error(`Receipts fetch failed: ${receiptsResponse.error.message}`); }
            console.log("[MyAccountPage] setupUser: Receipts fetch successful.");
            receiptsData = receiptsResponse.data as Receipt[] || [];

            if (animeListResponse.error) { console.error("[MyAccountPage] setupUser: Anime list fetch failed!", animeListResponse.error); throw new Error(`Anime list fetch failed: ${animeListResponse.error.message}`); }
            console.log("[MyAccountPage] setupUser: Anime list fetch successful.");
            const fetchedAnimeList = animeListResponse.data;
            if (fetchedAnimeList && Array.isArray(fetchedAnimeList)) { animeListData = fetchedAnimeList.map((item: any) => { const animeSeriesData = item.anime_series; const typedAnimeSeries = (animeSeriesData && typeof animeSeriesData === 'object' && animeSeriesData !== null) ? { id: animeSeriesData.id, poster_url: animeSeriesData.poster_url, title_english: animeSeriesData.title_english, title_romaji: animeSeriesData.title_romaji } : null; return { status: item.status, anime_series: typedAnimeSeries }; }); }
             else { animeListData = []; }

            if (statsResponse.error) { console.error("[MyAccountPage] setupUser: Stats fetch failed!", statsResponse.error); throw new Error(`Stats fetch failed: ${statsResponse.error.message}`); }
            console.log("[MyAccountPage] setupUser: Stats fetch successful.");
            statsData = statsResponse.data as ProfileStatsData;

            setProfile(profileData);
            setReceipts(receiptsData);
            setAnimeList(animeListData);
            setProfileStats(statsData);

            console.log("[MyAccountPage] setupUser: Data fetch complete, state updated.");
            return true;
        } catch (err: any) {
            console.error("[MyAccountPage] setupUser: Catch block error:", err);
            setError(`Could not load account details: ${err.message}.`);
            setProfile(null); setReceipts([]); setAnimeList([]); setProfileStats(null);
            return false;
        }
    }, []);

     const checkSessionAndSetup = useCallback(async (isRetry = false) => {
        console.log(`[MyAccountPage] checkSessionAndSetup: Called. Is Retry: ${isRetry}. Setting loading=true`);
        setLoading(true);
        setError(null);
        try {
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            console.log("[MyAccountPage] checkSessionAndSetup: getSession result:", { sessionExists: !!currentSession, sessionError });
            if (sessionError) throw new Error(`Failed to check authentication session: ${sessionError.message}`);
            setSession(currentSession);
            if (currentSession && currentSession.user) {
                console.log("[MyAccountPage] checkSessionAndSetup: Session found, calling setupUser...");
                await setupUser(currentSession.user);
            } else {
                console.log("[MyAccountPage] checkSessionAndSetup: No session found.");
                setProfile(null); setReceipts([]); setAnimeList([]); setProfileStats(null);
            }
        } catch (err: any) {
            console.error("[MyAccountPage] checkSessionAndSetup: Catch block Error:", err);
            setError(err.message || "An unexpected error occurred.");
            setProfile(null); setReceipts([]); setAnimeList([]); setProfileStats(null);
        } finally {
            console.log("[MyAccountPage] checkSessionAndSetup: Finally block executed. Setting loading=false");
            setLoading(false);
        }
    }, [setupUser]);

    useEffect(() => {
        console.log("[MyAccountPage] Auth Listener useEffect executing.");
        let isMounted = true;
        checkSessionAndSetup(); // Initial check
        const { data: authListener } = supabase.auth.onAuthStateChange( (event, newSession) => {
            if (!isMounted) return;
            console.log("[MyAccountPage] AuthChange event:", event);
            const previousUserId = session?.user?.id;
            const newUserId = newSession?.user?.id;
            setSession(newSession);
            if (newUserId !== previousUserId) {
                 console.log("[MyAccountPage] AuthChange detected user change, calling checkSessionAndSetup.");
                 checkSessionAndSetup();
            } else {
                 console.log("[MyAccountPage] AuthChange user unchanged, skipping setup.");
            }
        } );
        return () => { isMounted = false; console.log("[MyAccountPage] Auth Listener useEffect cleanup."); authListener?.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // --- Other Handlers (မပြောင်းပါ) ---
     const handleDeleteReceipt = async (receiptId: string, receiptPath: string | null) => {
        if (!receiptPath) {
             alert("Cannot delete receipt: Path is missing.");
             return;
        }
        if (window.confirm("Are you sure you want to delete this receipt submission?")) {
             setDeletingReceipt(true);
             try {
                // Delete from storage first
                const { error: storageError } = await supabase.storage.from('receipts').remove([receiptPath]);
                if (storageError) { throw new Error(`Storage deletion failed: ${storageError.message}`); }

                // Delete from database
                const { error: dbError } = await supabase.from('payment_receipts').delete().eq('id', receiptId);
                if (dbError) { throw new Error(`Database deletion failed: ${dbError.message}`); }

                 alert("Receipt deleted successfully.");
                 setReceipts(receipts.filter(r => r.id !== receiptId)); // Update local state
             } catch (err: any) {
                 console.error("Error deleting receipt:", err);
                 alert(`Error deleting receipt: ${err.message}`);
             } finally {
                 setDeletingReceipt(false);
             }
         }
     };
     const handleImageUpload = async ( event: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'banners', setLoadingState: (loading: boolean) => void ) => {
         if (!event.target.files || event.target.files.length === 0 || !session?.user) { return; }
         const file = event.target.files[0];
         const fileExt = file.name.split('.').pop();
         const fileName = `${session.user.id}.${fileExt}`; // Use user ID as filename
         const filePath = `${session.user.id}/${fileName}`; // Store in folder named after user ID

         setLoadingState(true);
         try {
             // Upsert allows replacing existing avatar/banner
             const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true, cacheControl: '3600' });
             if (uploadError) { throw uploadError; }

             // Get public URL (add timestamp to prevent caching issues)
             const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath, {
                // download: false, // Ensure it's not a download link
                // transform: { // Example transform if needed, remove if not
                //    width: bucket === 'avatars' ? 200 : 1200,
                //    height: bucket === 'avatars' ? 200 : undefined,
                //    resize: 'cover',
                // },
             });
             const publicURL = `${urlData.publicUrl}?t=${new Date().getTime()}`; // Add timestamp query param

             // Update profile table
             const updateField = bucket === 'avatars' ? 'avatar_url' : 'banner_url';
             const { error: updateError } = await supabase.from('profiles').update({ [updateField]: publicURL }).eq('id', session.user.id);
             if (updateError) { throw updateError; }

             // Update local profile state to reflect change immediately
             setProfile(prev => prev ? { ...prev, [updateField]: publicURL } : null);
             alert(`${bucket === 'avatars' ? 'Avatar' : 'Banner'} updated successfully!`);

         } catch (err: any) {
             console.error(`Error uploading ${bucket}:`, err);
             alert(`Failed to update ${bucket}: ${err.message}`);
         } finally {
             setLoadingState(false);
             // Clear file input
             if (event.target) event.target.value = '';
         }
     };
     const handleSaveBio = async (newBio: string) => {
         if (!session?.user || !profile) return;
         setSavingBio(true);
         const trimmedBio = newBio.trim();
         try {
             const { error } = await supabase.from('profiles').update({ bio: trimmedBio || null }).eq('id', session.user.id);
             if (error) throw error;
             setProfile(prev => prev ? { ...prev, bio: trimmedBio || null } : null);
             setIsEditingBio(false);
         } catch (err: any) {
             console.error("Error saving bio:", err);
             alert(`Failed to save bio: ${err.message}`);
         } finally {
             setSavingBio(false);
         }
     };
    const handleSaveUsername = async (newUsername: string) => {
        if (!session?.user || !profile) return;
        const trimmedUsername = newUsername.trim();
        // Basic validation
        if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
            alert('Username must be between 3 and 20 characters.'); return;
        }
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(trimmedUsername)) {
            alert("Username can only contain letters, numbers, underscores (_), and hyphens (-)."); return;
        }
        if (trimmedUsername === profile.naju_id) {
            setIsEditingUsername(false); // No change, just close edit mode
            return;
        }

        setSavingUsername(true);
        setError(null);
        try {
            // Check if username already exists using an RPC function (assuming you have one called 'is_username_taken')
            // If you don't have this RPC, you'd need to handle potential unique constraint errors from the update itself.
            // const { data: exists, error: checkError } = await supabase.rpc('is_username_taken', { username_to_check: trimmedUsername });
            // if (checkError) throw checkError;
            // if (exists) throw new Error(`Username "${trimmedUsername}" is already taken.`);

            // Update the username in the profiles table
            const { error: updateError } = await supabase.from('profiles').update({ naju_id: trimmedUsername }).eq('id', session.user.id).single();

            // Handle potential unique constraint violation if RPC check wasn't done or possible
            if (updateError) {
                 if (updateError.message.includes('duplicate key value violates unique constraint') && updateError.message.includes('naju_id')) { throw new Error(`Username "${trimmedUsername}" is already taken.`); }
                 throw updateError; // Throw other errors
            }

            // Update local profile state
            setProfile(prev => prev ? { ...prev, naju_id: trimmedUsername } : null);
            setIsEditingUsername(false);
            alert("Username updated successfully!");

        } catch (err: any) {
            console.error("Error saving username:", err);
            setError(`Failed to save username: ${err.message}`); // Show error to user via state
            // Keep editing mode open if there was an error
        } finally {
            setSavingUsername(false);
        }
    };


    // --- RENDER LOGIC (isThemeLoading ဖယ်ရှား) ---
    console.log("[MyAccountPage] Render: page loading=", loading);
    if (loading) { // isThemeLoading ဖယ်ရှား
        return (<div className="flex min-h-[calc(100vh-200px)] items-center justify-center text-text-dark-primary"><Loader className="animate-spin mr-2" size={24} /> Loading Account...</div>);
    }
    if (error) {
        return ( <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-red-400 text-center px-4"> <AlertTriangle className="mb-2" size={32} /> <p className="font-semibold">Failed to Load Account Details</p> <p className="text-sm text-gray-400 mt-1 mb-4">{error}</p> <button onClick={() => checkSessionAndSetup(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white"> Try Again </button> </div> );
    }
    if (!session || !session.user) {
        return (<div className="flex flex-col items-center justify-center text-center pt-20 text-white"><h1 className="text-3xl font-bold mb-4">Please Log In</h1><p className="text-gray-300 mb-8">You need to be logged in to view your account.</p><p className="text-gray-400">Use the Login button in the sidebar.</p></div>);
    }
     if (!profile) {
         return ( <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-yellow-400 text-center px-4"> <AlertTriangle className="mb-2" size={32} /> <p className="font-semibold">Account Profile Not Found</p> <p className='text-sm text-gray-400 mt-2'>We couldn't find your profile details. This might be a temporary issue or your profile setup might be incomplete.</p> <button onClick={() => checkSessionAndSetup(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white mr-2"> Retry Loading </button> <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold text-white"> Log Out </button> </div> );
     }


    const isSubscribed = profile.subscription_status === 'active' && profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;

    // --- Main Return JSX (dark: prefix များ ဖယ်ရှား) ---
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-text-dark-primary">
            {/* Tab Navigation */}
            <div className="mb-8 border-b border-border-color">
                 <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                     <button onClick={() => setActiveTab('profile')} className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ activeTab === 'profile' ? 'border-accent-green text-accent-green' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' }`}><UserIcon size={16} /> Profile</button>
                     <button onClick={() => setActiveTab('anime_list')} className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ activeTab === 'anime_list' ? 'border-accent-green text-accent-green' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' }`}><ListVideo size={16} /> Anime List</button>
                     <button onClick={() => setActiveTab('settings')} className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ activeTab === 'settings' ? 'border-accent-green text-accent-green' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' }`}><Settings size={16} /> Settings</button>
                 </nav>
            </div>
            {/* Tab Content */}
            <div>
                <AnimatePresence mode="wait">
                    {activeTab === 'profile' &&
                        <ProfileTabContent
                            key="profile" profile={profile}
                            uploadingBanner={uploadingBanner} bannerInputRef={bannerInputRef} handleImageUpload={handleImageUpload} setUploadingBanner={setUploadingBanner}
                            uploadingAvatar={uploadingAvatar} avatarInputRef={avatarInputRef} setUploadingAvatar={setUploadingAvatar}
                            isSubscribed={isSubscribed}
                            isEditingBio={isEditingBio} setIsEditingBio={setIsEditingBio} editingBioText={editingBioText} setEditingBioText={setEditingBioText} handleSaveBio={handleSaveBio} savingBio={savingBio}
                            isEditingUsername={isEditingUsername} setIsEditingUsername={setIsEditingUsername} editingUsernameText={editingUsernameText} setEditingUsernameText={setEditingUsernameText} handleSaveUsername={handleSaveUsername} savingUsername={savingUsername}
                            profileStats={profileStats}
                        />
                    }
                    {activeTab === 'anime_list' && <AnimeListTabContent key="anime_list" animeList={animeList} />}
                    {activeTab === 'settings' &&
                        <SettingsTabContent
                            key="settings"
                            receipts={receipts}
                            deletingReceipt={deletingReceipt}
                            handleDeleteReceipt={handleDeleteReceipt}
                        />
                    }
                </AnimatePresence>
            </div>
            {/* Global Error Display */}
            {error && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-4 right-4 max-w-sm bg-red-800 text-white p-4 rounded-lg shadow-lg flex items-start gap-3 z-50">
                     <AlertTriangle size={20} className="mt-0.5 shrink-0"/>
                     <div>
                         <p className="font-semibold text-sm">Error</p>
                         <p className="text-xs">{error}</p>
                     </div>
                     <button onClick={() => setError(null)} className="ml-auto text-red-200 hover:text-white"><XCircle size={16}/></button>
                 </motion.div>
            )}
        </div>
    );
}