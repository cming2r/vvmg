import { NextResponse } from 'next/server';

const LIBRARIES: Record<string, { apiKey: string | undefined; libraryId: string | undefined; pullZone: string | undefined }> = {
  biru: {
    apiKey: process.env.BUNNY_API_KEY_BIRU,
    libraryId: process.env.BUNNY_LIBRARY_ID_BIRU,
    pullZone: process.env.BUNNY_PULL_ZONE_BIRU,
  },
  monami: {
    apiKey: process.env.BUNNY_API_KEY_MONAMI,
    libraryId: process.env.BUNNY_LIBRARY_ID_MONAMI,
    pullZone: process.env.BUNNY_PULL_ZONE_MONAMI,
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
    const collection = searchParams.get('collection') || '';
    const collectionParam = collection ? `&collection=${collection}` : '';
    const res = await fetch(
      `https://video.bunnycdn.com/library/${config.libraryId}/videos?page=1&itemsPerPage=1000&orderBy=date${collectionParam}`,
      {
        headers: {
          AccessKey: config.apiKey,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from Bunny.net' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const items = (data.items || []).map((video: Record<string, unknown>) => {
      const metaTags = (video.metaTags as Array<{ property: string; value: string }>) || [];
      const tags = metaTags.filter((t) => t.property === 'tag').map((t) => t.value);
      return {
        ...video,
        tags,
        thumbnailUrl: `https://${config.pullZone}.b-cdn.net/${video.guid}/${video.thumbnailFileName}`,
        embedUrl: `https://iframe.mediadelivery.net/embed/${config.libraryId}/${video.guid}`,
      };
    });
    return NextResponse.json({ ...data, items });
  } catch (error) {
    console.error('Bunny API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
