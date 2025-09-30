// supabase/functions/delete-anime-series/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

// Admin client for elevated privileges
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get anime_id from the request body
    const { anime_id } = await req.json()
    if (!anime_id) {
      throw new Error("Anime ID is required.")
    }

    // --- Authorization: Optional but good practice ---
    const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("User not found");
    const { data: profile } = await supabaseAdmin.from('profiles').select('roles').eq('id', user.id).single();
    if (!profile || !profile.roles.includes('admin')) {
      throw new Error("User is not an admin.");
    }
    // --- End Authorization ---


    console.log(`Starting deletion process for anime_id: ${anime_id}`);

    // 2. Get all episodes for this anime series
    const { data: episodes, error: episodesError } = await supabaseAdmin
      .from('anime_episodes')
      .select('id')
      .eq('series_id', anime_id)

    if (episodesError) throw new Error(`Could not fetch episodes: ${episodesError.message}`);

    // 3. Delete video files from Storage
    if (episodes && episodes.length > 0) {
      const episodeIds = episodes.map(e => e.id);
      
      // 3a. Delete processed videos (each episode has its own folder)
      for (const episodeId of episodeIds) {
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from('anime-videos-processed')
          .list(episodeId);
        
        if (listError) console.error(`Could not list files for episode ${episodeId}: ${listError.message}`);
        
        if (files && files.length > 0) {
          const filePaths = files.map(f => `${episodeId}/${f.name}`);
          console.log(`Deleting processed files:`, filePaths);
          await supabaseAdmin.storage.from('anime-videos-processed').remove(filePaths);
        }
      }
    }
    
    // 3b. Delete raw videos (all raw videos for a series are in one folder named by anime_id)
    const { data: rawFiles, error: listRawError } = await supabaseAdmin.storage
      .from('anime-videos-raw')
      .list(anime_id);
    
    if (listRawError) console.error(`Could not list raw files for anime ${anime_id}: ${listRawError.message}`);

    if (rawFiles && rawFiles.length > 0) {
        const rawFilePaths = rawFiles.map(f => `${anime_id}/${f.name}`);
        console.log(`Deleting raw files:`, rawFilePaths);
        await supabaseAdmin.storage.from('anime-videos-raw').remove(rawFilePaths);
    }

    // 4. Delete database records (RLS is bypassed by service_role_key)
    console.log(`Deleting database records for anime_id: ${anime_id}`);

    // Delete from anime_genres join table
    await supabaseAdmin.from('anime_genres').delete().eq('anime_id', anime_id);

    // Delete from anime_episodes table
    await supabaseAdmin.from('anime_episodes').delete().eq('series_id', anime_id);

    // Finally, delete the anime_series itself
    const { error: seriesDeleteError } = await supabaseAdmin
      .from('anime_series')
      .delete()
      .eq('id', anime_id)

    if (seriesDeleteError) throw seriesDeleteError;
    
    console.log(`Successfully deleted anime_id: ${anime_id}`);

    return new Response(JSON.stringify({ success: true, message: `Anime series ${anime_id} and all related data deleted.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in delete-anime-series function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})