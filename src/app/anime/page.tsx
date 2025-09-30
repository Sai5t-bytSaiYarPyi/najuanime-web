// src/app/anime/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import AccessDenied from '@/components/AccessDenied';
import AnimeSearchBar from '@/components/AnimeSearchBar';
import AnimeFilters from '@/components/AnimeFilters'; // Import the new filter component

export const revalidate = 600;

export default async function AnimeGridPage({ 
  searchParams 
}: { 
  searchParams?: { 
    q?: string;
    genre?: string; 
  }; 
}) {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return <AccessDenied />;

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_expires_at')
    .eq('id', session.user.id)
    .single();

  const isSubscribed = profile?.subscription_expires_at 
    ? new Date(profile.subscription_expires_at) > new Date() 
    : false;

  if (!isSubscribed) return <AccessDenied />;

  const query = searchParams?.q || '';
  const genreFilter = searchParams?.genre || '';

  // --- START: MODIFIED SUPABASE QUERY ---
  // We need to use an RPC function for many-to-many filtering
  // Let's create a simpler query for now and create the function later if needed.
  // First, fetch all genres for the filter dropdown
  const { data: genres } = await supabase.from('genres').select('id, name').order('name', { ascending: true });

  let animeQuery = supabase
    .from('anime_series')
    .select('id, title_english, title_romaji, poster_url, release_year, anime_genres!inner(genres!inner(name))');

  if (query) {
    animeQuery = animeQuery.or(`title_english.ilike.%${query}%,title_romaji.ilike.%${query}%`);
  }

  if (genreFilter) {
    // This part filters based on the genre name from the joined table
    animeQuery = animeQuery.eq('anime_genres.genres.name', genreFilter);
  }

  const { data: animeList, error } = await animeQuery.order('created_at', { ascending: false });
  // --- END: MODIFIED SUPABASE QUERY ---

  if (error) {
    return <p className="p-8 text-red-500">Error loading anime list: {error.message}</p>;
  }

  return (
    <div className="min-h-screen text-white p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">All Anime</h1>
          <p className="text-gray-400">Browse our collection of high-quality, subtitled anime.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <AnimeSearchBar />
          <AnimeFilters genres={genres || []} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {animeList && animeList.length > 0 ? (
          animeList.map((anime) => (
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
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <h3 className="text-xl font-semibold">No Anime Found</h3>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}