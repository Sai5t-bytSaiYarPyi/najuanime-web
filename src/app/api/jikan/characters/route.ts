// src/app/api/jikan/characters/route.ts
import { NextResponse } from 'next/server';

export const revalidate = 0; // Dynamic ဖြစ်အောင် အမြဲ revalidate လုပ်ပါ

export async function GET(request: Request) {
  try {
    // 1. Request URL ကနေ anime MAL ID ကို ယူပါ
    const { searchParams } = new URL(request.url);
    const animeId = searchParams.get('animeId');

    if (!animeId) {
      return NextResponse.json(
        { error: 'Search query "animeId" is required.' },
        { status: 400 }
      );
    }

    // 2. Jikan API (Anime Characters endpoint) ကို လှမ်းခေါ်ပါ
    const jikanUrl = `https://api.jikan.moe/v4/anime/${animeId}/characters`;

    // 3. Jikan API က data ကို fetch လုပ်ပါ
    // Admin page ဖြစ်တဲ့အတွက် revalidate ကို 1 နာရီ ထားပါမယ်
    const response = await fetch(jikanUrl, { next: { revalidate: 3600 } });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Failed to fetch data from Jikan API', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 4. Data ကို client (Admin page) ဆီ ပြန်ပို့ပါ
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in Jikan characters route:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}