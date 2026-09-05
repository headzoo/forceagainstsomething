import { and, eq } from 'drizzle-orm';
import { actionLikes, actions } from '@/db/schema';
import { db, publicActionVisibilityCondition } from '@/lib/db';
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
  if (!session) return Response.json({ error: 'Sign in to view likes.' }, { status: 401 });

  const likes = await db
    .select({ actionId: actionLikes.actionId })
    .from(actionLikes)
    .where(eq(actionLikes.userId, session.user.id));

  return Response.json({ actionIds: likes.map((like) => like.actionId) });
}

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) return Response.json({ error: 'Sign in to like actions.' }, { status: 401 });

  const actionId = readActionId(await request.json().catch(() => null));
  if (!actionId) return Response.json({ error: 'Choose a valid action.' }, { status: 400 });

  const [action] = await db
    .select({ id: actions.id })
    .from(actions)
    .where(and(eq(actions.id, actionId), publicActionVisibilityCondition()))
    .limit(1);

  if (!action) return Response.json({ error: 'That action is not available.' }, { status: 404 });

  await db
    .insert(actionLikes)
    .values({ userId: session.user.id, actionId })
    .onConflictDoNothing();

  return Response.json({ liked: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getMemberSession();
  if (!session) return Response.json({ error: 'Sign in to update likes.' }, { status: 401 });

  const actionId = readActionId(await request.json().catch(() => null));
  if (!actionId) return Response.json({ error: 'Choose a valid action.' }, { status: 400 });

  await db
    .delete(actionLikes)
    .where(and(
      eq(actionLikes.userId, session.user.id),
      eq(actionLikes.actionId, actionId),
    ));

  return Response.json({ liked: false });
}
