// src/app/subscribe/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

type Receipt = {
  id: string;
  created_at: string;
  receipt_url: string;
  status: 'pending' | 'approved' | 'rejected';
};

const paymentAccounts = [
    { type: 'KBZPay', phone: '09 885 697 152', name: 'Ma Su Su Latt' },
    { type: 'WavePay', phone: '09 684 324433', name: 'Kyar Paw' },
    { type: 'AYAPay', phone: '09 885 697 152', name: 'Su Su Latt' },
];

export default function SubscribePage() {
  const [user, setUser] = useState<User | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndFetchReceipts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from('payment_receipts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) console.error('Error fetching receipts:', error);
        else setReceipts(data as Receipt[]);
      }
      setLoading(false);
    };
    checkUserAndFetchReceipts();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setReceiptFile(file);
    } else {
        alert('Please select an image file (PNG, JPG, etc.).');
        event.target.value = '';
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !user) {
      alert('Please select a receipt file to upload.');
      return;
    }
    setIsUploading(true);

    const fileName = `${Date.now()}-${receiptFile.name}`;
    const filePath = `${user.id}/${fileName}`; // Folder path is user's UUID

    // 1. Upload to Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, receiptFile);

    if (uploadError) {
      alert(`Error uploading receipt: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    // 2. Insert record into database
    const { error: insertError } = await supabase
      .from('payment_receipts')
      .insert({
        user_id: user.id,
        receipt_url: uploadData.path, // We store the path, not the full URL for private files
      });
    
    if (insertError) {
      alert(`Error saving receipt record: ${insertError.message}`);
    } else {
      alert('Receipt uploaded successfully! We will review it shortly.');
      // Refresh the list
      const { data } = await supabase.from('payment_receipts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setReceipts(data as Receipt[]);
    }

    setIsUploading(false);
    setReceiptFile(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!user) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Please <Link href="/" className="text-green-400 underline ml-2">log in</Link> to subscribe.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Subscription Plan</h1>
        <p className="text-gray-400 mb-8">Choose a payment method, transfer the amount, and upload your receipt here.</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Info */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Payment Details</h2>
            <div className="space-y-4">
              {paymentAccounts.map(acc => (
                <div key={acc.type} className="p-4 bg-gray-700 rounded-md">
                  <p className="font-bold text-lg">{acc.type}</p>
                  <p>Phone: <span className="font-mono">{acc.phone}</span></p>
                  <p>Name: {acc.name}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Upload and History */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Upload Your Receipt</h2>
            <div className="space-y-4">
              <input type="file" onChange={handleFileSelect} accept="image/*" className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
              <button onClick={handleUploadReceipt} disabled={isUploading || !receiptFile} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-2 rounded-md font-semibold">
                {isUploading ? 'Uploading...' : 'Submit Receipt'}
              </button>
            </div>
            
            <hr className="my-6 border-gray-700"/>
            
            <h3 className="text-xl font-bold mb-4">Your Submission History</h3>
            <div className="space-y-2">
              {receipts.length > 0 ? receipts.map(r => (
                <div key={r.id} className="p-3 bg-gray-700 rounded-md flex justify-between items-center">
                  <p>Submitted on: {new Date(r.created_at).toLocaleDateString()}</p>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    r.status === 'approved' ? 'bg-green-500' : r.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    {r.status.toUpperCase()}
                  </span>
                </div>
              )) : <p className="text-gray-400">You have no submission history.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}