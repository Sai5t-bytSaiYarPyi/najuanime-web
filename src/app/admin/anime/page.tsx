// src/app/admin/anime/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import Modal, { Styles } from 'react-modal';
import Image from 'next/image'; // Image ကို import လုပ်ပါ

// Types
type AnimeSeries = {
  id: string; created_at: string; title_english: string | null; title_romaji: string | null; synopsis: string | null;
  poster_url: string | null; status: string | null; release_year: number | null; type: string | null;
};
type JikanAnimeResult = {
    mal_id: number; title: string; title_english: string | null; title_japanese: string;
    images: { jpg: { image_url: string } }; synopsis: string | null; type: string; status: string;
    season: string | null; year: number | null; studios: { name: string }[]; duration: string;
    episodes: number | null; source: string; genres: { name: string }[]; trailer: { youtube_id: string | null };
};


const customModalStyles: Styles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%',
    transform: 'translate(-50%, -50%)', backgroundColor: '#1F2937', color: 'white',
    border: '1px solid #374151', borderRadius: '0.5rem', width: '90%',
    maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' },
};
if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

export default function AnimeManagementPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animeList, setAnimeList] = useState<AnimeSeries[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JikanAnimeResult[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<JikanAnimeResult | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState<AnimeSeries | null>(null);

  const fetchAnimeList = useCallback(async () => {
    const { data, error } = await supabase
      .from('anime_series').select('*').order('created_at', { ascending: false });
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

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedAnime(null);
  };
  
  const openEditModal = (anime: AnimeSeries) => {
    setEditingAnime(anime);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAnime(null);
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

  const handleImportAnime = async () => {
    if (!selectedAnime) return;
    setLoading(true);
    const animeData = {
      title_english: selectedAnime.title_english || selectedAnime.title, title_japanese: selectedAnime.title_japanese,
      title_romaji: selectedAnime.title, synopsis: selectedAnime.synopsis, poster_url: selectedAnime.images.jpg.image_url,
      trailer_url: selectedAnime.trailer?.youtube_id ? `https://www.youtube.com/embed/${selectedAnime.trailer.youtube_id}` : null,
      type: selectedAnime.type, status: selectedAnime.status, season: selectedAnime.season, release_year: selectedAnime.year,
      source_material: selectedAnime.source, studio: selectedAnime.studios[0]?.name || null,
      duration_minutes: parseInt(selectedAnime.duration) || 0, total_episodes: selectedAnime.episodes,
    };
    const genres = selectedAnime.genres.map(g => g.name);
    const { error } = await supabase.functions.invoke('import-anime-series', { body: { animeData, genres } });
    if (error) {
      alert('Error importing anime: ' + error.message);
    } else {
      alert(`Successfully imported "${animeData.title_english}"!`);
      await fetchAnimeList(); 
      closeAddModal();
    }
    setLoading(false);
  };

  const handleDeleteAnime = async (animeId: string, animeTitle: string) => {
    const confirmationMessage = `Are you sure you want to permanently delete "${animeTitle}"? This will also delete ALL of its episodes, video files, and cannot be undone.`;
    if (window.confirm(confirmationMessage)) {
      setLoading(true);
      const { error } = await supabase.functions.invoke('delete-anime-series', { body: { anime_id: animeId } });
      if (error) {
        alert(`Error deleting anime: ${error.message}`);
        setLoading(false);
      } else {
        alert(`"${animeTitle}" has been deleted successfully.`);
        await fetchAnimeList(); 
      }
    }
  };

  if (loading && animeList.length === 0) { return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>; }
  if (!isAdmin) { return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Access Denied.</div>; }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Anime Management</h1>
        <button onClick={openAddModal} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold">
          + Add New Anime (from MAL)
        </button>
      </div>
      <Link href="/admin" className="text-blue-400 hover:underline mb-6 block">&larr; Back to Admin Dashboard</Link>

      <div className="bg-gray-800 rounded-lg p-4">
        {animeList.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-700">
            <div className="flex items-center gap-4">
              <Image 
                src={item.poster_url || 'https://via.placeholder.com/50x75'} 
                alt={item.title_english || 'Poster'} 
                width={50}
                height={75}
                className="w-12 h-auto rounded object-cover"
              />
              <div>
                <h2 className="font-bold">{item.title_english || item.title_romaji}</h2>
                <p className="text-sm text-gray-400">{item.release_year || 'Unknown Year'} - <span className="font-semibold">{item.status || 'N/A'}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/anime/${item.id}`} className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
                  Manage Episodes
              </Link>
              <button onClick={() => openEditModal(item)} disabled={loading} className="text-sm bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded disabled:bg-gray-500">
                Edit
              </button>
              <button onClick={() => handleDeleteAnime(item.id, item.title_english || item.title_romaji || 'this anime')} disabled={loading} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded disabled:bg-gray-500 disabled:cursor-not-allowed">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Anime Modal */}
      <Modal isOpen={isAddModalOpen} onRequestClose={closeAddModal} style={customModalStyles} contentLabel="Add New Anime from MyAnimeList">
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Add Anime from MyAnimeList</h2>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for an anime..."
                    className="flex-grow p-2 rounded bg-gray-700 border border-gray-600"
                />
                <button onClick={handleSearch} disabled={isSearching} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-500">
                    {isSearching ? '...' : 'Search'}
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto mb-4 space-y-2">
                {searchResults.map(anime => (
                    <div key={anime.mal_id} onClick={() => setSelectedAnime(anime)} className={`p-2 flex gap-3 rounded-md cursor-pointer ${selectedAnime?.mal_id === anime.mal_id ? 'bg-green-800' : 'hover:bg-gray-700'}`}>
                        <Image src={anime.images.jpg.image_url} alt={anime.title} width={50} height={75} className="w-12 h-auto rounded object-cover"/>
                        <div>
                            <p className="font-bold">{anime.title_english || anime.title}</p>
                            <p className="text-sm text-gray-400">{anime.year} - {anime.type}</p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedAnime && (
                <div className="border-t border-gray-600 pt-4">
                    <button onClick={handleImportAnime} disabled={loading} className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md disabled:bg-gray-500">
                        {loading ? 'Importing...' : `Import "${selectedAnime.title_english || selectedAnime.title}"`}
                    </button>
                </div>
            )}
        </div>
      </Modal>

      {/* Edit Anime Modal */}
      {editingAnime && (
        <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} style={customModalStyles} contentLabel="Edit Anime Details">
          <p>Edit functionality is not fully implemented in this component.</p>
        </Modal>
      )}
    </div>
  );
}