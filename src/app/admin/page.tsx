// src/app/admin/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import Modal from 'react-modal';

// Types
type Profile = {
  id: string; email: string; naju_id: string;
  subscription_status: 'active' | 'inactive' | 'trialing' | 'expired';
  subscription_expires_at: string | null;
};
type Receipt = {
  id: string; created_at: string; receipt_url: string; status: string;
};

const customModalStyles = {
    content: {
        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        marginRight: '-50%', transform: 'translate(-50%, -50%)',
        backgroundColor: '#1F2937', color: 'white', border: '1px solid #374151',
        borderRadius: '0.5rem', width: '90%', maxWidth: '500px'
    },
    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' },
};

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pendingReceipts, setPendingReceipts] = useState<Receipt[]>([]);
  
  const fetchProfiles = useCallback(async (search: string) => {
    setLoading(true);
    let query = supabase.from('profiles').select('*');
    if (search) {
      query = query.or(`email.ilike.%${search}%,naju_id.ilike.%${search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) console.error("Error fetching profiles", error);
    if (data) setProfiles(data as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.roles?.includes('admin')) { setIsAdmin(true); } 
      else { setIsAdmin(false); setLoading(false); }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles(debouncedSearchTerm);
    }
  }, [isAdmin, debouncedSearchTerm, fetchProfiles]);
  
  const openModal = async (profile: Profile) => {
    setSelectedProfile(profile);
    const { data, error } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if(error) alert('Could not fetch receipts: ' + error.message);
    else setPendingReceipts(data as Receipt[]);
    setIsModalOpen(true);
  };
  
  const closeModal = () => setIsModalOpen(false);

  const handleApproveReceipt = async (receiptId: string, userId: string) => {
    const durationInDays = 30; 
    if (window.confirm(`Approve this receipt and grant a ${durationInDays}-day subscription?`)) {
      setLoading(true);
      const { error } = await supabase.functions.invoke('approve-receipt', {
        body: { 
          receipt_id: receiptId, 
          user_id: userId,
          duration_days: durationInDays
        },
      });
      if (error) {
        alert(`Error approving receipt: ${error.message}`);
      } else {
        alert('Receipt approved and subscription activated!');
        closeModal();
        fetchProfiles(debouncedSearchTerm);
      }
      setLoading(false);
    }
  };

  const handleViewReceipt = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUrl(path, 60); // Link is valid for 60 seconds

    if (error) {
      alert("Could not generate link for receipt: " + error.message);
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  if (!isAdmin && !loading) { return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Access Denied.</div>; }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {/* --- UPDATED GRID --- */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-2">User Management</h2>
          <p className="text-gray-400">View and manage user subscriptions.</p>
        </div>
        <Link href="/admin/manhwa" className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
          <h2 className="text-xl font-bold mb-2">Manhwa Management</h2>
          <p className="text-gray-400">Add, edit, and manage manhwa series.</p>
        </Link>
        <Link href="/admin/anime" className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
          <h2 className="text-xl font-bold mb-2">Anime Management</h2>
          <p className="text-gray-400">Add, edit, and manage anime series.</p>
        </Link>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">User List</h2>
        <input type="search" placeholder="Search by Email or User ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"/>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead>
            <tr className="border-b border-gray-700"><th className="text-left p-4">User ID</th><th className="text-left p-4">Email</th><th className="text-left p-4">Subscription Status</th><th className="text-left p-4">Expires At</th><th className="text-left p-4">Actions</th></tr>
          </thead>
          <tbody>
            {loading ? ( <tr><td colSpan={5} className="text-center p-8">Loading...</td></tr> ) : (
              profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="p-4 font-mono">{profile.naju_id}</td><td className="p-4">{profile.email}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-sm font-semibold ${profile.subscription_status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'}`}>{profile.subscription_status}</span></td>
                  <td className="p-4">{profile.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4 flex items-center gap-2">
                    <button onClick={() => openModal(profile)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm">Review</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onRequestClose={closeModal} style={customModalStyles} contentLabel="Review User Submissions">
        <div className="p-2">
            <h2 className="text-xl font-bold mb-2">Review Submissions for</h2>
            <p className="text-gray-400 mb-6">{selectedProfile?.email}</p>

            <h3 className="font-bold text-lg mb-4">Pending Receipts</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {pendingReceipts.length > 0 ? (
                    pendingReceipts.map(receipt => (
                        <div key={receipt.id} className="p-4 bg-gray-700 rounded-lg">
                            <p>Submitted: {new Date(receipt.created_at).toLocaleString()}</p>
                            <div className="mt-4 flex gap-4">
                                <button onClick={() => handleViewReceipt(receipt.receipt_url)} className="flex-1 text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">
                                    View Receipt
                                </button>
                                <button onClick={() => handleApproveReceipt(receipt.id, selectedProfile!.id)} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md">
                                    Approve (30 Days)
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400">No pending receipts found for this user.</p>
                )}
            </div>
            <button onClick={closeModal} className="mt-6 w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Close</button>
        </div>
      </Modal>
    </div>
  );
}