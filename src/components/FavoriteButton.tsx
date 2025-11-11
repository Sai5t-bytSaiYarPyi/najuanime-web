// src/components/FavoriteButton.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Heart, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

type Props = {
  animeId: string;
  userId: string;
  initialIsFavorited: boolean;
};

export default function FavoriteButton({ animeId, userId, initialIsFavorited }: Props) {
  // --- START: ပြင်ဆင်မှု (State များကို ပြင်ဆင်ခြင်း) ---
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited); // Optimistic state
  const [isLoading, setIsLoading] = useState(false); // Update လုပ်နေစဉ် (အရင်က နာမည်)
  const [isChecking, setIsChecking] = useState(true); // Component ပွင့်ပွင့်ချင်း DB ကို စစ်နေစဉ်
  // --- END: ပြင်ဆင်မှု ---

  // --- START: အသစ်ထည့်သွင်းခြင်း (Client-side state ကို re-validate လုပ်ရန်) ---
  // Server က ပေးလိုက်တဲ့ initialIsFavorited က (cache ကြောင့်) မှားနေနိုင်ပါတယ်။
  // Component mount လုပ်တဲ့အခါ client-side ကနေ DB ကို တိုက်ရိုက်ပြန်စစ်ပြီး state ကို မှန်အောင်လုပ်ပါမယ်။
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!userId) {
        setIsChecking(false);
        setIsFavorited(false); // User မရှိရင် favorited မဖြစ်နိုင်
        return;
      }

      setIsChecking(true);
      try {
        const { count, error } = await supabase
          .from('user_favorites')
          .select('id', { count: 'exact', head: true })
          .match({ user_id: userId, item_id: animeId, item_type: 'anime' });
        
        if (error) throw error;
        
        // DB ကနေ ရလာတဲ့ state အမှန်ကို သတ်မှတ်
        setIsFavorited((count ?? 0) > 0);
      } catch (error: any) {
        console.error("Failed to re-check favorite status:", error.message);
        // Error ဖြစ်ခဲ့ရင် Server ပေးလိုက်တဲ့ prop ကိုပဲ (לית) ဆက်သုံး
        setIsFavorited(initialIsFavorited); 
      } finally {
        setIsChecking(false);
      }
    };

    checkFavoriteStatus();
  // userId, animeId, initialIsFavorited တို့ ပြောင်းသွားတိုင်း ပြန်စစ်ပါ
  }, [userId, animeId, initialIsFavorited]);
  // --- END: အသစ်ထည့်သွင်းခြင်း ---


  const toggleFavorite = useCallback(async () => {
    // isChecking ဖြစ်နေတုန်း နှိပ်လို့မရအောင် guard လုပ်ပါ
    if (!userId || isLoading || isChecking) return;

    setIsLoading(true);
    const currentlyFavorited = isFavorited; // လက်ရှိ အခြေအနေကို မှတ်ထား

    // Optimistic UI update: ခလုတ်ကို ချက်ချင်း ပြောင်း
    setIsFavorited(!currentlyFavorited);

    try {
      if (!currentlyFavorited) {
        // Favorite ထဲ ထည့်ခြင်း (Insert)
        const { error } = await supabase.from('user_favorites').insert({
          user_id: userId,
          item_id: animeId,
          item_type: 'anime', // item_type ကို 'anime' လို့ သတ်မှတ်
        });
        
        // --- START: Error handling ကို ပိုကောင်းအောင်ပြင်ပါ ---
        if (error) {
          // duplicate key error (23505) ဆိုရင် state ကို မှန်အောင် ပြန်ပြင်ပေး
          // (UI က false ဖြစ်နေပေမယ့် DB မှာ true ဖြစ်နေလို့ error တက်တာ)
          if (error.code === '23505') { 
            console.warn('FavoriteButton: Duplicate key error. Correcting state to true.');
            setIsFavorited(true); 
          } else {
            throw error; // တခြား error ဆိုရင် catch block ဆီ ပို့
          }
        }
        // --- END: Error handling ကို ပိုကောင်းအောင်ပြင်ပါ ---

      } else {
        // Favorite ထဲက ဖျက်ခြင်း (Delete)
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .match({ user_id: userId, item_id: animeId, item_type: 'anime' });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      // alert(`Error updating favorite status: ${error.message}`); // alert ကို ဖယ်လိုက်ပါ
      // Error ဖြစ်ရင် UI ကို မူလ အခြေအနေ ပြန်ပြောင်း
      setIsFavorited(currentlyFavorited);
    } finally {
      setIsLoading(false);
    }
  }, [animeId, userId, isFavorited, isLoading, isChecking]); // isChecking ကို dependency ထဲ ထည့်

  return (
    <motion.button
      onClick={toggleFavorite}
      // isChecking ဖြစ်နေရင်လည်း disable လုပ်ပါ
      disabled={isLoading || isChecking}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-60 disabled:cursor-not-allowed ${
        isFavorited
          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 focus:ring-red-500' // Favorited state
          : 'bg-gray-600/30 text-gray-300 hover:bg-gray-600/50 focus:ring-gray-400' // Not favorited state
      }`}
      whileTap={{ scale: 0.95 }}
    >
      {/* isLoading (update လုပ်နေတုန်း) or isChecking (စစချင်း စစ်နေတုန်း) ဆိုရင် Loader ပြပါ */}
      {isLoading || isChecking ? (
        <Loader size={16} className="animate-spin" />
      ) : (
        <Heart
          size={16}
          className={`transition-all duration-200 ${isFavorited ? 'fill-current text-red-500' : 'text-gray-400'}`}
        />
      )}
      {/* Loading state အလိုက် စာသားပြောင်းပါ */}
      {isLoading ? 'Updating...' : (isChecking ? 'Checking...' : (isFavorited ? 'Favorited' : 'Add to Favorites'))}
    </motion.button>
  );
}