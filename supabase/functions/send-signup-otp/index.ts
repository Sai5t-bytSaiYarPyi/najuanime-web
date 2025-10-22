// supabase/functions/send-signup-otp/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const OTP_EXPIRY_MINUTES = 10; // Signup OTP သက်တမ်း (မိနစ်)

// --- Helper Functions (เหมือนกัน) ---
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
    if (!SERVICE_ROLE_KEY) throw new Error('Service Role Key is not configured.');

    // ၁။ ဒီ email နဲ့ *unconfirmed* user ရှိ၊ မရှိ စစ်ဆေးပါ (Admin API)
    // Supabase က signup လုပ်ပြီးသားဖြစ်လို့ user က ရှိနေရပါမယ်
     const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({ email: email });
     if (userError || !userData || userData.users.length === 0) {
         console.error('Error finding user or user does not exist:', userError);
         throw new Error('User account not found or could not be verified.');
     }
     const user = userData.users[0];
     // အကယ်၍ user က confirm ဖြစ်ပြီးသားဆိုရင် OTP ထပ်ပို့စရာမလို
     if (user.email_confirmed_at) {
         console.warn(`Signup OTP requested for already confirmed email: ${email}`);
         // Frontend မှာ Login view ကို ပြောင်းခိုင်းသင့်
         return new Response(JSON.stringify({ message: 'This email is already confirmed. Please log in.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409, // Conflict status code
        });
     }


    // ၂။ OTP code ဖန်တီးပြီး hash လုပ်ပါ
    const otp = generateOtp();
    const hashedOtp = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // ၃။ OTP ကို signup_tokens table မှာ သိမ်းဆည်းပါ (Upsert သုံးပါမယ်)
    const { error: upsertError } = await supabaseAdmin
      .from('signup_tokens')
      .upsert({
        user_email: email, // UNIQUE constraint ကြောင့် email တစ်ခုကို token တစ်ခုပဲ ရှိစေမည်
        hashed_token: hashedOtp,
        expires_at: expiresAt,
      }, { onConflict: 'user_email' }); // Email တူရင် update လုပ်

    if (upsertError) {
      console.error('Error saving signup OTP token:', upsertError);
      throw new Error('Could not save the OTP request. Please try again.');
    }

    // ၄။ SendGrid API ကို သုံးပြီး Email ပို့ပါ
    const emailBody = {
      personalizations: [{ to: [{ email: email }] }],
      from: { email: 'no-reply@najuanime.com', name: 'NajuAnime+' },
      subject: 'Your NajuAnime+ Account Confirmation Code', // Subject ပြောင်း
      content: [
        { type: 'text/plain', value: `Your account confirmation code is: ${otp}\n\nThis code will expire in ${OTP_EXPIRY_MINUTES} minutes.` },
        { type: 'text/html', value: `<p>Your account confirmation code is: <strong>${otp}</strong></p><p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>` },
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
      // Rollback မလိုပါ၊ upsert ဖြစ်လို့ token အဟောင်း ရှိနေနိုင်
      throw new Error('Failed to send the confirmation OTP email via SendGrid.');
    }

    console.log(`Signup confirmation OTP sent successfully to ${email}`);

    return new Response(JSON.stringify({ message: 'A confirmation OTP code has been sent to your email.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-signup-otp function:', error);
    const status = error.status || (error.message.includes('already confirmed') ? 409 : 500); // Status code ကို ချိန်ညှိ
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});