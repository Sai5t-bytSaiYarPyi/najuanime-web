// supabase/functions/check-job-status/index.ts
import { serve } from 'https://www.google.com/search?q=https://deno.land/std%400.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const CLOUDCONVERT_API_KEY = Deno.env.get('CLOUDCONVERT_API_KEY')

serve(async (req) => {
if (req.method === 'OPTIONS') {
return new Response('ok', { headers: corsHeaders })
}

try {
const { job_id } = await req.json()
if (!job_id) {
throw new Error('Job ID is required.')
}

const ccResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${job_id}`, {
  headers: {
    'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
  },
})

if (!ccResponse.ok) {
  const errorBody = await ccResponse.text()
  throw new Error(`CloudConvert job check failed: ${errorBody}`)
}

const jobData = await ccResponse.json()

return new Response(JSON.stringify(jobData.data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})


} catch (error) {
return new Response(JSON.stringify({ error: error.message }), {
headers: { ...corsHeaders, 'Content-Type': 'application/json' },
status: 400,
})
}
})