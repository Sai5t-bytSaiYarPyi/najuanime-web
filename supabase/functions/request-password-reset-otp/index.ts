// supabase/functions/request-password-reset-otp/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OTP_EXPIRY_MINUTES = 15;

// --- Helper Functions ---
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const { email } = await req.json();
    if (!email) throw new Error('Email address is required.');
    if (!SENDGRID_API_KEY) throw new Error('SendGrid API Key is not configured.');
    if (!SERVICE_ROLE_KEY) throw new Error('Service Role Key is not configured.'); // Service key ကိုပါ စစ်ဆေးပါ

    // --- START: Query ပြင်ဆင်မှု ---
    // ၁။ ဒီ email နဲ့ user အနည်းဆုံး တစ်ယောက် ရှိ၊ မရှိ စစ်ဆေးပါ
    const { data: profileCheck, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id') // Select แค่ id พอ
        .eq('email', email)
        .limit(1) // အတန်း တစ်ခုထက် ပိုမယူပါနဲ့
        .maybeSingle(); // limit(1) ကြောင့် multiple rows error မဖြစ်တော့ပါ
    // --- END: Query ပြင်ဆင်မှု ---

    if (profileError) {
        console.error("Error checking profile:", profileError);
        // Security အတွက် generic message ပဲ ပြန်ပါ
        return new Response(JSON.stringify({ message: 'If your email exists in our system, you will receive an OTP code shortly.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    if (!profileCheck) { // maybeSingle က null ပြန်လာရင် user မရှိပါ
        console.warn(`Password reset requested for non-existent email: ${email}`);
        // Security အတွက် generic message ပဲ ပြန်ပါ
        return new Response(JSON.stringify({ message: 'If your email exists in our system, you will receive an OTP code shortly.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    // --- User ရှိတာ သေချာပြီဆိုရင် ဆက်လုပ်ပါ ---

    // ၂။ OTP code ဖန်တီးပြီး hash လုပ်ပါ
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // ၃။ OTP ကို database မှာ သိမ်းဆည်းပါ
    await supabaseAdmin.from('password_reset_tokens').delete().eq('user_email', email); // Clear old tokens
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({ user_email: email, hashed_token: hashedOtp, expires_at: expiresAt });

    if (insertError) {
      console.error('Error saving OTP token:', insertError);
      throw new Error('Could not save the OTP request. Please try again.');
    }

    // ၄။ SendGrid API ကို သုံးပြီး Email ပို့ပါ
    const emailBody = { /* ... (email body code - unchanged) ... */
        personalizations: [{ to: [{ email: email }] }],
        from: { email: 'no-reply@najuanime.com', name: 'NajuAnime+' },
        subject: 'Your NajuAnime+ Password Reset Code',
        content: [
            { type: 'text/plain', value: `Your password reset code is: ${otp}\n\nThis code will expire in ${OTP_EXPIRY_MINUTES} minutes.` },
            { type: 'text/html', value: `<p>Your password reset code is: <strong>${otp}</strong></p><p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>` },
        ],
    };

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailBody),
    });

    if (!sendgridResponse.ok) {
      const errorBody = await sendgridResponse.text();
      console.error('SendGrid Error:', sendgridResponse.status, errorBody);
      await supabaseAdmin.from('password_reset_tokens').delete().eq('hashed_token', hashedOtp); // Rollback
      throw new Error('Failed to send the OTP email via SendGrid.');
    }

    console.log(`Password reset OTP sent successfully to ${email}`);

    return new Response(JSON.stringify({ message: 'An OTP code has been sent to your email.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in request-password-reset-otp function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});