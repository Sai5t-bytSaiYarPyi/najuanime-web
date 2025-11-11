// src/app/my-account/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, AlertTriangle, User as UserIcon, ListVideo, Settings, Heart, XCircle } from 'lucide-react';
import ProfileTabContent from './components/ProfileTabContent';
import AnimeListTabContent from './components/AnimeListTabContent';
import FavoritesTabContent from './components/FavoritesTabContent';
import SettingsTabContent from './components/SettingsTabContent';
import { Profile, Receipt, UserAnimeListItem, FavoriteAnimeItem, FavoriteCharacterItem, Tab, ProfileStatsData, GenreStat, RatingStat, AnimeSeriesData, CharacterInfo } from './my-account.types';

// --- Main Component ---
export default function MyAccountPage() {
    console.log("[MyAccountPage] Component rendering...");
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [animeList, setAnimeList] = useState<UserAnimeListItem[]>([]);
    const [favoriteAnimeList, setFavoriteAnimeList] = useState<FavoriteAnimeItem[]>([]);
    const [favoriteCharacterList, setFavoriteCharacterList] = useState<FavoriteCharacterItem[]>([]);
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
    const [genreStats, setGenreStats] = useState<GenreStat[] | null>(null);
    const [ratingStats, setRatingStats] = useState<RatingStat[] | null>(null);
    const [deletingReceipt, setDeletingReceipt] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // --- START: Accent Color & Delete Account အတွက် State အသစ်များ ---
    const [accentColor, setAccentColor] = useState('#39FF14'); // Default Green
    const [savingAccent, setSavingAccent] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);
    // --- END: Accent Color & Delete Account အတွက် State အသစ်များ ---


    // --- START: Accent Color ကို CSS Variable အဖြစ် သတ်မှတ်မယ့် useEffect ---
    useEffect(() => {
        // profile ကနေ accentColor ကို ယူပြီး state ထဲ ထည့်၊ CSS variable ကို set လုပ်
        const savedColor = profile?.preferences?.accentColor;
        const colorToApply = savedColor || '#39FF14'; // Default green
        
        setAccentColor(colorToApply);
        
        // CSS Custom Property (Variable) ကို root (<html>) မှာ သတ်မှတ်
        document.documentElement.style.setProperty('--accent-color', colorToApply);
        console.log(`[MyAccountPage] Accent Color applied: ${colorToApply}`);

    }, [profile?.preferences?.accentColor]); // profile.preferences.accentColor ပြောင်းမှသာ run ပါမယ်
    // --- END: Accent Color ကို CSS Variable အဖြစ် သတ်မှတ်မယ့် useEffect ---


    // --- setupUser function (မပြောင်းပါ) ---
    const setupUser = useCallback(async (user: User) => {
        console.log("[MyAccountPage] setupUser: Starting data fetch for user:", user.id);
        setError(null);
        setProfile(null); setReceipts([]); setAnimeList([]); setFavoriteAnimeList([]); setFavoriteCharacterList([]); setProfileStats(null); setGenreStats(null); setRatingStats(null);
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
            if (!fetchedProfile) {
                console.log('[MyAccountPage] setupUser: No profile found. Creating default profile (DB defaults for naju_id)...');
                const { data, error } = await supabase
                    .from('profiles')
                    .insert({ id: user.id, preferences: { theme: 'dark', accentColor: '#39FF14' } }) // Default accent color ထည့်သိမ်း
                    .select('id, naju_id, subscription_expires_at, subscription_status, avatar_url, banner_url, bio, preferences')
                    .single();
                if (error) {
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
            const [receiptsResponse, animeListResponse, statsResponse, favoritesAnimeResponse, genreStatsResponse, ratingStatsResponse, favoriteCharIdsResponse] = await Promise.all([
                supabase.from('payment_receipts').select('id, created_at, receipt_url, status').eq('user_id', user.id).order('created_at', { ascending: false }),
                supabase.from('user_anime_list').select('status, rating, anime_series (id, poster_url, title_english, title_romaji)').eq('user_id', user.id).order('updated_at', { ascending: false }),
                supabase.rpc('get_user_profile_stats', { p_user_id: user.id }),
                supabase.from('user_favorites').select('anime_series (id, poster_url, title_english, title_romaji)').eq('user_id', user.id).eq('item_type', 'anime').order('created_at', { ascending: false }),
                supabase.rpc('get_user_genre_stats', { p_user_id: user.id }),
                supabase.rpc('get_user_rating_stats', { p_user_id: user.id }),
                supabase.from('user_favorites').select('item_id').eq('user_id', user.id).eq('item_type', 'character').order('created_at', { ascending: false })
            ]);
            if (receiptsResponse.error) { throw new Error(`Receipts fetch failed: ${receiptsResponse.error.message}`); }
            if (animeListResponse.error) { throw new Error(`Anime list fetch failed: ${animeListResponse.error.message}`); }
            if (statsResponse.error) { throw new Error(`Stats fetch failed: ${statsResponse.error.message}`); }
            if (favoritesAnimeResponse.error) { throw new Error(`Favorite Anime fetch failed: ${favoritesAnimeResponse.error.message}`); }
            if (genreStatsResponse.error) { throw new Error(`Genre Stats fetch failed: ${genreStatsResponse.error.message}`); }
            if (ratingStatsResponse.error) { throw new Error(`Rating Stats fetch failed: ${ratingStatsResponse.error.message}`); }
            if (favoriteCharIdsResponse.error) { throw new Error(`Favorite Character IDs fetch failed: ${favoriteCharIdsResponse.error.message}`); }
            console.log("[MyAccountPage] setupUser: All fetches successful.");
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
            setGenreStats(genreStatsResponse.data || []);
            setRatingStats(ratingStatsResponse.data || []);
            const fetchedAnimeFavorites = favoritesAnimeResponse.data;
            if (fetchedAnimeFavorites && Array.isArray(fetchedAnimeFavorites)) {
                setFavoriteAnimeList(fetchedAnimeFavorites.filter(fav => fav.anime_series) as unknown as FavoriteAnimeItem[]);
            } else { setFavoriteAnimeList([]); }
            const fetchedCharFavoriteIds = favoriteCharIdsResponse.data || [];
            if (fetchedCharFavoriteIds.length > 0) {
                const charIds = fetchedCharFavoriteIds.map(fav => fav.item_id);
                const { data: charactersData, error: charactersError } = await supabase
                    .from('characters')
                    .select('id, name, image_url')
                    .in('id', charIds);
                if (charactersError) {
                    throw new Error(`Favorite Characters data fetch failed: ${charactersError.message}`);
                }
                const formattedCharList = charactersData.map(char => ({
                    characters: char as CharacterInfo
                }));
                setFavoriteCharacterList(formattedCharList as FavoriteCharacterItem[]);
            } else {
                setFavoriteCharacterList([]);
            }
            console.log("[MyAccountPage] setupUser: Data fetch complete, state updated.");
            return true;
        } catch (err: any) {
            console.error("[MyAccountPage] setupUser: Catch block error:", err);
            setError(`Could not load account details: ${err.message}.`);
            setProfile(null); setReceipts([]); setAnimeList([]); setFavoriteAnimeList([]); setFavoriteCharacterList([]); setProfileStats(null); setGenreStats(null); setRatingStats(null);
            return false;
        }
    }, []);

    // --- checkSessionAndSetup function (မပြောင်းပါ) ---
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
                setProfile(null); setReceipts([]); setAnimeList([]); setFavoriteAnimeList([]); setFavoriteCharacterList([]); setProfileStats(null); setGenreStats(null); setRatingStats(null);
            }
        } catch (err: any) {
            console.error("[MyAccountPage] checkSessionAndSetup: Catch block Error:", err);
            setError(err.message || "An unexpected error occurred.");
            setProfile(null); setReceipts([]); setAnimeList([]); setFavoriteAnimeList([]); setFavoriteCharacterList([]); setProfileStats(null); setGenreStats(null); setRatingStats(null);
        } finally {
            console.log("[MyAccountPage] checkSessionAndSetup: Finally block executed. Setting loading=false");
            setLoading(false);
        }
    }, [setupUser]);

    // --- useEffect (auth listener) (မပြောင်းပါ) ---
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

    // --- handleDeleteReceipt, handleImageUpload, handleSaveBio, handleSaveUsername (မပြောင်းပါ) ---
     const handleDeleteReceipt = async (receiptId: string, receiptPath: string | null) => {
         if (!receiptPath) { alert("Cannot delete receipt: Path is missing."); return; }
        if (window.confirm("Are you sure you want to delete this receipt submission?")) {
             setDeletingReceipt(true);
             try {
                const { error: storageError } = await supabase.storage.from('receipts').remove([receiptPath]);
                if (storageError) { throw new Error(`Storage deletion failed: ${storageError.message}`); }
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
         const fileName = `${session.user.id}.${fileExt}`; 
         const filePath = `${session.user.id}/${fileName}`; 
         setLoadingState(true);
         try {
             const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true, cacheControl: '3600' });
             if (uploadError) { throw uploadError; }
             const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
             const publicURL = `${urlData.publicUrl}?t=${new Date().getTime()}`; 
             const updateField = bucket === 'avatars' ? 'avatar_url' : 'banner_url';
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

    // --- START: Accent Color & Delete Account အတွက် Function အသစ်များ ---
    const handleSaveAccent = async () => {
        if (!profile?.id || savingAccent) return;
        setSavingAccent(true);
        setError(null);
        try {
            // preferences JSON object ကို update လုပ်
            const prefs = { ...(profile.preferences || {}), accentColor: accentColor };
            const { error } = await supabase.from('profiles').update({ preferences: prefs }).eq('id', profile.id);
            if (error) throw error;
            
            // Profile state ကိုပါ update လုပ်
            setProfile(prev => prev ? { ...prev, preferences: prefs } : null);
            // CSS variable ကို (useEffect က) auto update လုပ်သွားပါလိမ့်မယ်
            
        } catch (e: any) {
            console.error('Save accent failed', e);
            setError(`Failed to save accent color: ${e.message}`);
        } finally {
            setSavingAccent(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!profile?.id || deletingAccount) return;
        // User က ရိုက်ထည့်တဲ့ text နဲ့ profile.naju_id တူမှ delete လုပ်
        if (!deleteConfirmText || deleteConfirmText !== (profile.naju_id || '')) {
            setError('Username confirmation does not match.');
            return;
        }
        setDeletingAccount(true);
        setError(null);
        try {
            // ဒါက "Soft Delete" ပါ။ User data ကို ဝှက်လိုက်တာမျိုး (Anonymize)
            // တကယ်ဖျက်ချင်ရင် Admin API နဲ့ auth.admin.deleteUser() ကို Edge Function ထဲမှာ ခေါ်ရပါမယ်။
            // လောလောဆယ် Soft Delete လုပ်ပါမယ်။
            const anonHandle = `${profile.naju_id}-deleted-${Date.now()}`;
            const { error } = await supabase.from('profiles').update({
                avatar_url: null,
                banner_url: null,
                bio: null,
                naju_id: anonHandle, // Username ကို ပြောင်းလိုက်
                preferences: { ...(profile.preferences || {}), accentColor: null },
            }).eq('id', profile.id);

            if (error) throw error;

            // Anonymize လုပ်ပြီးတာနဲ့ user ကို sign out လုပ်
            await supabase.auth.signOut();
            // Homepage ကို ပြန်ပို့
            window.location.href = '/'; 

        } catch (e: any) {
            console.error('Delete account failed', e);
            setError(`Failed to delete account: ${e.message}`);
            setDeletingAccount(false); // Error ဖြစ်ရင် မဖျက်သေးလို့ false ပြန်ထား
        }
        // အောင်မြင်ရင် page redirect ဖြစ်သွားလို့ loading state ကို false ပြန်လုပ်စရာမလို
    };
    // --- END: Accent Color & Delete Account အတွက် Function အသစ်များ ---


    // --- Main JSX (Loading/Error/No Session states) ---
    if (loading) { return (<div className="flex min-h-[calc(100vh-200px)] items-center justify-center text-text-dark-primary"><Loader className="animate-spin mr-2" size={24} /> Loading Account...</div>); }
    if (error && !(savingUsername && error.includes('already taken'))) { 
        return ( 
            <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-red-400 text-center px-4"> 
                <AlertTriangle className="mb-2" size={32} /> 
                <p className="font-semibold">Failed to Load Account Details</p> 
                <p className="text-sm text-gray-400 mt-1 mb-4">{error}</p> 
                <button 
                    onClick={() => checkSessionAndSetup(true)} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white"> 
                    Try Again 
                </button> 
            </div> 
        ); 
    }
    if (!session || !session.user) { return (<div className="flex flex-col items-center justify-center text-center pt-20 text-white"><h1 className="text-3xl font-bold mb-4">Please Log In</h1><p className="text-gray-300 mb-8">You need to be logged in to view your account.</p><p className="text-gray-400">Use the Login button in the sidebar.</p></div>); }
     if (!profile) { return ( <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-yellow-400 text-center px-4"> <AlertTriangle className="mb-2" size={32} /> <p className="font-semibold">Account Profile Not Found</p> <p className='text-sm text-gray-400 mt-2'>We couldn't find your profile details. This might be a temporary issue or your profile setup might be incomplete.</p> <button onClick={() => checkSessionAndSetup(true)} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white mr-2"> Retry Loading </button> <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-semibold text-white"> Log Out </button> </div> ); }

    const isSubscribed = profile.subscription_status === 'active' && profile.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;

    // --- Main JSX (Tab Navigation & Content) ---
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-text-dark-primary">
            {/* Tab Navigation */}
            <div className="mb-8 border-b border-border-color">
                 <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                    {/* --- START: Tab အရောင်တွေကို accentColor state ကို သုံးပြီး ပြောင်းလဲပါ --- */}
                     <button 
                        aria-label="Profile Tab" 
                        onClick={() => setActiveTab('profile')} 
                        className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ 
                            activeTab === 'profile' ? 'border-current' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' 
                        }`}
                        style={activeTab === 'profile' ? { color: accentColor, borderColor: accentColor } : {}}
                    >
                        <UserIcon size={16} /> Profile
                    </button>
                     <button 
                        aria-label="Anime List Tab" 
                        onClick={() => setActiveTab('anime_list')} 
                        className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ 
                            activeTab === 'anime_list' ? 'border-current' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' 
                        }`}
                        style={activeTab === 'anime_list' ? { color: accentColor, borderColor: accentColor } : {}}
                    >
                        <ListVideo size={16} /> Anime List
                    </button>
                      <button 
                        aria-label="Favorites Tab" 
                        onClick={() => setActiveTab('favorites')} 
                        className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ 
                            activeTab === 'favorites' ? 'border-current' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' 
                        }`}
                        style={activeTab === 'favorites' ? { color: accentColor, borderColor: accentColor } : {}}
                    >
                        <Heart size={16} /> Favorites
                    </button>
                    {/* Settings Tab ကိုတော့ accent-purple ကိုပဲ ဆက်သုံးပါမယ် (ကွဲပြားအောင်) */}
                     <button 
                        aria-label="Settings Tab" 
                        onClick={() => setActiveTab('settings')} 
                        className={`whitespace-nowrap pb-3 pt-1 px-1 border-b-2 font-medium text-sm transition-colors duration-150 flex items-center gap-1.5 ${ 
                            activeTab === 'settings' ? 'border-accent-purple text-accent-purple' : 'border-transparent text-text-dark-secondary hover:text-text-dark-primary hover:border-gray-500' 
                        }`}
                    >
                        <Settings size={16} /> Settings
                    </button>
                    {/* --- END: Tab အရောင်တွေကို accentColor state ကို သုံးပြီး ပြောင်းလဲပါ --- */}
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
                            genreStats={genreStats}
                            ratingStats={ratingStats}
                        />
                    }
                    {activeTab === 'anime_list' && <AnimeListTabContent key="anime_list" animeList={animeList} />}
                    {activeTab === 'favorites' && <FavoritesTabContent key="favorites" favoriteAnimeList={favoriteAnimeList} favoriteCharacterList={favoriteCharacterList} />}
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
                            
                            // --- START: Props အသစ်များ ပို့ပေးခြင်း ---
                            accentColor={accentColor}
                            setAccentColor={setAccentColor}
                            savingAccent={savingAccent}
                            handleSaveAccent={handleSaveAccent}
                            deleteConfirmOpen={deleteConfirmOpen}
                            setDeleteConfirmOpen={setDeleteConfirmOpen}
                            deleteConfirmText={deleteConfirmText}
                            setDeleteConfirmText={setDeleteConfirmText}
                            deletingAccount={deletingAccount}
                            handleDeleteAccount={handleDeleteAccount}
                            // --- END: Props အသစ်များ ပို့ပေးခြင်း ---
                        />
                    }
                </AnimatePresence>
            </div>
            {/* Error Displays (မပြောင်းပါ) */}
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