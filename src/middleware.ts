// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // --- START: ပြင်ဆင်မှု (ဒီအပိုင်း မပြင်လည်း ရပါတယ်၊ ဒါပေမယ့် ပိုရှင်းသွားအောင်ပါ) ---
          // response object ကို update လုပ်ပြီးမှ cookie set ပါ။
          response.cookies.set({ name, value, ...options })
          // --- END: ပြင်ဆင်မှု ---
        },
        remove(name: string, options: CookieOptions) {
          // --- START: ပြင်ဆင်မှု (ဒီအပိုင်း မပြင်လည်း ရပါတယ်၊ ဒါပေမယ့် ပိုရှင်းသွားအောင်ပါ) ---
          // response object ကို update လုပ်ပြီးမှ cookie remove ပါ။
          response.cookies.set({ name, value: '', ...options })
          // --- END: ပြင်ဆင်မှု ---
        },
      },
    }
  )

  // Session ကို အမြဲတမ်း refresh လုပ်ပါ
  const { data: { session } } = await supabase.auth.getSession()

  // --- START: Admin Route စစ်ဆေးမှု အပိုင်း ---
  const { pathname } = request.nextUrl;

  // အကယ်၍ request က /admin နဲ့ စတဲ့ route ဖြစ်တယ်ဆိုရင်
  if (pathname.startsWith('/admin')) {
    // Session မရှိရင် (login မဝင်ထားရင်) ဒါမှမဟုတ် user မရှိရင် homepage ကို redirect လုပ်ပါ။
    if (!session || !session.user) {
      console.log('Middleware: No session found for admin route, redirecting to /');
      return NextResponse.redirect(new URL('/', request.url));
    }

    // User ရှိတယ်ဆိုရင် profile table ကနေ role ကို စစ်ဆေးပါ။
    // Middleware မှာ server-side client ကို သုံးဖို့လိုပါတယ်။
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', session.user.id)
      .single();

    // Profile ဆွဲရာမှာ error ရှိခဲ့ရင် (ဥပမာ- profile မရှိသေးတာ) redirect လုပ်ပါ။
    if (profileError || !profile) {
      console.error('Middleware: Error fetching profile or profile not found for admin check:', profileError?.message);
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Profile မှာ roles array မပါရင် ဒါမှမဟုတ် 'admin' role မပါရင် redirect လုပ်ပါ။
    // roles က TEXT[] type ဖြစ်နိုင်တဲ့အတွက် Array.isArray နဲ့ includes ကို သုံးပါတယ်။
    if (!profile.roles || !Array.isArray(profile.roles) || !profile.roles.includes('admin')) {
      console.log(`Middleware: User ${session.user.id} does not have admin role, redirecting to /`);
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Admin ဖြစ်တယ်ဆိုရင် ဆက်သွားခွင့်ပြုပါ။
    console.log(`Middleware: Admin user ${session.user.id} accessed ${pathname}`);
  }
  // --- END: Admin Route စစ်ဆေးမှု အပိုင်း ---

  // Session cookie ကို response မှာ သေချာပါအောင် လုပ်ပါ။
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes ကို middleware ကနေ pass through လုပ်စေချင်ရင် ထည့်နိုင်ပါတယ်)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)', // api/ ကို ထပ်ထည့်ထားပါတယ်
  ],
}