// src/components/CharacterFavoriteButton.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Heart, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

type Props = {
  characterId: string;
  userId: string;
  initialIsFavorited: boolean;
};

export default function CharacterFavoriteButton({
  characterId,
  userId,
  initialIsFavorited,
}: Props) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);

  // Prop ပြောင်းသွားရင် state ကို update လုပ်ပါ
  useEffect(() => {
    setIsFavorited(initialIsFavorited);
  }, [initialIsFavorited, userId, characterId]);

  const toggleFavorite = useCallback(async () => {
    if (!userId || isLoading) return;

    setIsLoading(true);
    const currentlyFavorited = isFavorited;

    // Optimistic UI update
    setIsFavorited(!currentlyFavorited);

    try {
      if (!currentlyFavorited) {
        // Favorite ထဲ ထည့်ခြင်း (Insert)
        const { error } = await supabase.from('user_favorites').insert({
          user_id: userId,
          item_id: characterId,
          item_type: 'character', // <-- အဓိက ကွာခြားချက်
        });
        if (error) throw error;
      } else {
        // Favorite ထဲက ဖျက်ခြင်း (Delete)
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .match({ user_id: userId, item_id: characterId, item_type: 'character' }); // <-- အဓိက ကွာခြားချက်
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error toggling character favorite:', error);
      alert(`Error updating favorite status: ${error.message}`);
      // Error ဖြစ်ရင် UI ကို မူလ အခြေအနေ ပြန်ပြောင်း
      setIsFavorited(currentlyFavorited);
    } finally {
      setIsLoading(false);
    }
  }, [characterId, userId, isFavorited, isLoading]);

  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault(); // Link ကို မနှိပ်မိအောင် တား
        e.stopPropagation();
        toggleFavorite();
      }}
      disabled={isLoading}
      className={`absolute top-2 right-2 z-10 p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-60 disabled:cursor-not-allowed ${
        isFavorited
          ? 'bg-red-600/50 text-red-400 hover:bg-red-600/70 focus:ring-red-500' // Favorited state
          : 'bg-gray-900/50 text-gray-300 hover:bg-gray-700/70 focus:ring-gray-400' // Not favorited state
      }`}
      whileTap={{ scale: 0.9 }}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isLoading ? (
        <Loader size={16} className="animate-spin" />
      ) : (
        <Heart
          size={16}
          className={`transition-all duration-200 ${
            isFavorited ? 'fill-current text-red-500' : 'text-gray-400'
          }`}
        />
      )}
    </motion.button>
  );
}