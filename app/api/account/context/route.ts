import { desc, eq } from 'drizzle-orm';
import { actions, orgs } from '@/db/schema';
import { db } from '@/lib/db';
import { getMemberSession, isAdminEmail } from '@/lib/member';

export async function GET() {
  const session = await getMemberSession();
  if (!session) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });

  const [organization] = await db
    .select()
    .from(orgs)
    .where(eq(orgs.ownerUserId, session.user.id))
    .limit(1);

  const organizationActions = organization
    ? await db
      .select({
        id: actions.id,
        type: actions.type,
        title: actions.title,
        detail: actions.detail,
        approved: actions.approved,
        published: actions.published,
      })
      .from(actions)
      .where(eq(actions.orgId, organization.id))
      .orderBy(desc(actions.createdAt))
    : [];

  return Response.json({
    user: { id: session.user.id, name: session.user.name, email: session.user.email },
    organization: organization ?? null,
    actions: organizationActions,
    isAdmin: isAdminEmail(session.user.email),
  });
}
