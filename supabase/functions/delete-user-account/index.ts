// supabase/functions/delete-user-account/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8'
import { corsHeaders } from '../_shared/cors.ts'

// Admin client (Service Role)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // OPTIONS request ကို ကိုင်တွယ်ခြင်း
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. User client တစ်ခု ဖန်တီးပြီး request header က token နဲ့ user ကို ယူပါ
    // ဒါမှ ဘယ် user က ဒီ function ကို ခေါ်နေလဲ သိနိုင်မှာပါ
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      throw new Error("Authentication failed. User not found.");
    }

    const userId = user.id;
    const userEmail = user.email;

    console.log(`[Delete User] Starting deletion for user ID: ${userId}`);

    // 2. Admin client ကိုသုံးပြီး auth.users table ထဲက user ကို ဖျက်ပါ
    // ဒါက အဓိက အလုပ်ပါ။
    const { error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthUserError) {
      // User ကို မဖျက်နိုင်ခဲ့ရင် (ဥပမာ- RLS ကြောင့်) error ပြန်ပါ
      console.error(`[Delete User] Failed to delete auth user: ${deleteAuthUserError.message}`);
      throw new Error(`Failed to delete user from authentication: ${deleteAuthUserError.message}`);
    }

    // 3. (Safety Check) - Email နဲ့ ဆက်စပ်နေတဲ့ token တွေကိုပါ ရှင်းလင်း
    // auth.users ပျက်သွားရင် Cascade delete ကြောင့် profiles ပါ ပျက်သွားပါပြီ။
    // ဒါပေမယ့် တခြား table တွေ (ဥပမာ- password reset tokens) မှာ email နဲ့ ချိတ်ထားတာ ကျန်နေနိုင်လို့ ရှင်းထုတ်ပါမယ်။
    if (userEmail) {
        await supabaseAdmin.from('signup_tokens').delete().eq('user_email', userEmail);
        await supabaseAdmin.from('password_reset_tokens').delete().eq('user_email', userEmail);
    }

    console.log(`[Delete User] Successfully deleted user ID: ${userId}`);

    // 4. အောင်မြင်ကြောင်း response ပြန်ပို့ပါ
    return new Response(JSON.stringify({ success: true, message: 'Account deleted successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})