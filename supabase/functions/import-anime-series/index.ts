// supabase/functions/import-anime-series/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Check if user is an admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("User not found");
    
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.roles.includes('admin')) {
      return new Response(JSON.stringify({ error: 'User is not an admin' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    
    // 2. Get the anime data from the request body
    const { animeData, genres } = await req.json();
    if (!animeData || !genres) {
        throw new Error("Anime data or genres are missing.");
    }
    
    // 3. Handle Genres: Upsert (insert if not exist) and get their IDs
    const genreIds = [];
    for (const genreName of genres) {
        // Check if genre exists
        let { data: existingGenre } = await supabaseClient
            .from('genres')
            .select('id')
            .eq('name', genreName)
            .single();

        if (existingGenre) {
            genreIds.push(existingGenre.id);
        } else {
            // Insert new genre if it doesn't exist
            const { data: newGenre, error: insertGenreError } = await supabaseClient
                .from('genres')
                .insert({ name: genreName })
                .select('id')
                .single();
            
            if (insertGenreError) throw insertGenreError;
            if (newGenre) genreIds.push(newGenre.id);
        }
    }

    // 4. Insert the main anime series data
    const { data: newAnimeSeries, error: insertAnimeError } = await supabaseClient
        .from('anime_series')
        .insert(animeData)
        .select('id')
        .single();
    
    if (insertAnimeError) throw insertAnimeError;
    if (!newAnimeSeries) throw new Error("Failed to create anime series.");

    // 5. Link genres to the new anime series in the join table
    const animeGenresLinks = genreIds.map(genreId => ({
        anime_id: newAnimeSeries.id,
        genre_id: genreId
    }));

    const { error: linkGenresError } = await supabaseClient
        .from('anime_genres')
        .insert(animeGenresLinks);
    
    if (linkGenresError) throw linkGenresError;

    return new Response(JSON.stringify({ success: true, anime_id: newAnimeSeries.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})