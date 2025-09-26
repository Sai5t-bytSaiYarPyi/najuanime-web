'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Type definitions
type Manhwa = {
  id: string;
  title: string;
};
type Chapter = {
  id: string;
  chapter_number: number;
  title: string | null;
  display_order: number;
};

export default function ManageChaptersPage() {
  const params = useParams();
  const manhwaId = params.manhwaId as string;

  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  // State for new chapter upload form
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Re-usable fetch function
  const fetchData = async () => {
    // Fetch manhwa details
    const { data: manhwaData } = await supabase.from('manhwa').select('id, title').eq('id', manhwaId).single();
    setManhwa(manhwaData);

    // Fetch chapters list
    const { data: chaptersData } = await supabase.from('manhwa_chapters').select('*').eq('manhwa_id', manhwaId).order('display_order', { ascending: true });
    setChapters(chaptersData || []);
    
    setLoading(false);
  };

  useEffect(() => {
    if (manhwaId) {
      fetchData();
    }
  }, [manhwaId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Please select a PDF file.');
      event.target.value = ''; // Clear the input
    }
  };

  const handleUpload = async () => {
    if (!pdfFile || !chapterNumber || !manhwaId) {
      alert('Chapter number and a PDF file are required.');
      return;
    }
    
    setIsUploading(true);

    // 1. Upload PDF file to Supabase Storage
    const fileName = `${Date.now()}-${pdfFile.name}`;
    const filePath = `${manhwaId}/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('manhwa-pdfs')
      .upload(filePath, pdfFile);

    if (uploadError) {
      alert('Error uploading file: ' + uploadError.message);
      setIsUploading(false);
      return;
    }

    // 2. Get the public URL of the uploaded file
    const { data: urlData } = supabase.storage
      .from('manhwa-pdfs')
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
        alert('Could not get public URL for the uploaded file.');
        setIsUploading(false);
        return;
    }

    // 3. Get the next display_order number
    const highestOrder = chapters.reduce((max, ch) => ch.display_order > max ? ch.display_order : max, 0);
    const newDisplayOrder = highestOrder + 1;

    // 4. Insert chapter details into the database
    const { error: insertError } = await supabase
      .from('manhwa_chapters')
      .insert({
        manhwa_id: manhwaId,
        chapter_number: parseFloat(chapterNumber),
        title: chapterTitle || null,
        pdf_url: urlData.publicUrl,
        display_order: newDisplayOrder,
        // image_urls will be populated by an edge function later
      });

    if (insertError) {
      alert('Error saving chapter details: ' + insertError.message);
      // Clean up by deleting the uploaded file if DB insert fails
      await supabase.storage.from('manhwa-pdfs').remove([filePath]);
    } else {
      alert('Chapter uploaded successfully!');
      // Refresh the chapter list
      fetchData();
      // Clear the form
      setChapterNumber('');
      setChapterTitle('');
      setPdfFile(null);
      // This is a trick to clear the file input visually
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }

    setIsUploading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin/manhwa" className="text-blue-400 hover:underline mb-6 block">&larr; Back to Manhwa List</Link>
      <h1 className="text-3xl font-bold mb-2">Manage Chapters for: <span className="text-green-400">{manhwa?.title}</span></h1>
      <p className="text-gray-400 mb-8">Here you can upload, reorder, and delete chapters.</p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Upload New Chapter</h2>
          <div className="space-y-4">
            <div><label className="block mb-1">Chapter Number <span className="text-red-500">*</span></label><input type="number" value={chapterNumber} onChange={e => setChapterNumber(e.target.value)} placeholder="e.g., 1 or 2.5" className="w-full p-2 rounded bg-gray-700 border border-gray-600" /></div>
            <div><label className="block mb-1">Chapter Title (Optional)</label><input type="text" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} placeholder="e.g., The Awakening" className="w-full p-2 rounded bg-gray-700 border border-gray-600" /></div>
            <div><label className="block mb-1">Chapter PDF File <span className="text-red-500">*</span></label><input type="file" onChange={handleFileSelect} accept=".pdf" className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/></div>
            <button onClick={handleUpload} disabled={isUploading || !pdfFile || !chapterNumber} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-2 rounded-md font-semibold">{isUploading ? 'Uploading...' : 'Upload Chapter'}</button>
          </div>
        </div>
        {/* Chapter List */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Existing Chapters</h2>
          <div className="space-y-2">
            {chapters.length > 0 ? ( chapters.map(chapter => ( <div key={chapter.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md"><div><p className="font-bold">Chapter {chapter.chapter_number}</p><p className="text-sm text-gray-400">{chapter.title || 'No Title'}</p></div><div className="flex gap-2"><button className="text-sm">🔼</button><button className="text-sm">🔽</button><button className="text-sm text-red-500">❌</button></div></div> )) ) : ( <p className="text-gray-400">No chapters found for this manhwa yet.</p> )}
          </div>
        </div>
      </div>
    </div>
  );
}