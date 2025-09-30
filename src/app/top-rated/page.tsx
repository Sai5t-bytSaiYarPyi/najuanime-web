// src/app/top-rated/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour

export default async function TopRatedPage() {
  const supabase = createServerComponentClient({ cookies });

  // Query the 'anime_with_stats' view we created
  const { data: topAnime, error } = await supabase
    .from('anime_with_stats')
    .select('id, title_english, title_romaji, poster_url, average_rating, member_count')
    .gt('member_count', 0) // Only show anime that at least 1 person has rated/listed
    .order('average_rating', { ascending: false })
    .limit(50); // Show top 50

  if (error) {
    return <p className="p-8 text-red-500">Error loading top anime list: {error.message}</p>;
  }

  return (
    <div className="min-h-screen text-white p-4 md:p-8">
      <h1 className="text-4xl font-bold mb-2">Top Rated Anime</h1>
      <p className="text-gray-400 mb-8">Based on user ratings from the NajuAnime+ community.</p>

      <div className="flex flex-col gap-4">
        {topAnime.map((anime, index) => (
          <Link href={`/anime/${anime.id}`} key={anime.id} className="group">
            <div className="flex items-center gap-4 p-3 bg-card-dark rounded-lg hover:bg-gray-700 transition-colors">
              <div className="text-2xl font-bold text-gray-400 w-10 text-center">#{index + 1}</div>
              <div className="relative w-16 aspect-[2/3] rounded-md overflow-hidden shrink-0">
                <Image
                  src={anime.poster_url || '/placeholder.png'}
                  alt={anime.title_english || 'Poster'}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="64px"
                />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors">
                  {anime.title_english || anime.title_romaji}
                </h2>
                <p className="text-sm text-gray-400">
                  {anime.member_count} {anime.member_count > 1 ? 'members' : 'member'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-xl">
                <Star size={20} />
                <span>{anime.average_rating.toFixed(2)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}