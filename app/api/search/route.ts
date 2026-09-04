import { searchPublishedContent } from '@/lib/db';

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('q') ?? '';
  const query = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH);

  if (query.length < MIN_QUERY_LENGTH) {
    return Response.json({ actions: [], organizations: [] });
  }

  try {
    const results = await searchPublishedContent(query);
    return Response.json(results);
  } catch (error) {
    console.error('Search failed', error);
    return Response.json({ error: 'Search is temporarily unavailable.' }, { status: 500 });
  }
}
