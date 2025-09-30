// src/app/admin/anime/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import Modal, { Styles } from 'react-modal';

// Anime Series အတွက် Type Definition ကို Edit form အတွက် တိုးချဲ့ပါ
type AnimeSeries = {
  id: string;
  created_at: string;
  title_english: string | null;
  title_romaji: string | null;
  synopsis: string | null;
  poster_url: string | null;
  status: string | null;
  release_year: number | null;
  type: string | null;
};

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
  
  // Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JikanAnimeResult[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<JikanAnimeResult | null>(null);

  // --- START: NEW EDIT MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAnime, setEditingAnime] = useState<AnimeSeries | null>(null);
  // --- END: NEW EDIT MODAL STATE ---

  const fetchAnimeList = useCallback(async () => {
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

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedAnime(null);
  };
  
  // --- START: NEW EDIT MODAL FUNCTIONS ---
  const openEditModal = (anime: AnimeSeries) => {
    setEditingAnime(anime);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAnime(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingAnime) return;
    setEditingAnime({
      ...editingAnime,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateAnime = async () => {
    if (!editingAnime) return;

    setLoading(true);
    const { id, created_at, ...updateData } = editingAnime;

    const { error } = await supabase
      .from('anime_series')
      .update(updateData)
      .eq('id', id);

    if (error) {
      alert('Error updating anime: ' + error.message);
    } else {
      alert('Anime details updated successfully!');
      closeEditModal();
      await fetchAnimeList();
    }
    setLoading(false);
  };
  // --- END: NEW EDIT MODAL FUNCTIONS ---

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
      await fetchAnimeList(); 
      closeAddModal();
    }
    setLoading(false);
  };

  const handleDeleteAnime = async (animeId: string, animeTitle: string) => {
    const confirmationMessage = `Are you sure you want to permanently delete "${animeTitle}"? This will also delete ALL of its episodes, video files, and cannot be undone.`;
    if (window.confirm(confirmationMessage)) {
      setLoading(true);
      const { error } = await supabase.functions.invoke('delete-anime-series', {
        body: { anime_id: animeId },
      });
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
                <Link href={`/admin/anime/${item.id}`} className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded">
                    Manage Episodes
                </Link>
                {/* --- START: UPDATED EDIT BUTTON --- */}
                <button 
                  onClick={() => openEditModal(item)}
                  disabled={loading}
                  className="text-sm bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded disabled:bg-gray-500"
                >
                  Edit
                </button>
                {/* --- END: UPDATED EDIT BUTTON --- */}
                <button 
                  onClick={() => handleDeleteAnime(item.id, item.title_english || item.title_romaji || 'this anime')}
                  disabled={loading}
                  className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : ( 
          <p>No anime series found. Add a new one to get started.</p> 
        )}
      </div>

      {/* Add New Anime Modal */}
      <Modal isOpen={isAddModalOpen} onRequestClose={closeAddModal} style={customModalStyles} contentLabel="Add New Anime from MyAnimeList">
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
                    <button onClick={closeAddModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
                </div>
            </div>
        )}
      </Modal>

      {/* --- START: NEW EDIT MODAL --- */}
      {editingAnime && (
        <Modal isOpen={isEditModalOpen} onRequestClose={closeEditModal} style={customModalStyles} contentLabel="Edit Anime Details">
          <div className="flex flex-col flex-grow">
            <h2 className="text-xl font-bold mb-4">Edit Anime Details</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">English Title</label>
                <input type="text" name="title_english" value={editingAnime.title_english || ''} onChange={handleEditFormChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">Romaji Title</label>
                <input type="text" name="title_romaji" value={editingAnime.title_romaji || ''} onChange={handleEditFormChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">Synopsis</label>
                <textarea name="synopsis" value={editingAnime.synopsis || ''} onChange={handleEditFormChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" rows={5}></textarea>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">Poster URL</label>
                <input type="text" name="poster_url" value={editingAnime.poster_url || ''} onChange={handleEditFormChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">Release Year</label>
                <input type="number" name="release_year" value={editingAnime.release_year || ''} onChange={handleEditFormChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">Status</label>
                <input type="text" name="status" value={editingAnime.status || ''} onChange={handleEditFormChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
               <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">Type (e.g., TV, Movie)</label>
                <input type="text" name="type" value={editingAnime.type || ''} onChange={handleEditFormChange} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={closeEditModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
              <button onClick={handleUpdateAnime} disabled={loading} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md disabled:bg-gray-500">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* --- END: NEW EDIT MODAL --- */}
    </div>
  );
}