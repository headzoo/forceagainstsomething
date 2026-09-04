import { eq } from 'drizzle-orm';
import { orgs } from '@/db/schema';
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

  return Response.json({
    user: { id: session.user.id, name: session.user.name, email: session.user.email },
    organization: organization ?? null,
    isAdmin: isAdminEmail(session.user.email),
  });
}
