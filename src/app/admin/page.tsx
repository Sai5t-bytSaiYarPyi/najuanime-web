'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Modal from 'react-modal';

// Define a type for our profile data
type Profile = {
  id: string;
  email: string;
  subscription_status: 'active' | 'inactive' | 'trialing' | 'expired';
  subscription_expires_at: string | null;
};

// Custom styles for the modal
const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#1F2937', // bg-gray-800
    color: 'white',
    border: '1px solid #374151', // border-gray-700
    borderRadius: '0.5rem',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
};

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [newStatus, setNewStatus] = useState<Profile['subscription_status']>('inactive');
  const [newExpiryDate, setNewExpiryDate] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userRoles = session.user.app_metadata?.roles || [];
        if (userRoles.includes('admin')) {
          setIsAdmin(true);
          fetchProfiles();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Error fetching profiles:', error);
    } else if (data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  const openModal = (profile: Profile) => {
    setSelectedProfile(profile);
    setNewStatus(profile.subscription_status);
    setNewExpiryDate(profile.subscription_expires_at ? profile.subscription_expires_at.split('T')[0] : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProfile(null);
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: newStatus,
        subscription_expires_at: newExpiryDate || null
      })
      .eq('id', selectedProfile.id);

    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      alert('Profile updated successfully!');
      fetchProfiles(); // Refresh the list
      closeModal();
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Access Denied. You are not an admin.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard - User Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 rounded-lg">
          {/* Table Head */}
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Subscription Status</th>
              <th className="text-left p-4">Expires At</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="p-4">{profile.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                    profile.subscription_status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'
                  }`}>
                    {profile.subscription_status}
                  </span>
                </td>
                <td className="p-4">{profile.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : 'N/A'}</td>
                <td className="p-4">
                  <button onClick={() => openModal(profile)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={customModalStyles}
        contentLabel="Edit User Profile"
        // appElement={...}  <-- Error တက်စေတဲ့ ဒီတစ်ကြောင်းကို လုံးဝဖယ်ရှားလိုက်ပါပြီ
      >
        <h2 className="text-xl font-bold mb-4">Edit: {selectedProfile?.email}</h2>
        <div className="mb-4">
          <label className="block mb-2">Subscription Status</label>
          <select 
            value={newStatus} 
            onChange={(e) => setNewStatus(e.target.value as Profile['subscription_status'])}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          >
            <option value="inactive">Inactive</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="mb-6">
          <label className="block mb-2">Subscription Expires At</label>
          <input type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
          <button onClick={handleUpdateProfile} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-md">Save Changes</button>
        </div>
      </Modal>
    </div>
  );
}