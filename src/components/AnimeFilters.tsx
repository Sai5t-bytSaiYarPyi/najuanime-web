// src/components/AnimeFilters.tsx
'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

type Props = {
  genres: { id: number; name: string }[];
  // We can add more filters like years, statuses etc. later
};

export default function AnimeFilters({ genres }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleFilterChange = (filterType: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(filterType, value);
    } else {
      params.delete(filterType);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Genre Filter */}
      <div className="relative">
        <select
          id="genre"
          name="genre"
          className="peer block w-full cursor-pointer rounded-md border border-gray-600 bg-gray-800 py-2 pl-3 pr-9 text-sm text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          defaultValue={searchParams.get('genre') || 'all'}
          onChange={(e) => handleFilterChange('genre', e.target.value)}
        >
          <option value="all">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.name}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>
      {/* More filters will be added here in the future */}
    </div>
  );
}