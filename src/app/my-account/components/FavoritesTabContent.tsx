'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { FavoriteAnimeItem, FavoriteCharacterItem, FavoritesTabContentProps as FTProps } from '../my-account.types';

const FavoritesTabContent = ({
  favoriteAnimeList,
  favoriteCharacterList,
}: FTProps) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    {/* --- Favorite Anime Section (ယခင်အတိုင်း) --- */}
    <h2 className="text-2xl font-bold text-text-dark-primary mb-6">
      Favorite Anime
    </h2>
    {favoriteAnimeList.length > 0 ? (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-4 gap-y-6">
        {favoriteAnimeList.map((item: FavoriteAnimeItem) => {
          const anime = item.anime_series;
          if (!anime) return null;
          return (
            <Link
              href={`/anime/${anime.id}`}
              key={anime.id}
              className="group relative transition-transform duration-200 ease-in-out hover:-translate-y-1"
            >
              <div className="aspect-[2/3] relative rounded-md overflow-hidden shadow-lg border border-transparent group-hover:border-accent-green bg-gray-800">
                <Image
                  src={anime.poster_url || '/placeholder.png'}
                  alt={anime.title_english || anime.title_romaji || 'Poster'}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                />
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
        <p className="text-text-dark-secondary">
          You haven't added any favorite anime yet.
        </p>
        <Link
          href="/anime"
          className="mt-4 inline-block px-4 py-2 bg-accent-blue hover:bg-blue-700 rounded-md text-sm font-semibold text-white"
        >
          Browse Anime
        </Link>
      </div>
    )}

    {/* --- Favorite Characters Section (အသစ်) --- */}
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-text-dark-primary mb-6">
        Favorite Characters
      </h2>
      {favoriteCharacterList.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-4 gap-y-6">
          {favoriteCharacterList.map((item: FavoriteCharacterItem) => {
            const char = item.characters;
            if (!char) return null;
            return (
              // Character တွေက detail page မရှိသေးလို့ Link မထည့်သေးပါ
              <div
                key={char.id}
                className="group relative transition-transform duration-200 ease-in-out"
              >
                <div className="aspect-[2/3] relative rounded-md overflow-hidden shadow-lg bg-gray-800">
                  <Image
                    src={char.image_url || '/placeholder.png'}
                    alt={char.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Heart size={40} className="text-red-400 fill-current" />
                  </div>
                </div>
                <h3 className="mt-1.5 text-xs font-semibold text-text-dark-secondary truncate">
                  {char.name}
                </h3>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card-dark p-8 rounded-lg text-center shadow-md">
          <p className="text-text-dark-secondary">
            You haven't added any favorite characters yet.
          </p>
          <p className="text-sm text-text-dark-secondary mt-2">
            You can add characters from any anime detail page.
          </p>
        </div>
      )}
    </div>
  </motion.div>
);

export default FavoritesTabContent;
