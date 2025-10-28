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
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);

  // Prop ပြောင်းသွားရင် state ကို update လုပ်ပါ (ဥပမာ- user logout/login)
  useEffect(() => {
    setIsFavorited(initialIsFavorited);
  }, [initialIsFavorited, userId]);

  const toggleFavorite = useCallback(async () => {
    if (!userId || isLoading) return;

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
        if (error) throw error;
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
      alert(`Error updating favorite status: ${error.message}`);
      // Error ဖြစ်ရင် UI ကို မူလ အခြေအနေ ပြန်ပြောင်း
      setIsFavorited(currentlyFavorited);
    } finally {
      setIsLoading(false);
    }
  }, [animeId, userId, isFavorited, isLoading]);

  return (
    <motion.button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-60 disabled:cursor-not-allowed ${
        isFavorited
          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 focus:ring-red-500' // Favorited state
          : 'bg-gray-600/30 text-gray-300 hover:bg-gray-600/50 focus:ring-gray-400' // Not favorited state
      }`}
      whileTap={{ scale: 0.95 }}
    >
      {isLoading ? (
        <Loader size={16} className="animate-spin" />
      ) : (
        <Heart
          size={16}
          className={`transition-all duration-200 ${isFavorited ? 'fill-current text-red-500' : 'text-gray-400'}`}
        />
      )}
      {isLoading ? 'Updating...' : isFavorited ? 'Favorited' : 'Add to Favorites'}
    </motion.button>
  );
}