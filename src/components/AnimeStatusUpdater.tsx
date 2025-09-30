// src/components/AnimeStatusUpdater.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

// Define the status type to match our database ENUM
type Status = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';

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
  user: User | null;
};

export default function AnimeStatusUpdater({ animeId, initialStatus, user }: Props) {
  const [currentStatus, setCurrentStatus] = useState<Status | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  // If the user logs in or out, update the status
  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus, user]);

  const handleStatusUpdate = async (newStatus: Status | null) => {
    if (!user) {
      alert('Please log in to add anime to your list.');
      // Or redirect to login page
      return;
    }

    setIsLoading(true);

    if (newStatus) {
      // Upsert: Create a new record or update an existing one
      const { error } = await supabase.from('user_anime_list').upsert({
        user_id: user.id,
        anime_id: animeId,
        status: newStatus,
      });

      if (error) {
        alert(`Error updating status: ${error.message}`);
      } else {
        setCurrentStatus(newStatus);
      }
    } else {
      // Remove from list
      const { error } = await supabase.from('user_anime_list').delete().match({
        user_id: user.id,
        anime_id: animeId,
      });

      if (error) {
        alert(`Error removing from list: ${error.message}`);
      } else {
        setCurrentStatus(null);
      }
    }

    setIsLoading(false);
  };

  if (!user) {
    return (
        <div className="bg-card-dark p-4 rounded-lg text-center">
            <p className="text-gray-300">Log in to track this anime.</p>
        </div>
    );
  }

  return (
    <div className="bg-card-dark p-4 rounded-lg">
      <h3 className="text-lg font-bold mb-3 text-white">My List Status</h3>
      {isLoading ? (
        <div className="text-center text-gray-400">Saving...</div>
      ) : (
        <div className="flex flex-col gap-2">
          <select 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
            value={currentStatus || 'none'}
            onChange={(e) => handleStatusUpdate(e.target.value as Status)}
          >
            <option value="none" disabled>Add to list...</option>
            {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {currentStatus && (
            <button 
              onClick={() => handleStatusUpdate(null)} 
              className="w-full text-center text-sm text-red-400 hover:text-red-300 mt-2"
            >
              Remove from list
            </button>
          )}
        </div>
      )}
    </div>
  );
}