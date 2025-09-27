// src/app/api/cron/update-status/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const revalidate = 0; // Ensure this route is always dynamic

export async function GET(request: NextRequest) {
  // 1. Protect this route with a secret token
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Initialize Supabase Admin Client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    const now = new Date().toISOString();

    // 3. Find profiles that are 'active' but their expiry date has passed
    const { data: expiredProfiles, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active')
      .lte('subscription_expires_at', now);

    if (selectError) {
      throw selectError;
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      return NextResponse.json({ message: "No expired profiles to update." });
    }

    const profileIds = expiredProfiles.map(p => p.id);

    // 4. Update these profiles' status to 'expired'
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'expired' })
      .in('id', profileIds);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ message: `Successfully updated ${profileIds.length} profiles to 'expired'.` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}