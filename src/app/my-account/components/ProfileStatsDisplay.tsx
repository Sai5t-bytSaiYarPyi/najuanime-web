'use client';

import React from 'react';
import { BarChart2, CheckCircle, Star } from 'lucide-react';
import GenreDonutChart from '@/components/charts/GenreDonutChart';
import RatingBarChart from '@/components/charts/RatingBarChart';
import { ProfileStatsData, GenreStat, RatingStat } from '../my-account.types';

const ProfileStatsDisplay = ({
  stats,
  genreStats,
  ratingStats,
}: {
  stats: ProfileStatsData;
  genreStats: GenreStat[] | null;
  ratingStats: RatingStat[] | null;
}) => {
  if (!stats) {
    return (
      <div className="bg-card-dark p-4 rounded-lg shadow-md text-text-dark-secondary text-sm">
        Loading stats...
      </div>
    );
  }
  return (
    <div className="bg-card-dark p-4 rounded-lg shadow-md">
      <h3 className="font-semibold text-text-dark-primary mb-3 flex items-center gap-2">
        <BarChart2 size={16} /> Statistics
      </h3>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-accent-green">
            {stats.completed_count ?? 0}
          </p>
          <p className="text-xs text-text-dark-secondary uppercase flex items-center justify-center gap-1">
            <CheckCircle size={12} /> Anime Completed
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-400">
            {stats.mean_score?.toFixed(2) ?? 'N/A'}
          </p>
          <p className="text-xs text-text-dark-secondary uppercase flex items-center justify-center gap-1">
            <Star size={12} /> Mean Score
          </p>
        </div>
        {stats.total_episodes !== undefined && (
          <div>
            <p className="text-2xl font-bold text-accent-blue">
              {stats.total_episodes ?? 0}
            </p>
            <p className="text-xs text-text-dark-secondary uppercase">
              Episodes Watched
            </p>
          </div>
        )}
        {stats.days_watched !== undefined && (
          <div>
            <p className="text-2xl font-bold text-accent-purple">
              {stats.days_watched?.toFixed(1) ?? 0}
            </p>
            <p className="text-xs text-text-dark-secondary uppercase">
              Days Watched
            </p>
          </div>
        )}
      </div>

      {/* --- Genre Chart Section --- */}
      <div className="mt-4 pt-4 border-t border-border-color">
        <h4 className="font-semibold text-text-dark-primary text-center mb-1">
          Top Genres
        </h4>
        <GenreDonutChart data={genreStats} />
      </div>

      {/* --- Rating Chart Section --- */}
      <div className="mt-4 pt-4 border-t border-border-color">
        <h4 className="font-semibold text-text-dark-primary text-center mb-1">
          Score Distribution
        </h4>
        <RatingBarChart data={ratingStats} />
      </div>
    </div>
  );
};

export default ProfileStatsDisplay;
