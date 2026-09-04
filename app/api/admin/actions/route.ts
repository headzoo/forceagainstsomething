import { asc, eq, getTableColumns } from 'drizzle-orm';
import { actions, issues, orgs, user } from '@/db/schema';
import { db } from '@/lib/db';
import { getMemberSession, isAdminEmail } from '@/lib/member';

export async function GET() {
  const session = await getMemberSession();
  if (!session || !isAdminEmail(session.user.email)) {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const submissions = await db
    .select({
      ...getTableColumns(actions),
      organization: orgs.name,
      issue: issues.name,
      submitterName: user.name,
      submitterEmail: user.email,
    })
    .from(actions)
    .innerJoin(orgs, eq(actions.orgId, orgs.id))
    .innerJoin(issues, eq(actions.issueId, issues.id))
    .leftJoin(user, eq(actions.submittedByUserId, user.id))
    .where(eq(actions.approved, false))
    .orderBy(asc(actions.createdAt));

  return Response.json({ submissions });
}
