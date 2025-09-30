// src/components/AnimeStatusUpdater.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useDebouncedCallback } from 'use-debounce';

type Status = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';

// --- START: NEW TYPE FOR UPSERT PAYLOAD ---
type UpsertPayload = {
  user_id: string;
  anime_id: string;
  status?: Status | null;
  rating?: number | null;
};
// --- END: NEW TYPE FOR UPSERT PAYLOAD ---

const statusOptions: { value: Status; label: string }[] = [
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'plan_to_watch', label: 'Plan to Watch' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'dropped', label: 'Dropped' },
];

type Props = {
  animeId: string;
  initialStatus: Status | null;
  initialRating: number | null;
  user: User | null;
};

export default function AnimeStatusUpdater({ animeId, initialStatus, initialRating, user }: Props) {
  const [currentStatus, setCurrentStatus] = useState<Status | null>(initialStatus);
  const [currentRating, setCurrentRating] = useState<number | null>(initialRating);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentStatus(initialStatus);
    setCurrentRating(initialRating);
  }, [initialStatus, initialRating, user]);

  const debouncedUpdate = useDebouncedCallback(async ({ status, rating }: { status?: Status | null, rating?: number | null }) => {
    if (!user) return;
    setIsLoading(true);

    // --- START: TYPE FIX ---
    const dataToUpsert: UpsertPayload = {
      user_id: user.id,
      anime_id: animeId,
    };
    // --- END: TYPE FIX ---

    if (status !== undefined) dataToUpsert.status = status;
    if (rating !== undefined) dataToUpsert.rating = rating;

    const { error } = await supabase.from('user_anime_list').upsert(dataToUpsert);

    if (error) {
      alert(`Error updating list: ${error.message}`);
    }
    setIsLoading(false);
  }, 1000);

  const handleStatusChange = (newStatus: Status) => {
    setCurrentStatus(newStatus);
    debouncedUpdate({ status: newStatus, rating: currentRating === undefined ? null : currentRating });
  };
  
  const handleRatingChange = (newRating: number | null) => {
    if (currentStatus) {
      setCurrentRating(newRating);
      debouncedUpdate({ rating: newRating });
    } else {
      alert("Please add the anime to your list before rating it.");
    }
  };

  const handleRemoveFromList = async () => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase.from('user_anime_list').delete().match({ user_id: user.id, anime_id: animeId });
    if (error) {
      alert(`Error removing from list: ${error.message}`);
    } else {
      setCurrentStatus(null);
      setCurrentRating(null);
    }
    setIsLoading(false);
  };

  if (!user) {
    return (
        <div className="bg-card-dark p-4 rounded-lg text-center">
            <p className="text-gray-300">Log in to track and rate this anime.</p>
        </div>
    );
  }

  return (
    <div className="bg-card-dark p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-3 text-white">My List Status</h3>
      <div className="flex flex-col gap-4">
        <select 
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
          value={currentStatus || 'none'}
          onChange={(e) => handleStatusChange(e.target.value as Status)}
        >
          <option value="none" disabled>Add to list...</option>
          {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        {currentStatus && (
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="rating" className="text-sm font-medium text-gray-300">Your Rating:</label>
            <select
                id="rating"
                className="p-2 rounded bg-gray-700 border border-gray-600 text-white"
                value={currentRating || 'none'}
                onChange={(e) => handleRatingChange(e.target.value === 'none' ? null : Number(e.target.value))}
            >
                <option value="none">(No rating)</option>
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(score => (
                    <option key={score} value={score}>{score}</option>
                ))}
            </select>
          </div>
        )}
      </div>

      {currentStatus && (
        <button 
          onClick={handleRemoveFromList} 
          className="w-full text-center text-sm text-red-400 hover:text-red-300 mt-4"
        >
          Remove from list
        </button>
      )}
      {isLoading && <div className="text-center text-xs text-gray-400 mt-2 animate-pulse">Saving...</div>}
    </div>
  );
}