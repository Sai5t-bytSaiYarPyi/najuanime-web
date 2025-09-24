'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Adjusted path
import { Session, User } from '@supabase/supabase-js';

// Define a type for our profile data
type Profile = {
  id: string;
  email: string;
  subscription_status: string;
  subscription_expires_at: string | null;
};

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Check if user has admin role from metadata
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
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Subscription Status</th>
              <th className="text-left p-4">Expires At</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="p-4">{profile.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    profile.subscription_status === 'active' ? 'bg-green-500' : 'bg-gray-600'
                  }`}>
                    {profile.subscription_status}
                  </span>
                </td>
                <td className="p-4">
                  {profile.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString() : 'N/A'}
                </td>
                <td className="p-4">
                  <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}