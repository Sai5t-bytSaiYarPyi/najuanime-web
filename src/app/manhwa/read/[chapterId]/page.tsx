// src/app/manhwa/read/[chapterId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

// We don't need to import Image from 'next/image' for this version
// to keep it simple and avoid dimension issues.

export const revalidate = 3600; // Revalidate once an hour

type PageProps = {
  params: {
    chapterId: string;
  };
};

export default async function ReaderPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies });

  const { data: chapter } = await supabase
    .from('manhwa_chapters')
    .select('image_urls, chapter_number, title')
    .eq('id', params.chapterId)
    .single();

  // If there's no chapter or the chapter has no images, show a 404 page.
  if (!chapter || !chapter.image_urls || chapter.image_urls.length === 0) {
    notFound();
  }

  return (
    <div className="bg-black text-white">
        <div className="max-w-3xl mx-auto">
            {/* THIS IS THE CORRECTED LINE */}
            <h1 className="text-2xl font-bold text-center py-4">
                Chapter {chapter.chapter_number} {chapter.title && `- ${chapter.title}`}
            </h1>
            
            <div className="flex flex-col items-center">
                {chapter.image_urls.map((url, index) => (
                    <div key={index} className="w-full">
                        {/* Using a standard <img> tag is best here because we don't know the
                            height of each image in advance. The browser will handle it. */}
                        <img 
                            src={url} 
                            alt={`Page ${index + 1}`}
                            className="w-full h-auto" // Use w-full and h-auto to maintain aspect ratio
                        />
                    </div>
                ))}
            </div>

            <p className="text-center py-8">End of Chapter {chapter.chapter_number}.</p>
        </div>
    </div>
  );
}