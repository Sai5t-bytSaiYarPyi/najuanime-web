// src/app/manhwa/read/[chapterId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

type PageProps = {
  params: {
    chapterId: string;
  };
};

// This is a simplified version for debugging purposes.
export default async function ReaderPage({ params }: PageProps) {
  const supabase = createServerComponentClient({ cookies });

  const { data: chapter } = await supabase
    .from('manhwa_chapters')
    .select('image_urls, chapter_number')
    .eq('id', params.chapterId)
    .single();

  if (!chapter || !chapter.image_urls || chapter.image_urls.length === 0) {
    notFound();
  }

  return (
    <div style={{ color: 'white', backgroundColor: 'black', padding: '20px' }}>
      <h1>Chapter {chapter.chapter_number}</h1>
      <p>This chapter has {chapter.image_urls.length} pages.</p>
      
      {/* Test the .map function with simple elements */}
      <ul>
        {chapter.image_urls.map((url, index) => (
          <li key={index}>
            Image URL #{index + 1}: {url}
          </li>
        ))}
      </ul>
    </div>
  );
}