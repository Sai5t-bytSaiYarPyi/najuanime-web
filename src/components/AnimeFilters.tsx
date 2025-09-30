// src/components/AnimeFilters.tsx
'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

type Props = {
  genres: { id: number; name: string }[];
  years: (string | number)[];
  statuses: string[];
};

export default function AnimeFilters({ genres, years, statuses }: Props) {
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
    <div className="flex flex-col sm:flex-row items-center gap-2">
      {/* Genre Filter */}
      <select
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
      
      {/* Year Filter */}
      <select
        name="year"
        className="peer block w-full cursor-pointer rounded-md border border-gray-600 bg-gray-800 py-2 pl-3 pr-9 text-sm text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        defaultValue={searchParams.get('year') || 'all'}
        onChange={(e) => handleFilterChange('year', e.target.value)}
      >
        <option value="all">All Years</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        name="status"
        className="peer block w-full cursor-pointer rounded-md border border-gray-600 bg-gray-800 py-2 pl-3 pr-9 text-sm text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        defaultValue={searchParams.get('status') || 'all'}
        onChange={(e) => handleFilterChange('status', e.target.value)}
      >
        <option value="all">All Statuses</option>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  );
}