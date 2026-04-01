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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lib = searchParams.get('lib') || 'biru';

  const config = LIBRARIES[lib];
  if (!config || !config.apiKey || !config.libraryId) {
    return NextResponse.json(
      { error: `Library "${lib}" not configured` },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${config.libraryId}/collections?page=1&itemsPerPage=250`,
      {
        headers: {
          AccessKey: config.apiKey,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch collections' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Bunny collections API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
