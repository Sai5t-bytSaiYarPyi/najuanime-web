// supabase/functions/set-subscription-expiry/index.ts
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
    // Admin role ကို စစ်ဆေးရန်
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
    
    const { user_id, days_to_add } = await req.json();
    if (!user_id || !days_to_add) {
      throw new Error("user_id and days_to_add are required.");
    }

    // လက်ရှိ profile data ကို ဆွဲထုတ်ပါ
    const { data: targetProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('subscription_expires_at')
        .eq('id', user_id)
        .single();
    
    if (fetchError) throw fetchError;

    let newExpiryDate;
    const today = new Date();
    const currentExpiry = targetProfile.subscription_expires_at ? new Date(targetProfile.subscription_expires_at) : null;

    // အကယ်၍ subscription က မကုန်သေးဘူး (သို့) ဒီနေ့ထက် နောက်ကျနေသေးရင်၊ ရှိပြီးသားရက်ပေါ်မှာ ထပ်ပေါင်းပါ။
    if (currentExpiry && currentExpiry > today) {
        newExpiryDate = new Date(currentExpiry);
        newExpiryDate.setDate(newExpiryDate.getDate() + parseInt(days_to_add));
    } else {
        // သက်တမ်းကုန်နေပြီဆိုရင် ဒီနေ့ရက်ကနေစပြီး ရက်ထပ်ပေါင်းပါ။
        newExpiryDate = new Date(today);
        newExpiryDate.setDate(newExpiryDate.getDate() + parseInt(days_to_add));
    }
    
    // Database ကို update လုပ်ပါ
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        subscription_status: 'active',
        subscription_expires_at: newExpiryDate.toISOString() 
      })
      .eq('id', user_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, message: `Subscription for user ${user_id} has been updated.` }), {
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