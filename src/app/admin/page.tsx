'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link'; // Make sure Link is imported
// ... (the rest of your imports)

// ... (rest of your component logic)

export default function AdminDashboard() {
  // ... (all the existing state and functions: isAdmin, profiles, loading, fetchProfiles, etc.)
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]); // Assuming Profile type is defined
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Your existing useEffect logic to check admin and fetch profiles
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userRoles = session.user.app_metadata?.roles || [];
        if (userRoles.includes('admin')) {
          setIsAdmin(true);
          fetchProfiles(); // Assuming you have this function
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
      if (data) setProfiles(data);
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
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Navigation Section */}
      <div className="flex gap-4 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg flex-1">
          <h2 className="text-xl font-bold mb-2">User Management</h2>
          <p className="text-gray-400 mb-4">View and manage user subscriptions.</p>
          {/* This component is already the user management page, so no link needed or link to itself */}
        </div>
        <Link href="/admin/manhwa" className="bg-gray-800 p-6 rounded-lg flex-1 hover:bg-gray-700 transition-colors">
          <h2 className="text-xl font-bold mb-2">Manhwa Management</h2>
          <p className="text-gray-400 mb-4">Add, edit, and manage manhwa series and chapters.</p>
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-4">User List</h2>
      <div className="overflow-x-auto">
        {/* The rest of your user table code remains here */}
        <table className="min-w-full bg-gray-800 rounded-lg">
            {/* Your table head and body */}
        </table>
      </div>
    </div>
  );
}