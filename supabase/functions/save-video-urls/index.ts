// supabase/functions/save-video-urls/index.ts
import { serve } from 'https://www.google.com/search?q=https://deno.land/std%400.177.0/http/server.ts'
import { createClient } from 'https://www.google.com/search?q=https://esm.sh/%40supabase/supabase-js%402.39.8'
import { corsHeaders } from '../_shared/cors.ts'

const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')
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
throw new Error(Job did not finish. Status: ${job.status})
}

const exportTasks = job.tasks.filter(task => task.operation === 'export/url');
if (exportTasks.length === 0) {
  throw new Error("No export tasks found.");
}

const videoUrls: { [key: string]: string } = {};
for (const task of exportTasks) {
  if (task.status === 'finished' && task.result?.files?.[0]) {
    const file = task.result.files[0];
    const tempUrl = file.url;
    
    const resolution = task.name.split('-')[1];
    const newFilename = `${resolution}.mp4`;
    const newFilepath = `${episode_id}/${newFilename}`;

    const videoResponse = await fetch(tempUrl);
    if (!videoResponse.ok) throw new Error(`Failed to download file from ${tempUrl}`);
    
    const videoBlob = await videoResponse.blob();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('anime-videos-processed')
      .upload(newFilepath, videoBlob, { 
        contentType: 'video/mp4', 
        upsert: true 
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('anime-videos-processed')
      .getPublicUrl(newFilepath);
      
    videoUrls[resolution] = publicUrlData.publicUrl;
  }
}

if (Object.keys(videoUrls).length === 0) {
  throw new Error("No videos were processed and uploaded.");
}

const { error: updateError } = await supabaseAdmin
  .from('anime_episodes')
  .update({ video_urls: videoUrls })
  .eq('id', episode_id);

if (updateError) throw updateError;

return new Response(JSON.stringify({ success: true }), { 
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