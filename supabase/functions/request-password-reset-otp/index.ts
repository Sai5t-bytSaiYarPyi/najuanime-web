// supabase/functions/request-password-reset-otp/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

// --- လုံခြုံရေးအတွက် Environment Variables ကို သုံးပါ ---
// Supabase Dashboard > Project Settings > Edge Functions မှာ ထည့်သွင်းရန် လိုအပ်မည်
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Admin actions အတွက်
const OTP_EXPIRY_MINUTES = 15; // OTP သက်တမ်း (မိနစ်)

// --- Helper Functions ---
// Generate a 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash the OTP (using simple SHA-256 for this example, bcrypt in Deno needs WASM)
async function hashOtp(otp: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(otp); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}

serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Supabase Admin Client (RLS ကို ကျော်ဖို့)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    SERVICE_ROLE_KEY ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    const { email } = await req.json();
    if (!email) {
      throw new Error('Email address is required.');
    }
    if (!SENDGRID_API_KEY) {
        throw new Error('SendGrid API Key is not configured in environment variables.');
    }

    // ၁။ User ရှိ၊ မရှိ စစ်ဆေးပါ (Admin API ကို သုံးပါ)
    // မှတ်ချက်: listUsers deprecated ဖြစ်သွားနိုင်သဖြင့် getUserIdentities ကို သုံးသင့်သည်
    // သို့သော် getUserIdentities က email filter တိုက်ရိုက်မပေးပါ။
    // လောလောဆယ် profiles table ကို စစ်ဆေးခြင်းက ပိုလွယ်ကူနိုင်သည် (သို့မဟုတ် auth.users ကို တိုက်ရိုက် query လုပ်ပါ)
    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles') // Assuming email is unique in profiles
        .select('id')
        .eq('email', email)
        .maybeSingle(); // User မရှိရင် null ပြန်၊ error မပြ

     if (profileError) {
        console.error("Error checking profile:", profileError);
        // Don't reveal if user exists or not for security, just give generic error
        // throw new Error(`Error checking user: ${profileError.message}`);
         return new Response(JSON.stringify({ message: 'If your email exists in our system, you will receive an OTP code shortly.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 even if user not found for security
        });
     }

    if (!profileData) {
        console.warn(`Password reset requested for non-existent email: ${email}`);
        // User မရှိကြောင်း တိုက်ရိုက် မပြောဘဲ generic message ပြန်ပေးပါ (Security best practice)
        return new Response(JSON.stringify({ message: 'If your email exists in our system, you will receive an OTP code shortly.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // ၂။ OTP code ဖန်တီးပြီး hash လုပ်ပါ
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // ၃။ OTP ကို database မှာ သိမ်းဆည်းပါ
    // အရင်က တောင်းဆိုထားတဲ့ မကုန်သေးတဲ့ token အဟောင်းတွေကို ဖျက်ပါ (optional but good practice)
    await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('user_email', email);

    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_email: email,
        hashed_token: hashedOtp,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Error saving OTP token:', insertError);
      throw new Error('Could not save the OTP request. Please try again.');
    }

    // ၄။ SendGrid API ကို သုံးပြီး Email ပို့ပါ
    const emailBody = {
      personalizations: [{ to: [{ email: email }] }],
      from: { email: 'no-reply@najuanime.com', name: 'NajuAnime+' }, // သင် verify လုပ်ထားတဲ့ Sender Email
      subject: 'Your NajuAnime+ Password Reset Code',
      content: [
        {
          type: 'text/plain',
          value: `Your password reset code is: ${otp}\n\nThis code will expire in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not request this, please ignore this email.`,
        },
         { // Optional: HTML version for better formatting
          type: 'text/html',
          value: `
            <p>Your password reset code is: <strong>${otp}</strong></p>
            <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          `,
        },
      ],
    };

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!sendgridResponse.ok) {
      const errorBody = await sendgridResponse.text();
      console.error('SendGrid Error:', sendgridResponse.status, errorBody);
      // DB ထဲက သိမ်းလိုက်တဲ့ token ကို ပြန်ဖျက်သင့်သည် (Rollback logic)
       await supabaseAdmin.from('password_reset_tokens').delete().eq('hashed_token', hashedOtp);
      throw new Error('Failed to send the OTP email via SendGrid.');
    }

    console.log(`Password reset OTP sent successfully to ${email}`);

    // Frontend ကို အောင်မြင်ကြောင်း message ပြန်ပေးပါ
    return new Response(JSON.stringify({ message: 'An OTP code has been sent to your email.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in request-password-reset-otp function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Internal Server Error for unexpected issues
    });
  }
});