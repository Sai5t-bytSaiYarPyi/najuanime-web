// src/app/my-account/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader, AlertTriangle, User as UserIcon, ListVideo, Settings, Edit3, UploadCloud, Save, XCircle, AtSign, BarChart2, CheckCircle, Star, Heart, Activity, Palette, Mail, KeyRound, Trash2 } from 'lucide-react';

// --- Types ( မပြောင်းပါ ) ---
type ProfilePreferences = { theme?: 'light' | 'dark'; accentColor?: string };
type Profile = { id: string; naju_id: string; subscription_expires_at: string | null; subscription_status: string | null; avatar_url: string | null; banner_url: string | null; bio: string | null; preferences: ProfilePreferences | null; };
type Receipt = { id: string; created_at: string; receipt_url: string; status: 'pending' | 'approved' | 'rejected'; };
type AnimeSeriesData = {
    id: string;
    poster_url: string | null;
    title_english: string | null;
    title_romaji: string | null;
} | null;
type FavoriteAnimeItem = {
    anime_series: AnimeSeriesData;
};
type UserAnimeListItem = {
    status: string;
    rating: number | null;
    anime_series: AnimeSeriesData;
};
type Tab = 'profile' | 'anime_list' | 'favorites' | 'settings';
type ProfileStatsData = { completed_count: number; mean_score: number; total_episodes?: number; days_watched?: number; } | null;
type SettingsTabContentProps = {
    profile: Profile | null;
    userEmail: string | undefined | null;
    receipts: Receipt[];
    deletingReceipt: boolean;
    handleDeleteReceipt: (receiptId: string, receiptPath: string | null) => void;
    isEditingBio: boolean;
    setIsEditingBio: (isEditing: boolean) => void;
    editingBioText: string;
    setEditingBioText: (text: string) => void;
    handleSaveBio: (newBio: string) => void;
    savingBio: boolean;
    isEditingUsername: boolean;
    setIsEditingUsername: (isEditing: boolean) => void;
    editingUsernameText: string;
    setEditingUsernameText: (text: string) => void;
    handleSaveUsername: (newUsername: string) => void;
    savingUsername: boolean;
};

// --- Child Components ( မပြောင်းပါ ) ---
const ProfileStatsDisplay = ({ stats }: { stats: ProfileStatsData }) => {
    if (!stats) {
        return <div className="bg-card-dark p-4 rounded-lg shadow-md text-text-dark-secondary text-sm">Loading stats...</div>;
    }
    return (
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
                {stats.total_episodes !== undefined && (
                     <div>
                        <p className="text-2xl font-bold text-accent-blue">{stats.total_episodes ?? 0}</p>
                        <p className="text-xs text-text-dark-secondary uppercase">Episodes Watched</p>
                    </div>
                )}
                 {stats.days_watched !== undefined && (
                     <div>
                        <p className="text-2xl font-bold text-accent-purple">{stats.days_watched?.toFixed(1) ?? 0}</p>
                        <p className="text-xs text-text-dark-secondary uppercase">Days Watched</p>
                    </div>
                 )}
            </div>
             <div className="mt-4 text-center text-xs text-text-dark-secondary italic">
                (Genre Chart & Rating Chart Coming Soon)
            </div>
        </div>
    );
};

