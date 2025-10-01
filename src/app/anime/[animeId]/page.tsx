// src/app/anime/[animeId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PlayCircle, Calendar, Clock, Tag, BookOpen, Film } from 'lucide-react';
import AnimeStatusUpdater from '@/components/AnimeStatusUpdater';
import AnimeReviews from '@/components/AnimeReviews';
import Link from 'next/link';

export const runtime = 'nodejs'; // Node.js Runtime ကို အသုံးပြုရန်
export const revalidate = 3600;

// --- START: ပြင်ဆင်ချက် ---
// PageProps type ကို သီးသန့်ကြေညာမယ့်အစား function မှာ တိုက်ရိုက်ထည့်သွင်းသတ်မှတ်လိုက်ပါတယ်။
// ဒါက Next.js ရဲ့ internal type နဲ့ conflict ဖြစ်နေတဲ့ ပြဿနာကို ဖြေရှင်းပေးပါတယ်။
type Episode = { id: string; episode_number: number; title: string | null; created_at: string; };

const InfoPill = ({ icon, text }: { icon: React.ReactNode, text: string | number | null }) => {
  if (!text) return null;
  return ( <div className="bg-gray-700/50 backdrop-blur-sm text-gray-200 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2">{icon}<span>{text}</span></div> );
};

export default async function AnimeDetailPage({ params }: { params: { animeId: string } }) {
// --- END: ပြင်ဆင်ချက် ---
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();

  const [animeRes, userListRes] = await Promise.all([
    supabase
      .from('anime_series')
      .select(`*, anime_genres(genres(name)), anime_episodes(id, episode_number, title, created_at)`)
      .eq('id', params.animeId)
      .order('episode_number', { referencedTable: 'anime_episodes', ascending: true })
      .single(),
    session
      ? supabase.from('user_anime_list').select('status, rating').eq('anime_id', params.animeId).eq('user_id', session.user.id).single()
      : Promise.resolve({ data: null, error: null })
  ]);

  const { data: anime, error: animeError } = animeRes;
  const { data: userListEntry } = userListRes;

  if (animeError || !anime) {
    notFound();
  }

  const genres = anime.anime_genres.map((ag: { genres: { name: string | null } | null }) => ag.genres?.name).filter(Boolean) as string[];

  return (
    <div className="min-h-screen text-white">
      {/* Header Section */}
      <div className="relative h-[40vh] md:h-[50vh] w-full">
        <div className="absolute inset-0 bg-black/50 z-10" />
        {anime.poster_url && ( <Image src={anime.poster_url} alt={`${anime.title_english || 'Anime'} Poster`} fill style={{ objectFit: 'cover' }} className="opacity-30" priority /> )}
        <div className="relative z-20 flex flex-col md:flex-row items-end h-full p-4 md:p-8 gap-6 max-w-7xl mx-auto">
          <div className="w-40 md:w-52 aspect-[2/3] relative shrink-0 rounded-lg overflow-hidden shadow-2xl">
            <Image src={anime.poster_url || '/placeholder.png'} alt={`${anime.title_english || 'Anime'} Cover`} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 40vw, 208px" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{anime.title_english || anime.title_romaji}</h1>
            <p className="text-gray-300 text-lg drop-shadow-md">{anime.title_romaji}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {genres.map(genre => (<span key={genre} className="bg-accent-purple/70 text-white text-xs font-bold px-2 py-1 rounded-full">{genre}</span>))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold border-b-2 border-accent-green pb-2 mb-4">Synopsis</h2>
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{anime.synopsis || 'No synopsis available.'}</p>
          {anime.trailer_url && (
            <>
              <h2 className="text-2xl font-bold border-b-2 border-accent-green pb-2 my-6">Trailer</h2>
              <div className="aspect-video relative">
                <iframe src={anime.trailer_url} title="Anime Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg" />
              </div>
            </>
          )}
          <AnimeReviews animeId={anime.id} user={session?.user || null} />
        </div>

        {/* Right Column */}
        <div>
          <div className="mb-6">
            <AnimeStatusUpdater
              animeId={anime.id}
              initialStatus={userListEntry?.status || null}
              initialRating={userListEntry?.rating || null}
              user={session?.user || null}
            />
          </div>
          <div className="bg-card-dark p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Details</h3>
            <div className="flex flex-wrap gap-3">
              <InfoPill icon={<Film size={14} />} text={anime.type} />
              <InfoPill icon={<PlayCircle size={14} />} text={anime.status} />
              <InfoPill icon={<Calendar size={14} />} text={anime.release_year} />
              <InfoPill icon={<Clock size={14} />} text={anime.duration_minutes ? `${anime.duration_minutes} min` : null} />
              <InfoPill icon={<Tag size={14} />} text={anime.season} />
              <InfoPill icon={<BookOpen size={14} />} text={anime.source_material} />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Episodes</h3>
            <div className="bg-card-dark rounded-lg max-h-96 overflow-y-auto">
              {anime.anime_episodes.length > 0 ? (
                anime.anime_episodes.map((ep: Episode) => (
                  <Link
                    href={`/watch/${ep.id}`}
                    key={ep.id}
                    className="block p-4 border-b border-border-color last:border-b-0 hover:bg-gray-700/50 transition-colors"
                  >
                    <p className="font-semibold text-gray-200">Episode {ep.episode_number}</p>
                    {ep.title && <p className="text-sm text-gray-400">{ep.title}</p>}
                  </Link>
                ))
              ) : (
                <p className="p-4 text-gray-400">No episodes available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}