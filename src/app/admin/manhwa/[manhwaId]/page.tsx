'use client';

import { useEffect, useState, useCallback } from 'react';
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

  // Form state
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!manhwaId) return;
    setLoading(true);
    const { data: manhwaData } = await supabase.from('manhwa').select('id, title').eq('id', manhwaId).single();
    setManhwa(manhwaData);

    const { data: chaptersData } = await supabase.from('manhwa_chapters').select('*').eq('manhwa_id', manhwaId).order('display_order', { ascending: true });
    setChapters(chaptersData || []);
    
    setLoading(false);
  }, [manhwaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Please select a PDF file.');
      event.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!pdfFile || !chapterNumber || !manhwaId) {
      alert('Chapter number and a PDF file are required.');
      return;
    }
    
    setIsUploading(true);

    const sanitizedFileName = pdfFile.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const filePath = `${manhwaId}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('manhwa-pdfs')
      .upload(filePath, pdfFile);

    if (uploadError) {
      alert('Error uploading file: ' + uploadError.message);
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('manhwa-pdfs')
      .getPublicUrl(uploadData.path);

    if (!urlData.publicUrl) {
        alert('Could not get public URL for the uploaded file.');
        setIsUploading(false);
        return;
    }

    const highestOrder = chapters.reduce((max, ch) => ch.display_order > max ? ch.display_order : max, 0);
    const newDisplayOrder = highestOrder + 1;

    const { error: insertError } = await supabase.from('manhwa_chapters').insert({
        manhwa_id: manhwaId,
        chapter_number: parseFloat(chapterNumber),
        title: chapterTitle || null,
        pdf_url: urlData.publicUrl,
        display_order: newDisplayOrder,
        image_urls: [],
    });

    if (insertError) {
      alert('Error saving chapter details: ' + insertError.message);
      await supabase.storage.from('manhwa-pdfs').remove([filePath]);
    } else {
      alert('Chapter uploaded successfully! Processing will start in the background.');
      setChapterNumber('');
      setChapterTitle('');
      setPdfFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setTimeout(() => {
        fetchData();
      }, 1000);
    }

    setIsUploading(false);
  };

  // --- START OF NEW FUNCTIONS ---
  const handleReorder = async (chapterId: string, direction: 'up' | 'down') => {
    setLoading(true);
    const { error } = await supabase.functions.invoke('reorder-manhwa-chapters', {
      body: { chapter_id: chapterId, direction: direction },
    });
    if (error) alert(`Error reordering: ${error.message}`);
    await fetchData(); // Refetch to show new order
    setLoading(false);
  };

  const handleDelete = async (chapterId: string, chapterNumber: number) => {
    if (window.confirm(`Are you sure you want to delete Chapter ${chapterNumber}? This will also delete all its images and the PDF.`)) {
      setLoading(true);
      const { error } = await supabase.functions.invoke('delete-manhwa-chapter', {
        body: { chapter_id: chapterId },
      });
      if (error) alert(`Error deleting: ${error.message}`);
      else alert(`Chapter ${chapterNumber} deleted successfully.`);
      await fetchData();
      setLoading(false);
    }
  };
  // --- END OF NEW FUNCTIONS ---

  if (loading) { return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>; }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin/manhwa" className="text-blue-400 hover:underline mb-6 block">&larr; Back to Manhwa List</Link>
      <h1 className="text-3xl font-bold mb-2">Manage Chapters for: <span className="text-green-400">{manhwa?.title}</span></h1>
      <p className="text-gray-400 mb-8">Here you can upload, reorder, and delete chapters.</p>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Form Section */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Upload New Chapter</h2>
          <div className="space-y-4">
            <div><label className="block mb-1">Chapter Number <span className="text-red-500">*</span></label><input type="number" value={chapterNumber} onChange={e => setChapterNumber(e.target.value)} placeholder="e.g., 1 or 2.5" className="w-full p-2 rounded bg-gray-700 border border-gray-600" /></div>
            <div><label className="block mb-1">Chapter Title (Optional)</label><input type="text" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} placeholder="e.g., The Awakening" className="w-full p-2 rounded bg-gray-700 border border-gray-600" /></div>
            <div><label className="block mb-1">Chapter PDF File <span className="text-red-500">*</span></label><input type="file" onChange={handleFileSelect} accept=".pdf" className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/></div>
            <button onClick={handleUpload} disabled={isUploading || !pdfFile || !chapterNumber} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-2 rounded-md font-semibold">{isUploading ? 'Uploading...' : 'Upload Chapter'}</button>
          </div>
        </div>

        {/* Existing Chapters List Section */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Existing Chapters</h2>
          <div className="space-y-2">
            {chapters.length > 0 ? ( 
              chapters.map(chapter => ( 
                <div key={chapter.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                  <div>
                    <p className="font-bold">Chapter {chapter.chapter_number}</p>
                    <p className="text-sm text-gray-400">{chapter.title || 'No Title'}</p>
                  </div>
                  {/* --- UPDATED BUTTONS WITH ACTIONS --- */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleReorder(chapter.id, 'up')} className="p-1 hover:bg-gray-600 rounded-full" title="Move Up">🔼</button>
                    <button onClick={() => handleReorder(chapter.id, 'down')} className="p-1 hover:bg-gray-600 rounded-full" title="Move Down">🔽</button>
                    <button onClick={() => handleDelete(chapter.id, chapter.chapter_number)} className="p-1 text-red-500 hover:bg-gray-600 rounded-full" title="Delete">❌</button>
                  </div>
                </div> 
              )) 
            ) : ( 
              <p className="text-gray-400">No chapters found for this manhwa yet.</p> 
            )}
          </div>
        </div>
      </div>
    </div>
  );
}