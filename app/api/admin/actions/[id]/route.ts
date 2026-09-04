import { and, eq } from 'drizzle-orm';
import { actions } from '@/db/schema';
import { db } from '@/lib/db';
import { getMemberSession, isAdminEmail } from '@/lib/member';

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getMemberSession();
  if (!session || !isAdminEmail(session.user.email)) {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { id: idValue } = await context.params;
  const id = Number(idValue);
  if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: 'Invalid action.' }, { status: 400 });

  const [action] = await db
    .update(actions)
    .set({
      approved: true,
      approvedAt: new Date(),
      approvedByUserId: session.user.id,
      published: true,
      updatedAt: new Date(),
    })
    .where(and(eq(actions.id, id), eq(actions.approved, false)))
    .returning({ id: actions.id, title: actions.title });

  if (!action) return Response.json({ error: 'That action is already approved or does not exist.' }, { status: 404 });
  return Response.json({ action });
}
