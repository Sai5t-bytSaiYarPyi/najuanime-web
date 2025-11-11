// src/app/my-account/my-account.types.ts

export type ProfilePreferences = { theme?: 'light' | 'dark'; accentColor?: string | null };
export type Profile = {
  id: string;
  naju_id: string;
  subscription_expires_at: string | null;
  subscription_status: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  preferences: ProfilePreferences | null;
};
export type Receipt = { id: string; created_at: string; receipt_url: string; status: 'pending' | 'approved' | 'rejected' };
export type AnimeSeriesData = {
  id: string;
  poster_url: string | null;
  title_english: string | null;
  title_romaji: string | null;
} | null;
export type CharacterInfo = {
  id: string;
  name: string;
  image_url: string | null;
} | null;
export type FavoriteAnimeItem = { anime_series: AnimeSeriesData };
export type FavoriteCharacterItem = { characters: CharacterInfo };
export type UserAnimeListItem = { status: string; rating: number | null; anime_series: AnimeSeriesData };
export type Tab = 'profile' | 'anime_list' | 'favorites' | 'settings';
export type ProfileStatsData = { completed_count: number; mean_score: number; total_episodes?: number; days_watched?: number } | null;
export type GenreStat = { genre_name: string; count: number };
export type RatingStat = { rating_value: number; count: number };

// --- START: SettingsTabContentProps ကို မွမ်းမံခြင်း ---
export type SettingsTabContentProps = {
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
  
  // --- Accent Color အတွက် Props အသစ်များ ---
  accentColor: string;
  setAccentColor: (color: string) => void;
  savingAccent: boolean;
  handleSaveAccent: () => void;
  
  // --- Delete Account အတွက် Props အသစ်များ ---
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (isOpen: boolean) => void;
  deleteConfirmText: string;
  setDeleteConfirmText: (text: string) => void;
  deletingAccount: boolean;
  handleDeleteAccount: () => void;
};
// --- END: SettingsTabContentProps ကို မွမ်းမံခြင်း ---

export type FavoritesTabContentProps = {
  favoriteAnimeList: FavoriteAnimeItem[];
  favoriteCharacterList: FavoriteCharacterItem[];
};