const ProfileTabContent = ({
    profile,
    uploadingBanner, bannerInputRef, handleImageUpload, setUploadingBanner,
    uploadingAvatar, avatarInputRef, setUploadingAvatar,
    isSubscribed,
    profileStats
}: any) => {
     const displayUsername = profile?.naju_id || 'User';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Banner */}
            <div className="h-40 md:h-56 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-lg relative shadow-lg group overflow-hidden">
                {profile?.banner_url ? ( <Image src={profile.banner_url} alt="Profile Banner" fill style={{ objectFit: 'cover' }} className="rounded-lg" priority sizes="(max-width: 768px) 100vw, 1184px"/> ) : ( <div className="absolute inset-0 flex items-center justify-center text-gray-500">Default Banner Area</div> )}
                 <button onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner || uploadingAvatar} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors text-xs opacity-0 group-hover:opacity-100 flex items-center gap-1 z-10 disabled:opacity-50 disabled:cursor-not-allowed">
                     {uploadingBanner ? <Loader size={14} className="animate-spin"/> : <UploadCloud size={14} />} {uploadingBanner ? 'Uploading...' : 'Change Banner'} </button>
                 <input type="file" ref={bannerInputRef} onChange={(e) => handleImageUpload(e, 'banners', setUploadingBanner)} accept="image/png, image/jpeg, image/webp, image/gif" style={{ display: 'none' }} />
            </div>

            {/* Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-20 px-6">
                 <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background-dark bg-gray-600 flex items-center justify-center overflow-hidden shadow-xl shrink-0 group">
                    {profile?.avatar_url ? ( <Image src={profile.avatar_url} alt="User Avatar" fill style={{ objectFit: 'cover' }} className="rounded-full" sizes="(max-width: 768px) 128px, 160px"/> ) : ( <UserIcon size={64} className="text-gray-400" /> )}
                     <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar || uploadingBanner} className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer z-10 disabled:opacity-50 disabled:cursor-not-allowed">
                         {uploadingAvatar ? <Loader size={20} className="animate-spin mb-1"/> : <UploadCloud size={20} className="mb-1"/>} {uploadingAvatar ? 'Uploading...' : 'Change Avatar'} </button>
                     <input type="file" ref={avatarInputRef} onChange={(e) => handleImageUpload(e, 'avatars', setUploadingAvatar)} accept="image/png, image/jpeg, image/webp, image/gif" style={{ display: 'none' }} />
                </div>
                <div className="text-center sm:text-left pb-2 flex-grow">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-dark-primary">{displayUsername}</h1>
                        <p className="text-text-dark-secondary font-mono text-sm">@{profile?.naju_id || 'N/A'}</p>
                    </div>
                </div>
                <div className="sm:ml-auto">
                    {/* // START: Link ကို #settings-edit-profile သို့ ပြောင်းထားပါ (Settings tab ကို navigate လုပ်ရန်) */}
                    <button onClick={() => {
                        const settingsTab = document.querySelector('button[aria-label="Settings Tab"]'); // Tab button ကို query လုပ်
                        (settingsTab as HTMLElement)?.click(); // Settings tab ကို နှိပ်
                        setTimeout(() => { // Tab ပြောင်းပြီးမှ scroll လုပ်
                            document.getElementById('settings-edit-profile')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                    }} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5" >
                        <Edit3 size={14} /> Edit Profile
                    </button>
                    {/* // END: Link ကို #settings-edit-profile သို့ ပြောင်းထားပါ */}
                </div>
            </div>

            {/* Stats, Bio, Subscription, Recent Activity */}
            <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-4">
                     <ProfileStatsDisplay stats={profileStats} />
                     <div className="bg-card-dark p-4 rounded-lg shadow-md">
                         <h3 className="font-semibold text-text-dark-primary mb-1">Subscription</h3>
                         {isSubscribed ? ( <div className="flex items-center gap-2"> <span className="w-3 h-3 bg-green-500 rounded-full inline-block animate-pulse"></span> <span className="text-green-400 font-medium">ACTIVE</span> <span className="text-text-dark-secondary text-sm">(Expires: {profile?.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : 'N/A'})</span> </div> ) : ( <div className="flex items-center gap-2"> <span className={`w-3 h-3 ${profile?.subscription_status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'} rounded-full inline-block`}></span> <span className={`${profile?.subscription_status === 'expired' ? 'text-red-400' : 'text-yellow-400'} font-medium`}> {profile?.subscription_status === 'expired' ? 'EXPIRED' : 'INACTIVE'} </span> <Link href="/subscribe" className="ml-auto text-accent-blue hover:underline text-sm font-semibold">Subscribe Now</Link> </div> )}
                    </div>
                 </div>
                 <div className="space-y-4">
                     <div className="bg-card-dark p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-semibold text-text-dark-primary">About Me</h3>
                             {/* // START: Link ကို #settings-edit-profile သို့ ပြောင်းထားပါ */}
                             <button onClick={() => {
                                const settingsTab = document.querySelector('button[aria-label="Settings Tab"]');
                                (settingsTab as HTMLElement)?.click();
                                setTimeout(() => {
                                    document.getElementById('settings-edit-profile')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                             }} className="text-xs text-text-dark-secondary hover:text-white"> <Edit3 size={12} className="inline mr-1"/> Edit Bio </button>
                             {/* // END: Link ကို #settings-edit-profile သို့ ပြောင်းထားပါ */}
                        </div>
                        { profile?.bio ? ( <p className="text-text-dark-secondary text-sm whitespace-pre-wrap">{profile.bio}</p> ) : ( <p className="text-text-dark-secondary text-sm italic">No bio added yet.</p> ) }
                     </div>
                      <div className="bg-card-dark p-4 rounded-lg shadow-md">
                         <h3 className="font-semibold text-text-dark-primary mb-3 flex items-center gap-2"><Activity size={16}/> Recent Activity</h3>
                         <p className="text-text-dark-secondary text-sm italic">(Coming Soon)</p>
                     </div>
                 </div>
            </div>
        </motion.div>
    );
};

const AnimeListTabContent = ({ animeList }: { animeList: UserAnimeListItem[] }) => {
    const [filterStatus, setFilterStatus] = useState('All');
    const statusMap: { [key: string]: string } = { All: 'All', Watching: 'watching', Completed: 'completed', 'Plan to Watch': 'plan_to_watch', 'On Hold': 'on_hold', Dropped: 'dropped' };
    const displayStatuses = Object.keys(statusMap);
    const filteredList = filterStatus === 'All' ? animeList : animeList.filter(item => item.status === statusMap[filterStatus]);

   return (
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-6 border-b border-border-color">
              <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Anime Status Tabs">
                  {displayStatuses.map(statusLabel => (
                     <button key={statusLabel} onClick={() => setFilterStatus(statusLabel)}
                        className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-xs transition-colors duration-150 ${ filterStatus === statusLabel ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' }`} >
                         {statusLabel}
                     </button>
                  ))}
              </nav>
          </div>

          {filteredList.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-4 gap-y-6">
                  {filteredList.map((item: UserAnimeListItem) => {
                      const anime = item.anime_series;
                      if (!anime) return null;
                      return (
                          <Link href={`/anime/${anime.id}`} key={`${anime.id}-${item.status}`} className="group relative transition-transform duration-200 ease-in-out hover:-translate-y-1">
                              <div className="aspect-[2/3] relative rounded-md overflow-hidden shadow-lg border border-transparent group-hover:border-accent-green bg-gray-800">
                                  <Image src={anime.poster_url || '/placeholder.png'} alt={anime.title_english || anime.title_romaji || 'Poster'} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-center">
                                      <span className="bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded self-end"> {item.status.replace('_', ' ').toUpperCase()} </span>
                                       {item.rating && ( <div className="flex items-center justify-center gap-1 text-yellow-400 bg-black/70 rounded-full px-1.5 py-0.5 self-center mb-1"> <Star size={10} fill="currentColor"/> <span className="text-xs font-bold">{item.rating}</span> </div> )}
                                  </div>
                              </div>
                               <h3 className="mt-1.5 text-xs font-semibold text-text-dark-secondary group-hover:text-accent-green truncate"> {anime.title_english || anime.title_romaji} </h3>
                          </Link>
                       );
                  })}
              </div>
          ) : (
              <div className="bg-card-dark p-8 rounded-lg text-center shadow-md mt-6">
                  <p className="text-text-dark-secondary"> {animeList.length === 0 ? "Your anime list is empty." : `No anime found for "${filterStatus}" status.`} </p>
                  {animeList.length === 0 && ( <Link href="/anime" className="mt-4 inline-block px-4 py-2 bg-accent-blue hover:bg-blue-700 rounded-md text-sm font-semibold text-white"> Browse Anime </Link> )}
                   {animeList.length > 0 && filterStatus !== 'All' && ( <button onClick={() => setFilterStatus('All')} className="mt-2 text-accent-blue hover:underline text-sm">Show All Anime</button> )}
              </div>
          )}
       </motion.div>
   );
};

type FavoritesTabContentProps = {
    favoriteList: FavoriteAnimeItem[];
};

const FavoritesTabContent = ({ favoriteList }: FavoritesTabContentProps) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-2xl font-bold text-text-dark-primary mb-6">Favorite Anime</h2>

        {favoriteList.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-4 gap-y-6">
                {favoriteList.map((item: FavoriteAnimeItem) => {
                    const anime = item.anime_series;
                    if (!anime) return null;
                    return (
                        <Link href={`/anime/${anime.id}`} key={anime.id} className="group relative transition-transform duration-200 ease-in-out hover:-translate-y-1">
                            <div className="aspect-[2/3] relative rounded-md overflow-hidden shadow-lg border border-transparent group-hover:border-accent-green bg-gray-800">
                                <Image src={anime.poster_url || '/placeholder.png'} alt={anime.title_english || anime.title_romaji || 'Poster'} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Heart size={40} className="text-red-500 fill-current" />
                                </div>
                            </div>
                            <h3 className="mt-1.5 text-xs font-semibold text-text-dark-secondary group-hover:text-accent-green truncate">
                                {anime.title_english || anime.title_romaji}
                            </h3>
                        </Link>
                     );
                })}
            </div>
        ) : (
            <div className="bg-card-dark p-8 rounded-lg text-center shadow-md">
                <p className="text-text-dark-secondary">You haven't added any favorite anime yet.</p>
                <Link href="/anime" className="mt-4 inline-block px-4 py-2 bg-accent-blue hover:bg-blue-700 rounded-md text-sm font-semibold text-white">
                    Browse Anime
                </Link>
            </div>
        )}
         <div className="mt-8">
             <h2 className="text-xl font-bold text-text-dark-primary mb-4">Favorite Characters</h2>
            <div className="bg-card-dark p-4 rounded-lg shadow-md">
                <p className="text-text-dark-secondary text-sm italic">(Coming Soon)</p>
            </div>
         </div>
    </motion.div>
);

