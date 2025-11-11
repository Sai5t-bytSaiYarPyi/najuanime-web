'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { UserAnimeListItem } from '../my-account.types';

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

export default AnimeListTabContent;
