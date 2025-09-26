'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // Adjusted path
import Modal from 'react-modal';

// Define a type for our manhwa data
type Manhwa = {
  id: string;
  created_at: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_image_url: string | null;
};

// Custom styles for the modal (can be reused)
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
    maxWidth: '500px',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
};

export default function ManhwaManagementPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([]);
  
  // State for the "Add New Manhwa" modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.roles?.includes('admin')) {
        setIsAdmin(true);
        fetchManhwaList();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    };
    checkAdminAndFetchData();
  }, []);

  const fetchManhwaList = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('manhwa').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching manhwa list:', error);
    } else if (data) {
      setManhwaList(data);
    }
    setLoading(false);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
      setIsModalOpen(false);
      // Clear form fields
      setNewTitle('');
      setNewAuthor('');
      setNewDescription('');
      setNewCoverUrl('');
  };

  const handleAddNewManhwa = async () => {
    if (!newTitle) {
      alert('Title is required.');
      return;
    }
    const { error } = await supabase
      .from('manhwa')
      .insert([{ 
          title: newTitle, 
          author: newAuthor || null,
          description: newDescription || null,
          cover_image_url: newCoverUrl || null,
      }]);
    
    if (error) {
        alert('Error adding new manhwa: ' + error.message);
    } else {
        alert('New manhwa added successfully!');
        fetchManhwaList(); // Refresh the list
        closeModal();
    }
  };


  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Access Denied.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manhwa Management</h1>
        <button onClick={openModal} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold">
          + Add New Manhwa
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        {manhwaList.length > 0 ? (
          manhwaList.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 border-b border-gray-700 hover:bg-gray-700">
              <div className="flex items-center gap-4">
                <img src={item.cover_image_url || 'https://via.placeholder.com/50x75'} alt={item.title} className="w-12 h-auto rounded"/>
                <div>
                  <h2 className="font-bold">{item.title}</h2>
                  <p className="text-sm text-gray-400">{item.author || 'Unknown Author'}</p>
                </div>
              </div>
              <button className="text-sm bg-blue-600 px-3 py-1 rounded">Manage Chapters</button>
            </div>
          ))
        ) : (
          <p>No manhwa series found. Add a new one to get started.</p>
        )}
      </div>

      {/* Add New Manhwa Modal */}
      <Modal isOpen={isModalOpen} onRequestClose={closeModal} style={customModalStyles} contentLabel="Add New Manhwa">
        <h2 className="text-xl font-bold mb-4">Add New Manhwa Series</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Title <span className="text-red-500">*</span></label>
            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
          </div>
          <div>
            <label className="block mb-1">Author</label>
            <input type="text" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
          </div>
          <div>
            <label className="block mb-1">Description</label>
            <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600" rows={3}></textarea>
          </div>
          <div>
            <label className="block mb-1">Cover Image URL</label>
            <input type="text" value={newCoverUrl} onChange={e => setNewCoverUrl(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
          <button onClick={handleAddNewManhwa} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md">Save Manhwa</button>
        </div>
      </Modal>
    </div>
  );
}