// --- SettingsTabContent (Logic များကို အသက်ဝင်စေရန် ပြင်ဆင်ထားသည်) ---
const SettingsTabContent = ({
    profile, userEmail, receipts, deletingReceipt, handleDeleteReceipt,
    isEditingBio, setIsEditingBio, editingBioText, setEditingBioText, handleSaveBio, savingBio,
    isEditingUsername, setIsEditingUsername, editingUsernameText, setEditingUsernameText, handleSaveUsername, savingUsername,
}: SettingsTabContentProps) => {
    // --- START: States များကို အသက်ဝင်စေရန် ထည့်သွင်း/ပြင်ဆင်ခြင်း ---
    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);
    const [emailMessage, setEmailMessage] = useState<string | null>(null); // Email message state

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null); // Password message state

    const [accentColor, setAccentColor] = useState(profile?.preferences?.accentColor || '#39FF14');
    const [savingAccent, setSavingAccent] = useState(false);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);

    // Error state ကို local မှာ ထိန်းသိမ်းရန် (global error state ကို မထိခိုက်စေရန်)
    const [localError, setLocalError] = useState<string | null>(null);
    // --- END: States များကို အသက်ဝင်စေရန် ထည့်သွင်း/ပြင်ဆင်ခြင်း ---


    useEffect(() => {
        setAccentColor(profile?.preferences?.accentColor || '#39FF14');
        // Accent color ကို CSS variable အဖြစ် သတ်မှတ်ပေးပါ
        if (profile?.preferences?.accentColor) {
             document.documentElement.style.setProperty('--accent-color', profile.preferences.accentColor);
        } else {
             document.documentElement.style.setProperty('--accent-color', '#39FF14'); // Default
        }
    }, [profile?.preferences?.accentColor]);

    // --- START: Function Logic များကို အသက်ဝင်စေရန် ပြင်ဆင်ခြင်း ---
    const handleChangeEmail = async () => {
        if (!newEmail || savingEmail) return;
        setSavingEmail(true);
        setLocalError(null);
        setEmailMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            setEmailMessage("Confirmation email sent to your new address. Please verify to complete the change.");
            setNewEmail('');
            setIsChangingEmail(false);
        } catch (e: any) {
            console.error('Change email failed', e);
            setLocalError(`Failed to update email: ${e.message}`);
        } finally {
            setSavingEmail(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword !== confirmPassword || savingPassword) {
            setLocalError("Passwords do not match or are empty.");
            return;
        }
        if (newPassword.length < 6) {
             setLocalError("Password must be at least 6 characters long.");
             return;
        }
        
        setSavingPassword(true);
        setLocalError(null);
        setPasswordMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPasswordMessage("Password updated successfully!");
            setIsChangingPassword(false);
            setNewPassword(''); setConfirmPassword('');
        } catch (e: any) {
            console.error('Change password failed', e);
            setLocalError(`Failed to update password: ${e.message}`);
        } finally {
            setSavingPassword(false);
        }
    };

    const handleSaveAccent = async () => {
        if (!profile?.id || savingAccent) return;
        setSavingAccent(true);
        setLocalError(null);
        try {
            const prefs = { ...(profile.preferences || {}), accentColor };
            const { error } = await supabase.from('profiles').update({ preferences: prefs }).eq('id', profile.id);
            if (error) throw error;
            // CSS variable ကို ချက်ချင်း update လုပ်
            if (accentColor) {
                 document.documentElement.style.setProperty('--accent-color', accentColor);
            }
        } catch (e: any) {
            console.error('Save accent failed', e);
            setLocalError(`Failed to save accent color: ${e.message}`);
        } finally {
            setSavingAccent(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!profile?.id || deletingAccount) return;
        if (!deleteConfirmText || deleteConfirmText !== (profile.naju_id || '')) {
            setLocalError("Username confirmation does not match.");
            return;
        }
        setDeletingAccount(true);
        setLocalError(null);
        try {
            // ဒါက soft delete ပါ။ User ရဲ့ data ကို 'profiles' table မှာပဲ update လုပ်ပါတယ်။
            // RLS policy က ဒါကို ခွင့်ပြုဖို့ လိုပါမယ်။
            const anonHandle = `${profile.naju_id}-deleted-${Date.now()}`;
            const { error } = await supabase.from('profiles').update({
                // is_private: true, // ဒီ field ရှိမရှိ စစ်ဆေးပါ (မရှိရင် ဖယ်ပါ)
                avatar_url: null,
                banner_url: null,
                bio: null,
                naju_id: anonHandle, // Username ကို ပြောင်းလိုက်ပါ
                preferences: { ...(profile.preferences || {}), accentColor: null }
            }).eq('id', profile.id);

            if (error) throw error;

            // Soft delete အောင်မြင်ရင် user ကို logout လုပ်ပေးပါ
            await supabase.auth.signOut();
            window.location.href = '/'; // Homepage ကို ပြန်သွားပါ
        } catch (e: any) {
            console.error('Delete account failed', e);
            setLocalError(`Failed to delete account: ${e.message}`);
        } finally {
            setDeletingAccount(false);
        }
    };
    // --- END: Function Logic များကို အသက်ဝင်စေရန် ပြင်ဆင်ခြင်း ---


    const startEditingBio = () => { setIsEditingBio(true); setEditingBioText(profile?.bio || ''); };
    const cancelEditingBio = () => { setIsEditingBio(false); };
    const startEditingUsername = () => { setIsEditingUsername(true); setEditingUsernameText(profile?.naju_id || ''); };
    const cancelEditingUsername = () => { setIsEditingUsername(false); };

    return (
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h2 className="text-2xl font-bold text-text-dark-primary">Account Settings</h2>
          
           {/* START: Local Error/Message Display */}
           <AnimatePresence>
            {localError && (
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-red-400 bg-red-900/30 border border-red-500/50 p-3 rounded-md">
                     <AlertTriangle size={16} /><span>{localError}</span>
                     <button onClick={() => setLocalError(null)} className="ml-auto text-red-200 hover:text-white"><XCircle size={16}/></button>
                 </motion.div>
             )}
             {emailMessage && (
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-green-400 bg-green-900/30 border border-green-500/50 p-3 rounded-md">
                     <CheckCircle size={16} /><span>{emailMessage}</span>
                     <button onClick={() => setEmailMessage(null)} className="ml-auto text-green-200 hover:text-white"><XCircle size={16}/></button>
                 </motion.div>
             )}
             {passwordMessage && (
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2 text-sm text-green-400 bg-green-900/30 border border-green-500/50 p-3 rounded-md">
                     <CheckCircle size={16} /><span>{passwordMessage}</span>
                     <button onClick={() => setPasswordMessage(null)} className="ml-auto text-green-200 hover:text-white"><XCircle size={16}/></button>
                 </motion.div>
             )}
           </AnimatePresence>
           {/* END: Local Error/Message Display */}

           <div id="settings-edit-profile" className="bg-card-dark p-6 rounded-lg shadow-md">
               <h3 className="text-xl font-semibold mb-4 text-text-dark-primary flex items-center gap-2"><Edit3 size={18}/> Edit Profile</h3>
               <div className="mb-6">
                  <label className="block text-sm font-medium text-text-dark-secondary mb-1">Username</label>
                  {isEditingUsername ? (
                      <div className="space-y-2">
                           <div className="relative">
                               <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                               <input type="text" value={editingUsernameText} onChange={(e) => setEditingUsernameText(e.target.value)} placeholder="Enter new username" className="w-full max-w-xs p-2 pl-9 rounded bg-gray-700 border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" maxLength={20} />
                           </div>
                           <div className="flex gap-2">
                               <button onClick={cancelEditingUsername} disabled={savingUsername} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold disabled:opacity-50 text-text-dark-primary"> <XCircle size={14} className="inline mr-1"/> Cancel </button>
                               <button onClick={() => handleSaveUsername(editingUsernameText)} disabled={savingUsername || editingUsernameText.trim().length < 3 || editingUsernameText.trim() === profile?.naju_id} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-1"> {savingUsername ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingUsername ? 'Saving...' : 'Save'} </button>
                           </div>
                      </div>
                   ) : (
                      <div className="flex items-center gap-4">
                        <p className="text-text-dark-primary font-mono">@{profile?.naju_id || 'N/A'}</p>
                        <button onClick={startEditingUsername} disabled={savingBio} className="text-xs text-text-dark-secondary hover:text-white disabled:opacity-50"> <Edit3 size={12} className="inline mr-0.5"/> Change </button>
                      </div>
                   )}
               </div>
               <div>
                  <label className="block text-sm font-medium text-text-dark-secondary mb-1">About Me / Bio</label>
                   {isEditingBio ? (
                      <div className="space-y-3">
                            <textarea value={editingBioText} onChange={(e) => setEditingBioText(e.target.value)} placeholder="Tell us about yourself..." className="w-full p-2 rounded bg-gray-700 border border-border-color min-h-[100px] text-sm focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" rows={4} maxLength={500} />
                            <div className="flex justify-end gap-2">
                                <button onClick={cancelEditingBio} disabled={savingBio} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold disabled:opacity-50"> <XCircle size={14} className="inline mr-1"/> Cancel </button>
                                <button onClick={() => handleSaveBio(editingBioText)} disabled={savingBio || savingUsername} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 disabled:cursor-wait flex items-center gap-1"> {savingBio ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingBio ? 'Saving...' : 'Save Bio'} </button>
                            </div>
                        </div>
                   ) : (
                        <div className="flex items-start gap-4">
                            <p className="text-text-dark-secondary text-sm whitespace-pre-wrap flex-grow">{profile?.bio || <span className="italic">No bio added yet.</span>}</p>
                            <button onClick={startEditingBio} disabled={savingUsername} className="text-xs text-text-dark-secondary hover:text-white disabled:opacity-50 shrink-0"> <Edit3 size={12} className="inline mr-0.5"/> Edit </button>
                        </div>
                   )}
               </div>
           </div>
            <div className="bg-card-dark p-6 rounded-lg shadow-md">
               <h3 className="text-xl font-semibold mb-4 text-text-dark-primary flex items-center gap-2"><UserIcon size={18}/> Account Management</h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-text-dark-secondary mb-1">Email Address</label>
                     <p className="text-text-dark-primary">{userEmail || 'Loading...'}</p>
                     {!isChangingEmail ? (
                        <button onClick={() => { setIsChangingEmail(true); setLocalError(null); setEmailMessage(null); }} className="mt-1 text-xs text-accent-blue hover:underline">Change Email</button>
                     ) : (
                        <div className="mt-2 flex flex-col gap-2 max-w-md">
                           <div className="relative flex-1">
                             <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email" className="w-full p-2 pl-9 rounded bg-gray-700 border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" />
                           </div>
                           <div className="flex gap-2">
                             <button onClick={() => { setIsChangingEmail(false); setNewEmail(''); setLocalError(null); setEmailMessage(null); }} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold">Cancel</button>
                             <button onClick={handleChangeEmail} disabled={savingEmail || !newEmail} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 flex items-center gap-1">
                                {savingEmail ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingEmail ? 'Saving...' : 'Save'}
                             </button>
                           </div>
                        </div>
                     )}
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-text-dark-secondary mb-1">Password</label>
                      {!isChangingPassword ? (
                        <button onClick={() => { setIsChangingPassword(true); setLocalError(null); setPasswordMessage(null); }} className="mt-1 text-xs text-accent-blue hover:underline">Change Password</button>
                      ) : (
                        <div className="mt-2 flex flex-col gap-2 max-w-sm">
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" className="w-full p-2 pl-9 rounded bg-gray-700 border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" />
                          </div>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full p-2 pl-9 rounded bg-gray-700 border border-border-color focus:outline-none focus:ring-1 focus:ring-accent-green text-text-dark-primary" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setIsChangingPassword(false); setNewPassword(''); setConfirmPassword(''); setLocalError(null); setPasswordMessage(null); }} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold">Cancel</button>
                            <button onClick={handleChangePassword} disabled={savingPassword || !newPassword || newPassword !== confirmPassword} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 flex items-center gap-1">
                                {savingPassword ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingPassword ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      )}
                   </div>
               </div>
           </div>
            <div className="bg-card-dark p-6 rounded-lg shadow-md">
               <h3 className="text-xl font-semibold mb-4 text-text-dark-primary flex items-center gap-2"><Palette size={18}/> Site Preferences</h3>
               <div>
                  <label className="block text-sm font-medium text-text-dark-secondary mb-1">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-8 w-12 rounded bg-transparent border-none cursor-pointer" />
                    <span className="text-sm font-mono">{accentColor}</span>
                    <button onClick={handleSaveAccent} disabled={savingAccent || accentColor === (profile?.preferences?.accentColor || '#39FF14')} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 flex items-center gap-1">
                         {savingAccent ? <Loader size={14} className="animate-spin"/> : <Save size={14} />} {savingAccent ? 'Saving...' : 'Save'}
                    </button>
                  </div>
               </div>
           </div>

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
              <Link href="/subscribe" className="mt-4 inline-block text-accent-green hover:underline text-sm"> Submit another receipt &rarr; </Link>
           </div>
           
           <div className="bg-red-900/30 border border-red-700 p-6 rounded-lg shadow-md">
               <h3 className="text-xl font-semibold mb-3 text-red-300 flex items-center gap-2"><AlertTriangle size={18}/> Danger Zone</h3>
               {!deleteConfirmOpen ? (
                 <button onClick={() => { setDeleteConfirmOpen(true); setLocalError(null); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Delete Account</button>
               ) : (
                 <div className="space-y-3">
                   <p className="text-red-300 text-sm">This action will **soft delete** your account by anonymizing your data and will sign you out. This cannot be undone.</p>
                   <p className="text-red-300 text-xs">Please type your username <strong className='font-mono'>@{profile?.naju_id || ''}</strong> to confirm.</p>
                   <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full max-w-xs p-2 pl-9 rounded bg-gray-700 border border-red-700 focus:outline-none focus:ring-1 focus:ring-red-400 text-text-dark-primary" />
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); setLocalError(null); }} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-text-dark-primary text-xs font-semibold">Cancel</button>
                     <button onClick={handleDeleteAccount} disabled={deletingAccount || deleteConfirmText !== (profile?.naju_id || '')} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-white text-xs font-semibold disabled:bg-gray-500 flex items-center gap-1">
                         {deletingAccount ? <Loader size={14} className="animate-spin"/> : <Trash2 size={14} />} {deletingAccount ? 'Deleting...' : 'Confirm Delete'}
                     </button>
                   </div>
                 </div>
               )}
           </div>

       </motion.div>
    );
};
// --- END: SettingsTabContent (Logic များကို အသက်ဝင်စေရန် ပြင်ဆင်ထားသည်) ---


