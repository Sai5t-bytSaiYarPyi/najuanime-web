// src/app/admin/anime/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import Modal from 'react-modal';

// Anime Series အတွက် Type Definition
type AnimeSeries = {
  id: string;
  created_at: string;
  title_english: string | null;
  title_romaji: string | null;
  poster_url: string | null;
  status: string | null;
  release_year: number | null;
};

const customModalStyles = {
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
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' },
};

// Modal.setAppElement('#__next'); // In Next.js 13+, this is often not needed if you handle modality correctly.

export default function AnimeManagementPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animeList, setAnimeList] = useState<AnimeSeries[]>([]);
  
  // TODO: Add state for the "Add New Anime" modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnimeList = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('anime_series')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching anime list:', error);
    } else if (data) {
      setAnimeList(data as AnimeSeries[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.roles?.includes('admin')) {
        setIsAdmin(true);
        fetchAnimeList();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    };
    checkAdminAndFetchData();
  }, [fetchAnimeList]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // TODO: Implement search and import logic in the modal

  if (loading) { return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>; }
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
                <img 
                  src={item.poster_url || 'https://via.placeholder.com/50x75'} 
                  alt={item.title_english || 'Poster'} 
                  className="w-12 h-auto rounded object-cover"
                />
                <div>
                  <h2 className="font-bold">{item.title_english || item.title_romaji}</h2>
                  <p className="text-sm text-gray-400">{item.release_year || 'Unknown Year'} - <span className="font-semibold">{item.status || 'N/A'}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded disabled:bg-gray-500" disabled>Manage Episodes</button>
                <button className="text-sm bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded disabled:bg-gray-500" disabled>Edit</button>
                <button className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded disabled:bg-gray-500" disabled>Delete</button>
              </div>
            </div>
          ))
        ) : ( 
          <p>No anime series found. Add a new one to get started.</p> 
        )}
      </div>

      {/* Placeholder for the Add New Anime Modal */}
      <Modal isOpen={isModalOpen} onRequestClose={closeModal} style={customModalStyles} contentLabel="Add New Anime from MyAnimeList">
        <h2 className="text-xl font-bold mb-4">Search and Import Anime</h2>
        <p className="text-gray-400">
          This is where we will build the search functionality to find anime from Jikan API (MyAnimeList).
        </p>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}