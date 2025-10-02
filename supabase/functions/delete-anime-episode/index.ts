// supabase/functions/delete-anime-episode/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Admin 인지 확인
    const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Authentication failed");
    const { data: profile } = await supabaseAdmin.from('profiles').select('roles').eq('id', user.id).single();
    if (!profile || !profile.roles.includes('admin')) {
      throw new Error("User is not an admin.");
    }
    
    const { episode_id } = await req.json();
    if (!episode_id) {
      throw new Error("Episode ID is required.");
    }

    console.log(`Starting deletion for episode_id: ${episode_id}`);

    // Storage မှ video file တွေကို ဖျက်ရန်
    // 1. Processed video တွေကို ဖျက်ခြင်း (folder name က episode_id)
    const { data: processedFiles, error: listProcessedError } = await supabaseAdmin.storage
      .from('anime-videos-processed')
      .list(episode_id);

    if (listProcessedError) console.error(`Could not list processed files for episode ${episode_id}:`, listProcessedError.message);
    if (processedFiles && processedFiles.length > 0) {
      const filePaths = processedFiles.map(f => `${episode_id}/${f.name}`);
      console.log(`Deleting processed files:`, filePaths);
      await supabaseAdmin.storage.from('anime-videos-processed').remove(filePaths);
    }
    
    // 2. Raw video ကို ဖျက်ခြင်း (raw file path ကို database ကနေ ယူရပါမယ်)
    const { data: episodeData } = await supabaseAdmin.from('anime_episodes').select('raw_file_path').eq('id', episode_id).single();
    if (episodeData && episodeData.raw_file_path) {
        console.log(`Deleting raw file: ${episodeData.raw_file_path}`);
        await supabaseAdmin.storage.from('anime-videos-raw').remove([episodeData.raw_file_path]);
    }

    // Database မှ episode record ကို ဖျက်ခြင်း
    const { error: deleteError } = await supabaseAdmin
      .from('anime_episodes')
      .delete()
      .eq('id', episode_id);

    if (deleteError) throw deleteError;

    console.log(`Successfully deleted episode_id: ${episode_id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in delete-anime-episode function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})