// --- Main Component ( မပြောင်းပါ ) ---
export default function MyAccountPage() {
    console.log("[MyAccountPage] Component rendering...");
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [animeList, setAnimeList] = useState<UserAnimeListItem[]>([]);
    const [favoriteAnimeList, setFavoriteAnimeList] = useState<FavoriteAnimeItem[]>([]);
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
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // --- setupUser function ( မပြောင်းပါ ) ---
    const setupUser = useCallback(async (user: User) => {
        console.log("[MyAccountPage] setupUser: Starting data fetch for user:", user.id);
        setError(null);
        setProfile(null); setReceipts([]); setAnimeList([]); setFavoriteAnimeList([]); setProfileStats(null); // Reset states

        try {
            console.log("[MyAccountPage] setupUser: Fetching profile...");
            let { data: fetchedProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id, naju_id, subscription_expires_at, subscription_status, avatar_url, banner_url, bio, preferences')
                .eq('id', user.id)
                .single();
            if (profileError && profileError.code !== 'PGRST116') {
                throw new Error(`Profile fetch failed: ${profileError.message}`);
            }

            // Auto-create profile if missing
            if (!fetchedProfile) {
                console.log('[MyAccountPage] setupUser: No profile found. Creating default profile (DB defaults for naju_id)...');
                const { data, error } = await supabase
                    .from('profiles')
                    .insert({ id: user.id, preferences: { theme: 'dark' } }) // let DB set naju_id via default/trigger
                    .select('id, naju_id, subscription_expires_at, subscription_status, avatar_url, banner_url, bio, preferences')
                    .single();
                if (error) {
                    // If another request created it concurrently, fetch again
                    if ((error as any).code === '23505' || (error.message && error.message.toLowerCase().includes('duplicate key'))) {
                        const retry = await supabase
                            .from('profiles')
                            .select('id, naju_id, subscription_expires_at, subscription_status, avatar_url, banner_url, bio, preferences')
                            .eq('id', user.id)
                            .single();
                        if (retry.error) throw new Error(`Profile fetch after conflict failed: ${retry.error.message}`);
                        fetchedProfile = retry.data;
                    } else {
                        throw new Error(`Profile create failed: ${error.message}`);
                    }
                } else {
                    fetchedProfile = data;
                }
            }
            console.log("[MyAccountPage] setupUser: Profile ready.");

            console.log("[MyAccountPage] setupUser: Fetching other data in parallel...");
            const [receiptsResponse, animeListResponse, statsResponse, favoritesResponse] = await Promise.all([
                supabase.from('payment_receipts').select('id, created_at, receipt_url, status').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('user_anime_list').select('status, rating, anime_series (id, poster_url, title_english, title_romaji)').eq('user_id', user.id).order('updated_at', { ascending: false }),
                supabase.rpc('get_user_profile_stats', { p_user_id: user.id }),
                supabase.from('user_favorites').select('anime_series (id, poster_url, title_english, title_romaji)').eq('user_id', user.id).eq('item_type', 'anime').order('created_at', { ascending: false })
            ]);

            if (receiptsResponse.error) { throw new Error(`Receipts fetch failed: ${receiptsResponse.error.message}`); }
            if (animeListResponse.error) { throw new Error(`Anime list fetch failed: ${animeListResponse.error.message}`); }
            if (statsResponse.error) { throw new Error(`Stats fetch failed: ${statsResponse.error.message}`); }
            if (favoritesResponse.error) { throw new Error(`Favorites fetch failed: ${favoritesResponse.error.message}`); }

            console.log("[MyAccountPage] setupUser: All fetches successful.");

            // Process and set states
            setProfile(fetchedProfile);
            setReceipts(receiptsResponse.data || []);

            const fetchedAnimeList = animeListResponse.data;
            if (fetchedAnimeList && Array.isArray(fetchedAnimeList)) {
                setAnimeList(fetchedAnimeList.map((item: any) => ({
                    status: item.status,
                    rating: item.rating,
                    anime_series: item.anime_series as AnimeSeriesData
                })));
            } else { setAnimeList([]); }

            setProfileStats(statsResponse.data);

            const fetchedFavorites = favoritesResponse.data;
            // --- START: ပြင်ဆင်ထားသော အပိုင်း ---
            if (fetchedFavorites && Array.isArray(fetchedFavorites)) {
                // Filter လုပ်ပြီးသား data ကို unknown အဖြစ် အရင် cast လုပ်၊ ပြီးမှ FavoriteAnimeItem[] အဖြစ် cast ပါ
                setFavoriteAnimeList(fetchedFavorites.filter(fav => fav.anime_series) as unknown as FavoriteAnimeItem[]);
            } else { setFavoriteAnimeList([]); }
            // --- END: ပြင်ဆင်ထားသော အပိုင်း ---


            console.log("[MyAccountPage] setupUser: Data fetch complete, state updated.");
            return true;
        } catch (err: any) {
            console.error("[MyAccountPage] setupUser: Catch block error:", err);
            setError(`Could not load account details: ${err.message}.`);
            setProfile(null); setReceipts([]); setAnimeList([]); setFavoriteAnimeList([]); setProfileStats(null);
            return false;
        }
    }, []);

    // --- Other Functions (checkSessionAndSetup, useEffect, handleDeleteReceipt, etc.) ( မပြောင်းပါ ) ---
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
                setProfile(null); setReceipts([]); setAnimeList([]); setFavoriteAnimeList([]); setProfileStats(null);
            }
        } catch (err: any) {
            console.error("[MyAccountPage] checkSessionAndSetup: Catch block Error:", err);
            setError(err.message || "An unexpected error occurred.");
            setProfile(null); setReceipts([]); setAnimeList([]); setFavoriteAnimeList([]); setProfileStats(null);
        } finally {
            console.log("[MyAccountPage] checkSessionAndSetup: Finally block executed. Setting loading=false");
            setLoading(false);
        }
    }, [setupUser]);

    useEffect(() => {
        console.log("[MyAccountPage] Auth Listener useEffect executing.");
        let isMounted = true;
        checkSessionAndSetup();
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


     const handleDeleteReceipt = async (receiptId: string, receiptPath: string | null) => {
         if (!receiptPath) { alert("Cannot delete receipt: Path is missing."); return; }
        if (window.confirm("Are you sure you want to delete this receipt submission?")) {
             setDeletingReceipt(true);
             try {
                // RLS policy: User တွေက ကိုယ့် receipt file ကိုပဲ ဖျက်ခွင့်ရှိရမယ်။
                const { error: storageError } = await supabase.storage.from('receipts').remove([receiptPath]);
                if (storageError) { throw new Error(`Storage deletion failed: ${storageError.message}`); }
                // RLS policy: User တွေက ကိုယ့် receipt record ကိုပဲ ဖျက်ခွင့်ရှိရမယ်။
                const { error: dbError } = await supabase.from('payment_receipts').delete().eq('id', receiptId);
                if (dbError) { throw new Error(`Database deletion failed: ${dbError.message}`); }
                 alert("Receipt deleted successfully.");
                 setReceipts(receipts.filter(r => r.id !== receiptId));
             } catch (err: any) {
                 console.error("Error deleting receipt:", err);
                 alert(`Error deleting receipt: ${err.message}`);
             } finally { setDeletingReceipt(false); }
         }
     };
     const handleImageUpload = async ( event: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'banners', setLoadingState: (loading: boolean) => void ) => {
         if (!event.target.files || event.target.files.length === 0 || !session?.user) { return; }
         const file = event.target.files[0];
         const fileExt = file.name.split('.').pop();
         const fileName = `${session.user.id}.${fileExt}`; // User ID ကို filename အဖြစ်သုံး (Upsert လုပ်ရန်)
         const filePath = `${session.user.id}/${fileName}`; // Folder path က user id
         setLoadingState(true);
         try {
             // Storage RLS: User က ကိုယ့် user_id folder အောက်မှာပဲ upload/update လုပ်ခွင့်ရှိရမယ်။
             const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true, cacheControl: '3600' });
             if (uploadError) { throw uploadError; }
             const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
             const publicURL = `${urlData.publicUrl}?t=${new Date().getTime()}`; // Cache bust
             const updateField = bucket === 'avatars' ? 'avatar_url' : 'banner_url';
             // RLS: User က ကိုယ့် profile ကိုပဲ update လုပ်ခွင့်ရှိရမယ်။
             const { error: updateError } = await supabase.from('profiles').update({ [updateField]: publicURL }).eq('id', session.user.id);
             if (updateError) { throw updateError; }
             setProfile(prev => prev ? { ...prev, [updateField]: publicURL } : null);
             alert(`${bucket === 'avatars' ? 'Avatar' : 'Banner'} updated successfully!`);
         } catch (err: any) {
             console.error(`Error uploading ${bucket}:`, err);
             alert(`Failed to update ${bucket}: ${err.message}`);
         } finally {
             setLoadingState(false);
             if (event.target) event.target.value = '';
         }
     };
     const handleSaveBio = async (newBio: string) => {
         if (!session?.user || !profile) return;
         setSavingBio(true);
         const trimmedBio = newBio.trim();
         try {
             // RLS: User က ကိုယ့် profile ကိုပဲ update လုပ်ခွင့်ရှိရမယ်။
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
        if (trimmedUsername.length < 3 || trimmedUsername.length > 20) { alert('Username must be between 3 and 20 characters.'); return; }
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(trimmedUsername)) { alert("Username can only contain letters, numbers, underscores (_), and hyphens (-)."); return; }
        if (trimmedUsername === profile.naju_id) { setIsEditingUsername(false); return; }
        setSavingUsername(true);
        setError(null);
        try {
            // RLS: User က ကိုယ့် profile ကိုပဲ update လုပ်ခွင့်ရှိရမယ်။
            const { error: updateError } = await supabase.from('profiles').update({ naju_id: trimmedUsername }).eq('id', session.user.id).single();
            if (updateError) {
                 if (updateError.message.includes('duplicate key value violates unique constraint') && updateError.message.includes('naju_id')) { throw new Error(`Username "${trimmedUsername}" is already taken.`); }
                 throw updateError;
            }
            setProfile(prev => prev ? { ...prev, naju_id: trimmedUsername } : null);
            setIsEditingUsername(false);
        } catch (err: any) {
            console.error("Error saving username:", err);
            setError(`Failed to save username: ${err.message}`);
        } finally {
            setSavingUsername(false);
        }
    };

    // --- Main JSX (Loading/Error/No Session states) ( မပြောင်းပါ ) ---
    if (loading) { return (<div className="flex min-h-[calc(100vh-200px)] items-center justify-center text-text-dark-primary"><Loader className="animate-spin mr-2" size={24} /> Loading Account...</div>); }
    if (error && !(savingUsername && error.includes('already taken'))) { return ( <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-red-400 text-center px-4"> <AlertTriangle className="mb-2" size={32} /> <p className="font-semibold">Failed to Load Account Details</p> <p className="text-sm text-gray-400 mt-1 mb-4">{error}</p> <button onClick={() => checkSessionAndSetup(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white"> Try Again </button> </div> ); }
    if (!session || !session.user) { return (<div className="flex flex-col items-center justify-center text-center pt-20 text-white"><h1 className="text-3xl font-bold mb-4">Please Log In</h1><p className="text-gray-300 mb-8">You need to be logged in to view your account.</p><p className="text-gray-400">Use the Login button in the sidebar.</p></div>); }
     if (!profile) { return ( <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-yellow-400 text-center px-4"> <AlertTriangle className="mb-2" size={32} /> <p className="font-semibold">Account Profile Not Found</p> <p className='text-sm text-gray-400 mt-2'>We couldn't find your profile details. This might be a temporary issue or your profile setup might be incomplete.</p> <button onClick={() => checkSessionAndSetup(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white mr-2"> Retry Loading </button> <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold text-white"> Log Out </button> </div> ); }

    const isSubscribed = profile.subscription_status === 'active' && profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;

    // --- Main JSX (Tab Navigation & Content) (aria-label ထည့်ထား) ---
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-text-dark-primary">
            {/* Tab Navigation */}
            <div className="mb-8 border-b border-border-color">
                 <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                     <button aria-label="Profile Tab" onClick={() => setActiveTab('profile')} className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ activeTab === 'profile' ? 'border-accent-green text-accent-green' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' }`}><UserIcon size={16} /> Profile</button>
                     <button aria-label="Anime List Tab" onClick={() => setActiveTab('anime_list')} className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ activeTab === 'anime_list' ? 'border-accent-green text-accent-green' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' }`}><ListVideo size={16} /> Anime List</button>
                      <button aria-label="Favorites Tab" onClick={() => setActiveTab('favorites')} className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ activeTab === 'favorites' ? 'border-accent-green text-accent-green' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' }`}><Heart size={16} /> Favorites</button>
                     <button aria-label="Settings Tab" onClick={() => setActiveTab('settings')} className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ activeTab === 'settings' ? 'border-accent-purple text-accent-purple' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' }`}><Settings size={16} /> Settings</button>
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
                            profileStats={profileStats}
                        />
                    }
                    {activeTab === 'anime_list' && <AnimeListTabContent key="anime_list" animeList={animeList} />}
                    {activeTab === 'favorites' && <FavoritesTabContent key="favorites" favoriteList={favoriteAnimeList} />}
                    {activeTab === 'settings' &&
                        <SettingsTabContent
                            key="settings"
                            profile={profile}
                            userEmail={session?.user?.email}
                            receipts={receipts}
                            deletingReceipt={deletingReceipt}
                            handleDeleteReceipt={handleDeleteReceipt}
                            isEditingBio={isEditingBio} setIsEditingBio={setIsEditingBio} editingBioText={editingBioText} setEditingBioText={setEditingBioText} handleSaveBio={handleSaveBio} savingBio={savingBio}
                            isEditingUsername={isEditingUsername} setIsEditingUsername={setIsEditingUsername} editingUsernameText={editingUsernameText} setEditingUsernameText={setEditingUsernameText} handleSaveUsername={handleSaveUsername} savingUsername={savingUsername}
                        />
                    }
                </AnimatePresence>
            </div>
            {/* Error Displays */}
            {error && !(activeTab === 'settings' && savingUsername && error.includes('already taken')) && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-4 right-4 max-w-sm bg-red-800 text-white p-4 rounded-lg shadow-lg flex items-start gap-3 z-50">
                     <AlertTriangle size={20} className="mt-0.5 shrink-0"/> <div> <p className="font-semibold text-sm">Error</p> <p className="text-xs">{error}</p> </div>
                     <button onClick={() => setError(null)} className="ml-auto text-red-200 hover:text-white"><XCircle size={16}/></button>
                 </motion.div>
            )}
             {activeTab === 'settings' && error && savingUsername && error.includes('already taken') && (
                 <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="fixed bottom-4 right-4 max-w-sm bg-red-800 text-white p-4 rounded-lg shadow-lg flex items-start gap-3 z-50">
                      <AlertTriangle size={20} className="mt-0.5 shrink-0"/> <div> <p className="font-semibold text-sm">Error Updating Username</p> <p className="text-xs">{error}</p> </div>
                     <button onClick={() => setError(null)} className="ml-auto text-red-200 hover:text-white"><XCircle size={16}/></button>
                 </motion.div>
             )}
        </div>
    );
}