// supabase/functions/start-video-processing/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

const CLOUDCONVERT_API_KEY = Deno.env.get('CLOUDCONVERT_API_KEY')
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
    const { series_id, episode_number, title, rawFilePath } = await req.json()
    if (!series_id || !episode_number || !rawFilePath) {
      throw new Error("Request body is missing required fields.")
    }

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage.from('anime-videos-raw').createSignedUrl(rawFilePath, 3600)
    if (signedUrlError) throw signedUrlError

    const { data: newEpisode, error: insertError } = await supabaseAdmin.from('anime_episodes').insert({
      series_id: series_id,
      episode_number: episode_number,
      title: title || null,
      video_urls: null,
    }).select('id').single()

    if (insertError) throw insertError
    if (!newEpisode) throw new Error("Failed to create episode record.")
    const newEpisodeId = newEpisode.id

    const cloudConvertJob = {
      tasks: {
        'import-video': { 
          operation: 'import/url', 
          url: signedUrlData.signedUrl, 
          filename: rawFilePath.split('/').pop() 
        },
        'transcode-1080p': { 
          operation: 'convert', 
          input: 'import-video', 
          output_format: 'mp4', 
          engine: 'ffmpeg', 
          video_codec: 'x264', 
          crf: 23, 
          preset: 'medium', 
          fit: 'scale', 
          width: 1920, 
          audio_codec: 'aac', 
          audio_bitrate: 128 
        },
        'transcode-720p': { 
          operation: 'convert', 
          input: 'import-video', 
          output_format: 'mp4', 
          engine: 'ffmpeg', 
          video_codec: 'x264', 
          crf: 25, 
          preset: 'medium', 
          fit: 'scale', 
          width: 1280, 
          audio_codec: 'aac', 
          audio_bitrate: 128 
        },
        'transcode-480p': { 
          operation: 'convert', 
          input: 'import-video', 
          output_format: 'mp4', 
          engine: 'ffmpeg', 
          video_codec: 'x264', 
          crf: 28, 
          preset: 'medium', 
          fit: 'scale', 
          width: 854, 
          audio_codec: 'aac', 
          audio_bitrate: 96 
        },
        'export-1080p': { 
          operation: 'export/url', 
          input: 'transcode-1080p', 
          inline: false, 
          archive_multiple_files: false 
        },
        'export-720p': { 
          operation: 'export/url', 
          input: 'transcode-720p', 
          inline: false, 
          archive_multiple_files: false 
        },
        'export-480p': { 
          operation: 'export/url', 
          input: 'transcode-480p', 
          inline: false, 
          archive_multiple_files: false 
        },
      },
      tag: 'najuanime-processing'
    }

    const ccResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cloudConvertJob)
    })

    if (!ccResponse.ok) { 
      const errorBody = await ccResponse.text(); 
      throw new Error(`CloudConvert job creation failed: ${errorBody}`) 
    }

    const jobResponse = await ccResponse.json();

    return new Response(JSON.stringify({ success: true, jobId: jobResponse.data.id, episodeId: newEpisodeId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})