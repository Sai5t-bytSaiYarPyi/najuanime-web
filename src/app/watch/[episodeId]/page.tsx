// src/app/watch/[episodeId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import AccessDenied from '@/components/AccessDenied';
import VideoPlayer from '@/components/VideoPlayer';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const revalidate = 3600;

type PageProps = {
  params: {
    episodeId: string;
  };
};

// --- START: NEW TYPE DEFINITION FOR EPISODE LINKS ---
type EpisodeLink = {
  id: string;
  episode_number: number;
  title: string | null;
};
// --- END: NEW TYPE DEFINITION ---


export default async function WatchPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return <AccessDenied />;

  const { data: profile } = await supabase.from('profiles').select('subscription_expires_at').eq('id', session.user.id).single();
  const isSubscribed = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) > new Date() : false;
  if (!isSubscribed) return <AccessDenied />;

  const { data: episode, error } = await supabase
    .from('anime_episodes')
    .select(`
      *,
      anime_series (id, title_english, title_romaji, anime_episodes (id, episode_number, title))
    `)
    .eq('id', params.episodeId)
    .order('episode_number', { referencedTable: 'anime_series.anime_episodes', ascending: true })
    .single();

  if (error || !episode || !episode.anime_series) {
    notFound();
  }
  
  const series = episode.anime_series;
  const allEpisodes: EpisodeLink[] = series.anime_episodes || [];

  // --- START: TYPE FIX 1 ---
  const currentIndex = allEpisodes.findIndex((ep: EpisodeLink) => ep.id === episode.id);
  // --- END: TYPE FIX 1 ---

  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  return (
    <div className="min-h-screen text-white bg-black">
      <div className="grid grid-cols-1 lg:grid-cols-4">
        <div className="lg:col-span-3 p-4">
          <Link href={`/anime/${series.id}`} className="text-sm text-gray-300 hover:text-white mb-4 inline-block">
            &larr; Back to {series.title_english || series.title_romaji}
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">
            Episode {episode.episode_number}: {episode.title}
          </h1>
          
          <div className="mt-4">
            <VideoPlayer videoUrls={episode.video_urls} />
          </div>

          <div className="flex justify-between mt-6">
            {prevEpisode ? (
              <Link href={`/watch/${prevEpisode.id}`} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md">
                <ChevronLeft size={18} /> Prev Ep
              </Link>
            ) : <div />}
            {nextEpisode ? (
              <Link href={`/watch/${nextEpisode.id}`} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md">
                Next Ep <ChevronRight size={18} />
              </Link>
            ) : <div />}
          </div>
        </div>

        <div className="lg:col-span-1 bg-gray-900 lg:h-screen lg:overflow-y-auto p-4">
          <h3 className="text-xl font-bold mb-4">Episodes</h3>
          <div className="flex flex-col gap-2">
            {/* --- START: TYPE FIX 2 --- */}
            {allEpisodes.map((ep: EpisodeLink) => (
              <Link 
                href={`/watch/${ep.id}`} 
                key={ep.id}
                className={`p-3 rounded-md transition-colors ${ep.id === episode.id ? 'bg-accent-purple' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                <p className="font-semibold text-sm">Episode {ep.episode_number}</p>
                {ep.title && <p className="text-xs text-gray-400 truncate">{ep.title}</p>}
              </Link>
            ))}
            {/* --- END: TYPE FIX 2 --- */}
          </div>
        </div>
      </div>
    </div>
  );
}