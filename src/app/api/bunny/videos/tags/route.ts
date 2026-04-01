import { NextResponse } from 'next/server';

const LIBRARIES: Record<string, { apiKey: string | undefined; libraryId: string | undefined }> = {
  biru: {
    apiKey: process.env.BUNNY_API_KEY_BIRU,
    libraryId: process.env.BUNNY_LIBRARY_ID_BIRU,
  },
  monami: {
    apiKey: process.env.BUNNY_API_KEY_MONAMI,
    libraryId: process.env.BUNNY_LIBRARY_ID_MONAMI,
  },
};

export async function POST(req: Request) {
  const { lib, videoId, tags } = await req.json();

  const config = LIBRARIES[lib];
  if (!config || !config.apiKey || !config.libraryId) {
    return NextResponse.json({ error: 'Library not configured' }, { status: 500 });
  }

  try {
    const metaTags = (tags as string[]).map((tag: string) => ({
      property: 'tag',
      value: tag,
    }));

    const res = await fetch(
      `https://video.bunnycdn.com/library/${config.libraryId}/videos/${videoId}`,
      {
        method: 'POST',
        headers: {
          AccessKey: config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metaTags }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bunny tag update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
