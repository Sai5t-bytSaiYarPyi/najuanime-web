// supabase/functions/save-video-urls/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

const WEBHOOK_SECRET = Deno.env.get('PROCESSING_SECRET_TOKEN')
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  SERVICE_ROLE_KEY ?? ''
)

serve(async (req) => {
  // 1. Verify the webhook secret to ensure the request is from CloudConvert
  const receivedSecret = req.headers.get('x-webhook-secret')
  if (receivedSecret !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json()
    const job = payload.job
    
    if (job.status !== 'finished') {
      // Could be an error, log it for debugging
      console.log(`Job ${job.id} did not finish successfully. Status: ${job.status}`);
      // Handle error case if needed, e.g., update DB with an error status
      return new Response(JSON.stringify({ message: "Job did not finish" }));
    }

    // 2. Find the export tasks and extract the URLs and episode ID
    const exportTasks = job.tasks.filter(task => task.operation === 'export/supabase');
    if (exportTasks.length === 0) throw new Error("No export tasks found in the job payload.");

    const videoUrls: { [key: string]: string } = {};
    let episodeId: string | null = null;

    for (const task of exportTasks) {
      if (task.status === 'finished' && task.result?.files?.[0]) {
        const file = task.result.files[0];
        const publicUrl = file.url;
        
        // Extract resolution from filename (e.g., '1080p' from '1080p.mp4')
        const resolution = file.filename.split('.')[0];
        videoUrls[resolution] = publicUrl;

        // Extract episodeId from the folder path (it's the same for all exports)
        if (!episodeId && file.extra?.folder) {
          episodeId = file.extra.folder.replace('/', '');
        }
      }
    }
    
    if (!episodeId) throw new Error("Could not determine episode ID from job payload.");

    // 3. Update the corresponding record in the anime_episodes table
    const { error: updateError } = await supabaseAdmin
      .from('anime_episodes')
      .update({ video_urls: videoUrls })
      .eq('id', episodeId);

    if (updateError) throw updateError;
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in save-video-urls:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})