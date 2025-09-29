// src/app/api/jikan/search/route.ts
import { NextResponse } from 'next/server';

// This ensures our API route is always dynamic and not cached.
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // 1. Get the search query from the request URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query "q" is required.' },
        { status: 400 }
      );
    }

    // 2. Construct the Jikan API URL
    // We add a limit to get a reasonable number of results
    const jikanUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`;

    // 3. Fetch data from the Jikan API
    // We cache the result from Jikan for 1 hour to avoid hitting their rate limits too often
    const response = await fetch(jikanUrl, { next: { revalidate: 3600 } });

    if (!response.ok) {
      // If Jikan API returns an error, forward it
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Failed to fetch data from Jikan API', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 4. Return the data to our client
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in Jikan search route:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}