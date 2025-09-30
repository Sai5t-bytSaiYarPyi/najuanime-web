// supabase/functions/save-video-urls/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  SERVICE_ROLE_KEY ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { job, episode_id } = await req.json()
    if (!job || !episode_id) {
      throw new Error("Job data or episode ID is missing.")
    }
    if (job.status !== 'finished') {
      throw new Error(`Job did not finish. Status: ${job.status}`)
    }

    const exportTasks = job.tasks.filter(task => task.operation === 'export/url' && task.status === 'finished');
    if (exportTasks.length === 0) {
      throw new Error("No finished export tasks found.");
    }

    const uploadPromises = exportTasks.map(async (task) => {
      if (task.result?.files?.[0]) {
        const file = task.result.files[0];
        const tempUrl = file.url;
        const resolution = task.name.split('-')[1]; // e.g., '1080p'
        const newFilename = `${resolution}.mp4`;
        const newFilepath = `${episode_id}/${newFilename}`;

        console.log(`Processing ${resolution} for episode ${episode_id}...`);

        // Download the video file from CloudConvert's temporary URL
        const videoResponse = await fetch(tempUrl);
        if (!videoResponse.ok) {
          console.error(`Failed to download file from ${tempUrl}`);
          return null; // Skip this file on download error
        }
        const videoBlob = await videoResponse.blob();

        // Re-upload the file to our 'processed' bucket
        const { error: uploadError } = await supabaseAdmin.storage
          .from('anime-videos-processed')
          .upload(newFilepath, videoBlob, {
            contentType: 'video/mp4',
            upsert: true
          });

        if (uploadError) {
          console.error(`Failed to upload ${newFilepath}:`, uploadError);
          return null; // Skip this file on upload error
        }
        
        // Get the public URL of the newly uploaded file
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('anime-videos-processed')
          .getPublicUrl(newFilepath);
          
        return { resolution, url: publicUrlData.publicUrl };
      }
      return null;
    });

    const results = await Promise.all(uploadPromises);

    const videoUrls: { [key: string]: string } = {};
    results.forEach(result => {
      if (result) {
        videoUrls[result.resolution] = result.url;
      }
    });

    if (Object.keys(videoUrls).length === 0) {
      throw new Error("No videos were successfully processed and uploaded.");
    }

    // Update the anime_episodes table with the public URLs
    const { error: updateError } = await supabaseAdmin
      .from('anime_episodes')
      .update({ video_urls: videoUrls })
      .eq('id', episode_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, urls: videoUrls }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in save-video-urls:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})