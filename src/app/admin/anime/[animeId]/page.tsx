// src/app/admin/anime/[animeId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type VideoUrls = {
  '1080p'?: string;
  '720p'?: string;
  '480p'?: string;
};

type AnimeSeries = {
  id: string;
  title_english: string;
};
type Episode = {
  id: string;
  episode_number: number;
  title: string | null;
  video_urls: VideoUrls | null;
};

export default function ManageEpisodesPage() {
  const params = useParams();
  const animeId = params.animeId as string;

  const [series, setSeries] = useState<AnimeSeries | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('Upload Episode');

  const fetchData = useCallback(async () => {
    if (!animeId) return;
    setLoading(true);
    const { data: seriesData } = await supabase.from('anime_series').select('id, title_english').eq('id', animeId).single();
    setSeries(seriesData);
    const { data: episodesData } = await supabase.from('anime_episodes').select('*').eq('series_id', animeId).order('episode_number', { ascending: true });
    setEpisodes(episodesData || []);
    setLoading(false);
  }, [animeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
    } else {
      alert('Please select a valid video file.');
      event.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !episodeNumber || !animeId) {
      alert('Episode number and a video file are required.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('1/4: Uploading file...');

    try {
      const fileName = `${Date.now()}-${videoFile.name.replace(/\s+/g, '-')}`;
      const filePath = `${animeId}/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('anime-videos-raw').upload(filePath, videoFile, { upsert: false, contentType: videoFile.type });
      if (uploadError) throw uploadError;

      setUploadStatus('2/4: Starting processing job...');
      const { data: startData, error: functionError } = await supabase.functions.invoke('start-video-processing', { body: { series_id: animeId, episode_number: episodeNumber, title: episodeTitle, rawFilePath: uploadData.path } });
      if (functionError) throw new Error(`Starting job failed: ${functionError.message}`);

      const { jobId, episodeId } = startData;
      if (!jobId || !episodeId) throw new Error("Failed to get Job ID or Episode ID from processing function.");
      
      setUploadStatus('3/4: Processing video (polling)...');
      setEpisodeNumber(''); setEpisodeTitle(''); setVideoFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await fetchData();

      const pollInterval = setInterval(async () => {
        try {
          console.log(`Polling for job ID: ${jobId}...`);
          const { data: statusData, error: pollError } = await supabase.functions.invoke('check-job-status', { body: { job_id: jobId } });

          console.log('Poll Response Data:', statusData);
          if (pollError) {
              console.error('Polling function invocation failed:', pollError);
          }

          if (pollError) { clearInterval(pollInterval); throw pollError; }
          
          if (statusData && statusData.status === 'finished') {
            clearInterval(pollInterval);
            console.log('Job finished! Now calling save-video-urls...');
            setUploadStatus('4/4: Saving results...');
            
            const { error: saveError } = await supabase.functions.invoke('save-video-urls', { body: { job: statusData, episode_id: episodeId } });
            
            if (saveError) {
              console.error('save-video-urls function failed:', saveError);
              throw new Error(`Saving results failed: ${saveError.message}`);
            }
            
            alert('Episode is now ready!');
            await fetchData();
            setIsUploading(false);
            setUploadStatus('Upload Episode');

          } else if (statusData && statusData.status === 'error') {
            clearInterval(pollInterval);
            console.error('CloudConvert job failed with status "error". Full data:', statusData);
            alert(`Video processing failed on CloudConvert. Check the browser console for details. Job ID: ${jobId}`);
            setIsUploading(false);
            setUploadStatus('Upload Episode');
          } else {
            console.log(`Current job status: ${statusData?.status || 'unknown'}`);
          }
        } catch (error: unknown) { // FIX: Changed from 'any' to 'unknown'
          clearInterval(pollInterval);
          const errorMessage = error instanceof Error ? error.message : "An unknown polling error occurred.";
          console.error(`Polling process caught an error: ${errorMessage}`);
          alert(`An error occurred while checking status: ${errorMessage}`);
          setIsUploading(false);
          setUploadStatus('Upload Episode');
          await fetchData();
        }
      }, 15000);

    } catch (error: unknown) { // FIX: Changed from 'any' to 'unknown'
      const errorMessage = error instanceof Error ? error.message : "An unknown upload error occurred.";
      console.error('Upload process failed:', errorMessage);
      alert(`Error: ${errorMessage}`);
      setIsUploading(false);
      setUploadStatus('Upload Episode');
    }
  };

  if (loading) { return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>; }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Link href="/admin/anime" className="text-blue-400 hover:underline mb-6 block">← Back to Anime Series List</Link>
      <h1 className="text-3xl font-bold mb-2">Manage Episodes for: <span className="text-green-400">{series?.title_english}</span></h1>
      <p className="text-gray-400 mb-8">Upload new episodes and manage existing ones.</p>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Upload New Episode</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Episode Number <span className="text-red-500">*</span></label>
              <input type="number" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)} placeholder="e.g., 1" className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
            </div>
            <div>
              <label className="block mb-1">Episode Title (Optional)</label>
              <input type="text" value={episodeTitle} onChange={e => setEpisodeTitle(e.target.value)} placeholder="e.g., The Adventure Begins" className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
            </div>
            <div>
              <label className="block mb-1">1080p Video File <span className="text-red-500">*</span></label>
              <input type="file" onChange={handleFileSelect} accept="video/*" className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
            </div>
            <button onClick={handleUpload} disabled={isUploading || !videoFile || !episodeNumber} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed px-4 py-2 rounded-md font-semibold">
              {isUploading ? uploadStatus : 'Upload Episode'}
            </button>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Existing Episodes</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {episodes.length > 0 ? (
              episodes.map(ep => (
                <div key={ep.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                  <div>
                    <p className="font-bold">Episode {ep.episode_number}</p>
                    <p className="text-sm text-gray-400">{ep.title || 'No Title'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ep.video_urls ? <span className="text-xs text-green-400">Ready</span> : <span className="text-xs text-yellow-400 animate-pulse">Processing...</span>}
                    <button className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded disabled:bg-gray-500" disabled>Delete</button>
                  </div>
                </div>
              ))
            ) : ( <p className="text-gray-400">No episodes found for this series yet.</p> )}
          </div>
        </div>
      </div>
    </div>
  );
}