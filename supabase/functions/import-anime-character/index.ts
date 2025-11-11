// supabase/functions/import-anime-character/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

// Admin client (Service Role)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- 1. Admin ဖြစ်၊ မဖြစ် စစ်ဆေးပါ ---
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error('Authentication failed');

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.roles.includes('admin')) {
      throw new Error('User is not an admin.');
    }

    // --- 2. Request body က data ကို ယူပါ ---
    const { anime_id, character_mal_id, name, image_url, role } = await req.json();
    if (!anime_id || !character_mal_id || !name || !role) {
      throw new Error('Missing required fields: anime_id, character_mal_id, name, role');
    }

    let characterId: string;

    // --- 3. Character က `characters` table မှာ ရှိပြီးသားလား စစ်ဆေးပါ ---
    const { data: existingChar } = await supabaseAdmin
      .from('characters')
      .select('id')
      .eq('mal_id', character_mal_id)
      .single();

    if (existingChar) {
      // ရှိပြီးသားဆိုရင် ID ကိုပဲ ယူသုံးပါ
      characterId = existingChar.id;
    } else {
      // မရှိသေးရင် table ထဲကို အသစ်ထည့်ပါ
      const { data: newChar, error: insertCharError } = await supabaseAdmin
        .from('characters')
        .insert({
          name: name,
          image_url: image_url || null,
          mal_id: character_mal_id
        })
        .select('id')
        .single();
      
      if (insertCharError) throw insertCharError;
      if (!newChar) throw new Error('Failed to create new character record.');
      characterId = newChar.id;
    }

    // --- 4. `anime_characters` (Join Table) ထဲမှာ ချိတ်ဆက်ပါ ---
    // (ရှိပြီးသား ဟုတ်၊ မဟုတ် အရင်စစ်ဆေးပါ)
    const { data: existingLink, error: linkCheckError } = await supabaseAdmin
      .from('anime_characters')
      .select('id')
      .eq('anime_id', anime_id)
      .eq('character_id', characterId)
      .maybeSingle(); // ရှိရင် data, မရှိရင် null

    if (linkCheckError) throw linkCheckError;

    if (existingLink) {
      // ရှိပြီးသားဆိုရင် Role ကိုပဲ update လုပ်ပါ
      const { error: updateLinkError } = await supabaseAdmin
        .from('anime_characters')
        .update({ role: role })
        .eq('id', existingLink.id);
      
      if (updateLinkError) throw updateLinkError;
    } else {
      // မရှိသေးရင် အသစ်ထည့်ပါ
      const { error: insertLinkError } = await supabaseAdmin
        .from('anime_characters')
        .insert({
          anime_id: anime_id,
          character_id: characterId,
          role: role
        });
      
      if (insertLinkError) throw insertLinkError;
    }

    // --- 5. အောင်မြင်ကြောင်း ပြန်ကြားပါ ---
    return new Response(JSON.stringify({ success: true, character_id: characterId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in import-anime-character function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});