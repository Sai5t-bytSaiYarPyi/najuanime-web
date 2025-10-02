// src/components/VideoPlayer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, Clapperboard, Loader } from 'lucide-react';

type VideoUrls = {
  '1080p'?: string;
  '720p'?: string;
  '480p'?: string;
  [key: string]: string | undefined;
};

// --- START: Props Type ကို ပြင်ဆင်ခြင်း ---
// animeTitle နှင့် episodeNumber ကို props အဖြစ် လက်ခံရန် ထည့်သွင်းလိုက်သည်။
type Props = {
  videoUrls: VideoUrls | null;
  animeTitle: string;
  episodeNumber: number;
};
// --- END: Props Type ကို ပြင်ဆင်ခြင်း ---

export default function VideoPlayer({ videoUrls, animeTitle, episodeNumber }: Props) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [availableResolutions, setAvailableResolutions] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (videoUrls) {
      const resolutions = ['1080p', '720p', '480p'].filter(res => videoUrls[res]);
      setAvailableResolutions(resolutions);
      setActiveUrl(videoUrls['1080p'] || videoUrls['720p'] || videoUrls['480p'] || null);
    }
  }, [videoUrls]);

  const handleDownload = async (url: string, resolution: string) => {
    setDownloading(resolution);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;

      // --- START: Download filename ကို ပြင်ဆင်ခြင်း ---
      // animeTitle နှင့် episodeNumber ကို အသုံးပြုပြီး filename အသစ် သတ်မှတ်လိုက်သည်။
      a.download = `${animeTitle}-Episode-${episodeNumber}-${resolution}.mp4`; 
      // --- END: Download filename ကို ပြင်ဆင်ခြင်း ---
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Could not download the file. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

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
        </div>
      </div>
    </div>
  );
}