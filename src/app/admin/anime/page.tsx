// src/app/admin/anime/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import Modal, { Styles } from 'react-modal';

// Anime Series အတွက် Type Definition (Database Table)
type AnimeSeries = {
  id: string;
  created_at: string;
  title_english: string | null;
  title_romaji: string | null;
  poster_url: string | null;
  status: string | null;
  release_year: number | null;
};

// Jikan API ကနေပြန်လာမယ့် Anime data အတွက် Type
type JikanAnimeResult = {
    mal_id: number;
    title: string;
    title_english: string | null;
    title_japanese: string;
    images: { jpg: { image_url: string } };
    synopsis: string | null;
    type: string;
    status: string;
    season: string | null;
    year: number | null;
    studios: { name: string }[];
    duration: string;
    episodes: number | null;
    source: string;
    genres: { name: string }[];
    trailer: { youtube_id: string | null };
};


const customModalStyles: Styles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#1F2937',
    color: 'white',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' },
};

export default function AnimeManagementPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animeList, setAnimeList] = useState<AnimeSeries[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JikanAnimeResult[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<JikanAnimeResult | null>(null);

  const fetchAnimeList = useCallback(async () => {
    // setLoading(true); // No need to set loading true on manual refetch
    const { data, error } = await supabase
      .from('anime_series')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching anime list:', error);
      alert('Could not fetch anime list.');
    } else if (data) {
      setAnimeList(data as AnimeSeries[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.roles?.includes('admin')) {
        setIsAdmin(true);
        await fetchAnimeList();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    };
    checkAdminAndFetchData();
  }, [fetchAnimeList]);

  const openModal = () => setIsModalOpen(true);
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedAnime(null);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setSelectedAnime(null);
    setSearchResults([]);

    try {
        const response = await fetch(`/api/jikan/search?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Failed to fetch from Jikan API');
        const result = await response.json();
        setSearchResults(result.data || []);
    } catch (error) {
        console.error(error);
        alert('An error occurred while searching.');
    } finally {
        setIsSearching(false);
    }
  };

  const handleSelectAnime = (anime: JikanAnimeResult) => {
    setSelectedAnime(anime);
  };

  const handleImportAnime = async () => {
    if (!selectedAnime) return;
    setLoading(true);

    const animeData = {
      title_english: selectedAnime.title_english || selectedAnime.title,
      title_japanese: selectedAnime.title_japanese,
      title_romaji: selectedAnime.title,
      synopsis: selectedAnime.synopsis,
      poster_url: selectedAnime.images.jpg.image_url,
      trailer_url: selectedAnime.trailer?.youtube_id ? `https://www.youtube.com/embed/${selectedAnime.trailer.youtube_id}` : null,
      type: selectedAnime.type,
      status: selectedAnime.status,
      season: selectedAnime.season,
      release_year: selectedAnime.year,
      source_material: selectedAnime.source,
      studio: selectedAnime.studios[0]?.name || null,
      duration_minutes: parseInt(selectedAnime.duration) || 0,
      total_episodes: selectedAnime.episodes,
    };
    const genres = selectedAnime.genres.map(g => g.name);

    const { error } = await supabase.functions.invoke('import-anime-series', {
      body: { animeData, genres },
    });

    if (error) {
      alert('Error importing anime: ' + error.message);
    } else {
      alert(`Successfully imported "${animeData.title_english}"!`);
      await fetchAnimeList(); // Refresh the list on the page
      closeModal();
    }
    setLoading(false); // setLoading(false) was missing here
  };

  if (loading && animeList.length === 0) { return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>; }
  if (!isAdmin) { return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Access Denied.</div>; }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Anime Management</h1>
        <button onClick={openModal} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold">
          + Add New Anime (from MAL)
        </button>
      </div>
      <Link href="/admin" className="text-blue-400 hover:underline mb-6 block">&larr; Back to Admin Dashboard</Link>

      <div className="bg-gray-800 rounded-lg p-4">
        {animeList.length > 0 ? (
          animeList.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-700">
              <div className="flex items-center gap-4">
                <img src={item.poster_url || 'https://via.placeholder.com/50x75'} alt={item.title_english || 'Poster'} className="w-12 h-auto rounded object-cover"/>
                <div>
                  <h2 className="font-bold">{item.title_english || item.title_romaji}</h2>
                  <p className="text-sm text-gray-400">{item.release_year || 'Unknown Year'} - <span className="font-semibold">{item.status || 'N/A'}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* --- START OF FIX --- */}
                <Link href={`/admin/anime/${item.id}`} className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
                    Manage Episodes
                </Link>
                {/* --- END OF FIX --- */}
                <button className="text-sm bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded disabled:bg-gray-500" disabled>Edit</button>
                <button className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded disabled:bg-gray-500" disabled>Delete</button>
              </div>
            </div>
          ))
        ) : ( 
          <p>No anime series found. Add a new one to get started.</p> 
        )}
      </div>

      <Modal isOpen={isModalOpen} onRequestClose={closeModal} style={customModalStyles} contentLabel="Add New Anime from MyAnimeList">
        {/* Modal content remains the same */}
        {selectedAnime ? (
            <div className="flex flex-col flex-grow">
                <h2 className="text-xl font-bold mb-4">Confirm Import</h2>
                <div className="flex gap-4 p-4 bg-gray-800 rounded-lg mb-4">
                    <img src={selectedAnime.images.jpg.image_url} alt="poster" className="w-24 h-auto rounded" />
                    <div>
                        <h3 className="text-lg font-bold">{selectedAnime.title_english || selectedAnime.title}</h3>
                        <p className="text-sm text-gray-400">{selectedAnime.year} | {selectedAnime.type} | {selectedAnime.status}</p>
                        <p className="text-sm text-gray-300 mt-2 line-clamp-3">{selectedAnime.synopsis}</p>
                    </div>
                </div>
                <div className="flex-grow"></div>
                <div className="flex justify-end gap-4 mt-auto">
                    <button onClick={() => setSelectedAnime(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Back to Search</button>
                    <button onClick={handleImportAnime} disabled={loading} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md disabled:bg-gray-500">
                        {loading ? 'Importing...' : 'Confirm & Add to Database'}
                    </button>
                </div>
            </div>
        ) : (
            <div className="flex flex-col flex-grow">
                <h2 className="text-xl font-bold mb-4">Search and Import Anime</h2>
                <div className="flex gap-2 mb-4">
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Enter anime title (e.g., Naruto)" className="flex-grow p-2 rounded bg-gray-700 border border-gray-600" />
                    <button onClick={handleSearch} disabled={isSearching} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-500">{isSearching ? '...' : 'Search'}</button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {isSearching && <p className="text-center">Searching...</p>}
                    <div className="space-y-2">
                        {searchResults.map(anime => (
                            <div key={anime.mal_id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-md">
                                <img src={anime.images.jpg.image_url} alt="poster" className="w-12 h-16 object-cover rounded" />
                                <div className="flex-grow">
                                    <p className="font-semibold">{anime.title_english || anime.title}</p>
                                    <p className="text-xs text-gray-400">{anime.year} | {anime.type}</p>
                                </div>
                                <button onClick={() => handleSelectAnime(anime)} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-sm rounded-md">Import</button>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="flex justify-end gap-4 mt-4">
                    <button onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
                </div>
            </div>
        )}
      </Modal>
    </div>
  );
}