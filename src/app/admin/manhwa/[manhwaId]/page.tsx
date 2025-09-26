'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient'; // Adjusted path
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

  useEffect(() => {
    if (manhwaId) {
      const fetchData = async () => {
        setLoading(true);
        // Fetch manhwa details
        const { data: manhwaData, error: manhwaError } = await supabase
          .from('manhwa')
          .select('id, title')
          .eq('id', manhwaId)
          .single();

        // Fetch chapters list
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('manhwa_chapters')
          .select('*')
          .eq('manhwa_id', manhwaId)
          .order('display_order', { ascending: true });
        
        if (manhwaError) console.error('Error fetching manhwa:', manhwaError);
        else setManhwa(manhwaData);

        if (chaptersError) console.error('Error fetching chapters:', chaptersError);
        else setChapters(chaptersData);

        setLoading(false);
      };
      fetchData();
    }
  }, [manhwaId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const handleUpload = async () => {
    // We will write the logic for this in the next step
    alert('Upload functionality will be added next!');
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
        {/* Left Side: Upload Form */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Upload New Chapter</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Chapter Number <span className="text-red-500">*</span></label>
              <input type="number" value={chapterNumber} onChange={e => setChapterNumber(e.target.value)} placeholder="e.g., 1 or 2.5" className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
            </div>
            <div>
              <label className="block mb-1">Chapter Title (Optional)</label>
              <input type="text" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} placeholder="e.g., The Awakening" className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
            </div>
            <div>
              <label className="block mb-1">Chapter PDF File <span className="text-red-500">*</span></label>
              <input type="file" onChange={handleFileSelect} accept=".pdf" className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
            </div>
            <button onClick={handleUpload} disabled={isUploading || !pdfFile || !chapterNumber} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-2 rounded-md font-semibold">
              {isUploading ? 'Uploading...' : 'Upload Chapter'}
            </button>
          </div>
        </div>

        {/* Right Side: Chapter List */}
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
                  <div className="flex gap-2">
                    <button className="text-sm">🔼</button>
                    <button className="text-sm">🔽</button>
                    <button className="text-sm text-red-500">❌</button>
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