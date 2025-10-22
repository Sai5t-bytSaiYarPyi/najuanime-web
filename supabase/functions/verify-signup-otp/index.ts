// supabase/functions/verify-signup-otp/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, Session } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// --- Helper Function (เหมือนกัน) ---
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
    const { email, otp } = await req.json();
    if (!email || !otp) throw new Error('Email and OTP are required.');
    if (!SERVICE_ROLE_KEY) throw new Error('Service Role Key is not configured.');

    // ၁။ Database ထဲမှာ သက်ဆိုင်ရာ Signup OTP token ကို ရှာပါ
    const now = new Date();
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('signup_tokens')
      .select('id, hashed_token, expires_at')
      .eq('user_email', email)
      .single(); // UNIQUE constraint ကြောင့် single() သုံးနိုင်

    if (tokenError || !tokenData) {
      console.error('Error fetching signup token or token not found:', tokenError);
      throw new Error('Invalid or expired OTP code. Please request a new one or try signing up again.');
    }

    // ၂။ Token သက်တမ်းကုန်၊ မကုန် စစ်ဆေးပါ
     if (new Date(tokenData.expires_at) < now) {
        await supabaseAdmin.from('signup_tokens').delete().eq('id', tokenData.id); // Expired token ကို ဖျက်
        throw new Error('OTP code has expired. Please request a new one or try signing up again.');
     }

    // ၃။ User ထည့်လိုက်တဲ့ OTP ကို hash လုပ်ပြီး တိုက်စစ်ပါ
    const hashedOtpFromUser = await hashOtp(otp);
    if (hashedOtpFromUser !== tokenData.hashed_token) {
      throw new Error('Invalid OTP code.');
    }

    // --- OTP မှန်ကန်ကြောင်း အတည်ပြုပြီး ---

    // ၄။ User ID ကို ရှာပါ
     const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({ email: email });
     if (userError || !userData || userData.users.length === 0) throw new Error('User not found.');
     const userId = userData.users[0].id;
     const user = userData.users[0];

     // အကယ်၍ user က confirm ဖြစ်ပြီးသားဆိုရင် session ကိုပဲ တန်းပြန်ပေးလိုက်ပါ
     if (user.email_confirmed_at) {
         console.warn(`Attempted to verify already confirmed email: ${email}`);
         // Manually create session for the user? Or let frontend handle login normally?
         // For simplicity, let's just return success message, user can login after this.
          await supabaseAdmin.from('signup_tokens').delete().eq('id', tokenData.id); // Token ကို ဖျက်
          // Simulate session data for frontend, but actual session might need relogin
          // Returning a success message might be safer.
           return new Response(JSON.stringify({ message: 'Email is already confirmed. You can now log in.' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
     }


    // ၅။ User ရဲ့ email_confirmed_at ကို update လုပ်ပါ (Admin API)
    const { data: updatedUserData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true } // email_confirm: true sets email_confirmed_at
    );

    if (updateError || !updatedUserData || !updatedUserData.user) {
      console.error('Error confirming email:', updateError);
      throw new Error('Failed to confirm email. Please try again.');
    }

    // ၆။ အသုံးပြုပြီးသား OTP token ကို ဖျက်ပါ
    await supabaseAdmin.from('signup_tokens').delete().eq('id', tokenData.id);

    console.log(`Email successfully confirmed for user ${userId}`);

    // ၇။ Frontend မှာ login ဝင်နိုင်အောင် Session တစ်ခု ဖန်တီးပြီး ပြန်ပေးပါ (Optional but good UX)
    // Note: Creating session manually isn't standard. Best might be to tell frontend verification succeeded
    // and let frontend call signIn again (or maybe Supabase handles this automatically after verify?).
    // Let's return a success message first. Frontend can trigger login or handle session.
    // --- START: Simulate Session (Check if Supabase provides a better way) ---
    // Supabase doesn't have a direct admin function to create a session from OTP verification.
    // The verifyOtp function (non-admin) usually returns a session.
    // Let's try calling the non-admin verifyOtp again AFTER confirming the email via admin.
    // This seems redundant but might trigger the session creation.

    // Re-create a non-admin client to try verifyOtp for session
    // const supabaseUserClient = createClient( Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    // const { data: sessionData, error: sessionError } = await supabaseUserClient.auth.verifyOtp({ email, token: otp, type: 'signup'});

    // if(sessionError || !sessionData.session){
    //      console.warn("Could not create session after manual confirmation:", sessionError);
         // Return success, but frontend might need to prompt login
         return new Response(JSON.stringify({ message: 'Email confirmed successfully! Please log in.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    // }

    // --- END: Simulate Session ---


    // If session creation worked (if attempted above)
    // return new Response(JSON.stringify({ message: 'Email confirmed successfully!', session: sessionData.session }), {
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('Error in verify-signup-otp function:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});