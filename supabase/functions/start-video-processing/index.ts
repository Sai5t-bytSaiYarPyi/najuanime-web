// supabase/functions/start-video-processing/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

const CLOUDCONVERT_API_KEY = Deno.env.get('CLOUDCONVERT_API_KEY')
const WEBHOOK_SECRET = Deno.env.get('PROCESSING_SECRET_TOKEN')
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')
const PROJECT_ID = Deno.env.get('PROJECT_ID')

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  SERVICE_ROLE_KEY ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- START OF FIX: Get data from request body instead of trigger payload ---
    const { series_id, episode_number, title, rawFilePath } = await req.json()
    // --- END OF FIX ---

    if (!series_id || !episode_number || !rawFilePath) {
      throw new Error("Series ID, Episode Number, or File Path is missing from the request.")
    }

    const { data: newEpisode, error: insertError } = await supabaseAdmin
      .from('anime_episodes')
      .insert({
        series_id: series_id,
        episode_number: episode_number,
        title: title || null,
        video_urls: null,
      })
      .select('id')
      .single()

    if (insertError) throw insertError
    if (!newEpisode) throw new Error("Failed to create episode record.")

    const newEpisodeId = newEpisode.id

    const cloudConvertJob = {
      // ... CloudConvert job tasks remain the same ...
    }
    // ... rest of the function remains the same ...

    // Just to ensure unchanged parts are clear
    const ccResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cloudConvertJob)
    })

    if (!ccResponse.ok) {
      const errorBody = await ccResponse.text()
      throw new Error(`CloudConvert job creation failed: ${errorBody}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in start-video-processing:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})