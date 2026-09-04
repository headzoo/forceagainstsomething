import { and, eq } from 'drizzle-orm';
import { actionBookmarks, actions } from '@/db/schema';
import { db } from '@/lib/db';
import { getMemberSession } from '@/lib/member';

function readActionId(body: unknown) {
  if (!body || typeof body !== 'object' || !('actionId' in body)) return null;
  const actionId = (body as { actionId?: unknown }).actionId;
  return typeof actionId === 'number' && Number.isSafeInteger(actionId) && actionId > 0
    ? actionId
    : null;
}

export async function GET() {
  const session = await getMemberSession();
  if (!session) return Response.json({ error: 'Sign in to view bookmarks.' }, { status: 401 });

  const bookmarks = await db
    .select({ actionId: actionBookmarks.actionId })
    .from(actionBookmarks)
    .where(eq(actionBookmarks.userId, session.user.id));

  return Response.json({ actionIds: bookmarks.map((bookmark) => bookmark.actionId) });
}

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) return Response.json({ error: 'Sign in to bookmark actions.' }, { status: 401 });

  const actionId = readActionId(await request.json().catch(() => null));
  if (!actionId) return Response.json({ error: 'Choose a valid action.' }, { status: 400 });

  const [action] = await db
    .select({ id: actions.id })
    .from(actions)
    .where(and(eq(actions.id, actionId), eq(actions.approved, true), eq(actions.published, true)))
    .limit(1);

  if (!action) return Response.json({ error: 'That action is not available.' }, { status: 404 });

  await db
    .insert(actionBookmarks)
    .values({ userId: session.user.id, actionId })
    .onConflictDoNothing();

  return Response.json({ bookmarked: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getMemberSession();
  if (!session) return Response.json({ error: 'Sign in to update bookmarks.' }, { status: 401 });

  const actionId = readActionId(await request.json().catch(() => null));
  if (!actionId) return Response.json({ error: 'Choose a valid action.' }, { status: 400 });

  await db
    .delete(actionBookmarks)
    .where(and(
      eq(actionBookmarks.userId, session.user.id),
      eq(actionBookmarks.actionId, actionId),
    ));

  return Response.json({ bookmarked: false });
}
