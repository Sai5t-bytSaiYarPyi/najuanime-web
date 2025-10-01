// src/app/manhwa/read/[chapterId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Image from 'next/image'; // Image ကို import လုပ်ပါ

export const runtime = 'nodejs';
export const revalidate = 3600;

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

  if (!chapter || !chapter.image_urls || chapter.image_urls.length === 0) {
    notFound();
  }

  return (
    <div className="bg-black text-white">
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-center py-4">
                Chapter {chapter.chapter_number} {chapter.title && `- ${chapter.title}`}
            </h1>
            
            <div className="flex flex-col items-center">
                {chapter.image_urls.map((url: string, index: number) => (
                    <div key={index} className="w-full">
                        <Image 
                            src={url} 
                            alt={`Page ${index + 1}`}
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto"
                        />
                    </div>
                ))}
            </div>

            <p className="text-center py-8">End of Chapter {chapter.chapter_number}.</p>
        </div>
    </div>
  );
}