// src/app/anime/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import AccessDenied from '@/components/AccessDenied';

// Re-fetch data every 10 minutes
export const revalidate = 600; 

export default async function AnimeGridPage() {
  const supabase = createServerComponentClient({ cookies });

  // 1. Check for active session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return <AccessDenied />;
  }

  // 2. Check for active subscription from the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_expires_at')
    .eq('id', session.user.id)
    .single();

  const isSubscribed = profile?.subscription_expires_at 
    ? new Date(profile.subscription_expires_at) > new Date() 
    : false;

  if (!isSubscribed) {
    return <AccessDenied />;
  }

  // 3. If subscribed, fetch the list of all anime series
  const { data: animeList, error } = await supabase
    .from('anime_series')
    .select('id, title_english, title_romaji, poster_url, release_year')
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="p-8 text-red-500">Error loading anime list: {error.message}</p>;
  }

  return (
    <div className="min-h-screen text-white p-4 md:p-8">
      <h1 className="text-4xl font-bold mb-2">All Anime</h1>
      <p className="text-gray-400 mb-8">Browse our collection of high-quality, subtitled anime.</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {animeList.map((anime) => (
          <Link href={`/anime/${anime.id}`} key={anime.id} className="group">
            <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-lg">
              <Image
                src={anime.poster_url || '/placeholder.png'}
                alt={anime.title_english || anime.title_romaji || 'Anime Poster'}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-3">
                  <h2 className="font-bold text-white text-sm drop-shadow-md line-clamp-2">
                    {anime.title_english || anime.title_romaji}
                  </h2>
                  <p className="text-xs text-gray-300">{anime.release_year}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}