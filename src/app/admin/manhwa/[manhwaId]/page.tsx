// src/app/manhwa/[manhwaId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Download } from 'lucide-react';

export const revalidate = 60; // Fetch data again every 60 seconds

type PageProps = {
  params: {
    manhwaId: string;
  };
};

export default async function ChapterListPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies });
  
  // Fetch the details of the specific manhwa series
  const { data: manhwa } = await supabase
    .from('manhwa')
    .select('*')
    .eq('id', params.manhwaId)
    .single();

  // If no manhwa is found with that ID, show a 404 page
  if (!manhwa) {
    notFound();
  }

  // Fetch all chapters for that manhwa, ordered by the display_order
  const { data: chapters } = await supabase
    .from('manhwa_chapters')
    .select('id, chapter_number, title, pdf_url') // Ensure pdf_url is selected
    .eq('manhwa_id', params.manhwaId)
    .order('display_order', { ascending: true });

  return (
    <div className="text-white">
      {/* Manhwa Info Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="md:w-1/4 shrink-0">
          <Image
            src={manhwa.cover_image_url || '/placeholder.png'} // You can create a placeholder image in your public folder
            alt={`Cover for ${manhwa.title}`}
            width={300}
            height={450}
            className="rounded-lg w-full shadow-lg shadow-black/30"
            priority // Load the main image faster
          />
        </div>
        <div className="flex-1">
          <h1 className="text-4xl lg:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-green-400">
            {manhwa.title}
          </h1>
          <p className="text-gray-400 mb-4">Author: {manhwa.author || 'Unknown'}</p>
          <p className="text-gray-300 leading-relaxed">
            {manhwa.description || 'No description available.'}
          </p>
        </div>
      </div>

      {/* Chapters List Section */}
      <h2 className="text-2xl font-bold mb-4">Chapters</h2>
      <div className="bg-card-dark/50 rounded-lg p-4 space-y-2 border border-border-color">
        {chapters && chapters.length > 0 ? (
          chapters.map(chapter => (
            <div 
              key={chapter.id} 
              className="flex items-center justify-between p-4 bg-gray-700/30 rounded-md hover:bg-gray-700/60 transition-colors group"
            >
              <Link href={`/manhwa/read/${chapter.id}`} className="flex-1">
                <span className="font-semibold">Chapter {chapter.chapter_number}</span>
                {chapter.title && <span className="text-gray-400 ml-4 group-hover:text-gray-200">- {chapter.title}</span>}
              </Link>
              <a 
                href={chapter.pdf_url} 
                download 
                className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-500 text-background-dark font-bold rounded-md text-sm flex items-center gap-2 transition-transform duration-200 hover:scale-105"
                onClick={(e) => e.stopPropagation()} // Prevents the Link from navigating when the button is clicked
                title={`Download Chapter ${chapter.chapter_number} PDF`}
              >
                <Download size={16} />
                <span>Download</span>
              </a>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 p-4">No chapters have been uploaded yet.</p>
        )}
      </div>
    </div>
  );
}