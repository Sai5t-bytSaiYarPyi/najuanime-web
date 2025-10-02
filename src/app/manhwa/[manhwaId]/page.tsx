// src/app/manhwa/[manhwaId]/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const runtime = 'nodejs';
export const revalidate = 60;

type PageProps = {
  params: {
    manhwaId: string;
  };
};

export default async function ChapterListPage({ params }: PageProps) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  );
  
  const { data: manhwa } = await supabase
    .from('manhwa')
    .select('*')
    .eq('id', params.manhwaId)
    .single();

  if (!manhwa) {
    notFound();
  }

  const { data: chapters } = await supabase
    .from('manhwa_chapters')
    .select('*')
    .eq('manhwa_id', params.manhwaId)
    .order('display_order', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-2">{manhwa.title}</h1>
      <p className="text-gray-400 mb-2">Author: {manhwa.author || 'Unknown'}</p>
      <p className="text-gray-300 mb-8 max-w-3xl">{manhwa.description || 'No description available.'}</p>

      <h2 className="text-2xl font-bold mb-4">Chapters</h2>
      <div className="bg-gray-800 rounded-lg p-4 space-y-2">
        {chapters && chapters.length > 0 ? (
          chapters.map(chapter => (
            <Link 
              href={`/manhwa/read/${chapter.id}`} 
              key={chapter.id} 
              className="block p-4 bg-gray-700 rounded-md hover:bg-green-800 transition-colors"
            >
              Chapter {chapter.chapter_number}
              {chapter.title && <span className="text-gray-400 ml-4">- {chapter.title}</span>}
            </Link>
          ))
        ) : (
          <p>No chapters available yet.</p>
        )}
      </div>
    </div>
  );
}