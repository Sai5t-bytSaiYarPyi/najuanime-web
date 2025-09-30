// supabase/functions/start-video-processing/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'

// --- START OF FIX ---
// Read the secrets with the new names you set
const CLOUDCONVERT_API_KEY = Deno.env.get('CLOUDCONVERT_API_KEY')
const WEBHOOK_SECRET = Deno.env.get('PROCESSING_SECRET_TOKEN')
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') 
const PROJECT_ID = Deno.env.get('PROJECT_ID')

// We use the Service Role Key for admin actions
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  SERVICE_ROLE_KEY ?? ''
)
// --- END OF FIX ---

serve(async (req) => {
  try {
    const payload = await req.json()
    const record = payload.record 

        // --- START OF FIX ---
    // Check if the file is uploaded to the correct bucket
    if (record.bucket_id !== 'anime-videos-raw') {
      console.log(`Ignoring file from bucket: ${record.bucket_id}`);
      return new Response(JSON.stringify({ message: "Ignoring file from incorrect bucket" }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // --- END OF FIX ---

    const { series_id, episode_number, title } = record.metadata
    const rawFilePath = record.path

    if (!series_id || !episode_number) {
      throw new Error("Series ID or Episode Number is missing from file metadata.")
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
      tasks: {
        'import-video': {
          operation: 'import/supabase',
          project: PROJECT_ID,
          bucket: 'anime-videos-raw',
          key: SERVICE_ROLE_KEY,
          file: rawFilePath,
        },
        'transcode-1080p': {
          operation: 'convert',
          input: 'import-video',
          output_format: 'mp4',
          engine: 'ffmpeg',
          video_codec: 'x264',
          crf: 23,
          preset: 'medium',
          profile: 'high',
          fit: 'scale',
          width: 1920,
          audio_codec: 'aac',
          audio_bitrate: 128,
        },
        'transcode-720p': {
          operation: 'convert',
          input: 'import-video',
          output_format: 'mp4',
          engine: 'ffmpeg',
          video_codec: 'x264',
          crf: 25,
          preset: 'medium',
          profile: 'high',
          fit: 'scale',
          width: 1280,
          audio_codec: 'aac',
          audio_bitrate: 128,
        },
        'transcode-480p': {
          operation: 'convert',
          input: 'import-video',
          output_format: 'mp4',
          engine: 'ffmpeg',
          video_codec: 'x264',
          crf: 28,
          preset: 'medium',
          profile: 'high',
          fit: 'scale',
          width: 854,
          audio_codec: 'aac',
          audio_bitrate: 96,
        },
        'export-1080p': {
          operation: 'export/supabase',
          input: 'transcode-1080p',
          project: PROJECT_ID,
          bucket: 'anime-videos-processed',
          key: SERVICE_ROLE_KEY,
          folder: `${newEpisodeId}/`,
          filename: '1080p.mp4'
        },
        'export-720p': {
          operation: 'export/supabase',
          input: 'transcode-720p',
          project: PROJECT_ID,
          bucket: 'anime-videos-processed',
          key: SERVICE_ROLE_KEY,
          folder: `${newEpisodeId}/`,
          filename: '720p.mp4'
        },
        'export-480p': {
          operation: 'export/supabase',
          input: 'transcode-480p',
          project: PROJECT_ID,
          bucket: 'anime-videos-processed',
          key: SERVICE_ROLE_KEY,
          folder: `${newEpisodeId}/`,
          filename: '480p.mp4'
        },
        'webhook-callback': {
          operation: 'webhook',
          input: ["export-1080p", "export-720p", "export-480p"],
          url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/save-video-urls`,
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': WEBHOOK_SECRET
          }
        }
      },
      tag: 'najuanime-processing'
    }

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
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in start-video-processing:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})