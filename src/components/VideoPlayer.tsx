// src/components/VideoPlayer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, Clapperboard, Loader } from 'lucide-react'; // Added Loader icon

type VideoUrls = {
  '1080p'?: string;
  '720p'?: string;
  '480p'?: string;
  [key: string]: string | undefined;
};

type Props = {
  videoUrls: VideoUrls | null;
};

export default function VideoPlayer({ videoUrls }: Props) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [availableResolutions, setAvailableResolutions] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null); // State to track which resolution is downloading

  useEffect(() => {
    if (videoUrls) {
      const resolutions = ['1080p', '720p', '480p'].filter(res => videoUrls[res]);
      setAvailableResolutions(resolutions);
      setActiveUrl(videoUrls['1080p'] || videoUrls['720p'] || videoUrls['480p'] || null);
    }
  }, [videoUrls]);

  // --- START: NEW DOWNLOAD HANDLER FUNCTION ---
  const handleDownload = async (url: string, resolution: string) => {
    setDownloading(resolution); // Set loading state for this button
    try {
      // 1. Fetch the video file as a blob
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();

      // 2. Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // 3. Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      // You can set a custom filename here if you want
      a.download = `naju-anime-episode-${resolution}.mp4`; 
      document.body.appendChild(a);
      a.click();

      // 4. Clean up the temporary URL and element
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Could not download the file. Please try again.');
    } finally {
      setDownloading(null); // Reset loading state
    }
  };
  // --- END: NEW DOWNLOAD HANDLER FUNCTION ---


  if (!videoUrls || !activeUrl) {
    return (
      <div className="aspect-video w-full bg-gray-800 flex flex-col items-center justify-center rounded-lg">
        <Clapperboard size={48} className="text-gray-500 mb-4" />
        <h3 className="text-xl font-bold">Video is Processing</h3>
        <p className="text-gray-400">This episode is not yet available. Please check back later.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
        <video key={activeUrl} controls autoPlay className="w-full h-full">
          <source src={activeUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 p-3 bg-gray-800/50 rounded-md">
        <div>
            <span className="text-sm font-bold mr-2">Quality:</span>
            {availableResolutions.map(res => (
                <button
                    key={res}
                    onClick={() => setActiveUrl(videoUrls[res]!)}
                    className={`px-3 py-1 text-sm rounded-md mr-2 ${activeUrl === videoUrls[res] ? 'bg-accent-green text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    {res}
                </button>
            ))}
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold mr-2">Download:</span>
            {/* --- START: MODIFIED DOWNLOAD BUTTONS --- */}
            {availableResolutions.map(res => (
                <button
                    key={`dl-${res}`}
                    onClick={() => handleDownload(videoUrls[res]!, res)}
                    disabled={!!downloading}
                    className="flex items-center gap-1.5 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-gray-500 disabled:cursor-wait"
                >
                    {downloading === res ? (
                        <>
                            <Loader size={14} className="animate-spin" /> Preparing...
                        </>
                    ) : (
                        <>
                            <Download size={14} /> {res}
                        </>
                    )}
                </button>
            ))}
            {/* --- END: MODIFIED DOWNLOAD BUTTONS --- */}
        </div>
      </div>
    </div>
  );
}