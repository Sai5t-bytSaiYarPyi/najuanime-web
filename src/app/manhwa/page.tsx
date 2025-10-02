// src/app/manhwa/page.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';

export const runtime = 'nodejs';
export const revalidate = 60;

export default async function ManhwaListPage() {
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

  const { data: manhwaList, error } = await supabase
    .from('manhwa')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500">Error loading manhwa list.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-2 text-center">Manhwa Collection (Free to Read)</h1>
      <p className="text-gray-400 text-center mb-8">All manhwa here are free for everyone. No subscription needed.</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {manhwaList.map((manhwa) => (
          <Link href={`/manhwa/${manhwa.id}`} key={manhwa.id} className="group">
            <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <Image
                src={manhwa.cover_image_url || '/placeholder.png'}
                alt={manhwa.title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
              />
            </div>
            <h2 className="mt-2 font-semibold truncate group-hover:text-green-400">{manhwa.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}