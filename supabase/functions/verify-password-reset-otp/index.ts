// supabase/functions/verify-password-reset-otp/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// --- Helper Function (request function ထဲက එකနဲ့ တူရမည်) ---
async function hashOtp(otp: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    SERVICE_ROLE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      throw new Error('Email, OTP, and new password are required.');
    }
     if (!SERVICE_ROLE_KEY) {
        throw new Error('Service Role Key is not configured.');
    }
    if (newPassword.length < 6) { // Supabase's minimum password length
        throw new Error('Password must be at least 6 characters long.');
    }


    // ၁။ Database ထဲမှာ သက်ဆိုင်ရာ OTP token ကို ရှာပါ
    const now = new Date();
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id, hashed_token, expires_at, used_at')
      .eq('user_email', email)
      // .is('used_at', null) // အသုံးမပြုရသေးတဲ့ token ကိုပဲ ရှာ (optional)
      .order('created_at', { ascending: false }) // နောက်ဆုံး token ကို အရင်ရှာ
      .limit(1)
      .maybeSingle();

    if (tokenError) {
      console.error('Error fetching OTP token:', tokenError);
      throw new Error('Could not verify OTP. Please try requesting a new one.');
    }

    if (!tokenData) {
      throw new Error('No valid OTP found for this email or it has expired. Please request a new one.');
    }

     // ၂။ Token သက်တမ်းကုန်၊ မကုန် စစ်ဆေးပါ
     if (new Date(tokenData.expires_at) < now) {
        // Expired token ကို ဖျက်ပါ (optional cleanup)
        await supabaseAdmin.from('password_reset_tokens').delete().eq('id', tokenData.id);
        throw new Error('OTP code has expired. Please request a new one.');
     }

     // Token အသုံးပြုပြီးသား ဟုတ်မဟုတ် စစ်ဆေးပါ (optional)
     if (tokenData.used_at) {
         throw new Error('This OTP code has already been used. Please request a new one.');
     }

    // ၃။ User ထည့်လိုက်တဲ့ OTP ကို hash လုပ်ပြီး တိုက်စစ်ပါ
    const hashedOtpFromUser = await hashOtp(otp);
    if (hashedOtpFromUser !== tokenData.hashed_token) {
      throw new Error('Invalid OTP code.');
    }

    // --- OTP မှန်ကန်ကြောင်း အတည်ပြုပြီး ---

    // ၄။ User ID ကို ရှာပါ (Password update လုပ်ဖို့ User ID လိုအပ်)
    // Auth schema ထဲက user ကို တိုက်ရိုက် query လုပ်တာ ပိုစိတ်ချရ
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({ email: email });

     if (userError) {
         console.error('Error fetching user ID:', userError);
         throw new Error('Could not find user associated with this email.');
     }
     if (!userData || !userData.users || userData.users.length === 0) {
         throw new Error('User not found.');
     }
     // Assuming email is unique in auth.users
     const userId = userData.users[0].id;


    // ၅။ User ရဲ့ password ကို update လုပ်ပါ (Admin API ကို သုံးပါ)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error('Failed to update password. Please try again.');
    }

    // ၆။ အသုံးပြုပြီးသား OTP token ကို ဖျက် (သို့) update လုပ်ပါ
    // Option A: Delete the token
    // await supabaseAdmin.from('password_reset_tokens').delete().eq('id', tokenData.id);
    // Option B: Mark as used
    await supabaseAdmin.from('password_reset_tokens').update({ used_at: now.toISOString() }).eq('id', tokenData.id);


    console.log(`Password successfully reset for user ${userId}`);

    // Frontend ကို အောင်မြင်ကြောင်း message ပြန်ပေးပါ
    return new Response(JSON.stringify({ message: 'Password updated successfully!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in verify-password-reset-otp function:', error);
    // User-friendly error message ပြန်ပေးပါ
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Bad Request for validation errors, etc.
    });
  }
});