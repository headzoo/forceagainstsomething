import { discoverNewActions } from '@/lib/action-discovery';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await discoverNewActions();
    return Response.json(result, { status: result.errors.length > 0 ? 500 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action discovery failed.';
    console.error('Action discovery failed:', error);
    return Response.json({ error: message }, { status: 500 });
  }
}
