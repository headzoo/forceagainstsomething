import { eq } from 'drizzle-orm';
import { orgs } from '@/db/schema';
import { analyzeActionHref, slugifyTitle } from '@/lib/action-metadata';
import { db } from '@/lib/db';
import { getMemberSession } from '@/lib/member';

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) return Response.json({ error: 'Sign in to analyze an action.' }, { status: 401 });

  const [organization] = await db.select({ id: orgs.id }).from(orgs).where(eq(orgs.ownerUserId, session.user.id)).limit(1);
  if (!organization) return Response.json({ error: 'Create your organization before submitting an action.' }, { status: 403 });

  const body = await request.json().catch(() => null) as { href?: unknown } | null;
  const href = typeof body?.href === 'string' ? body.href.trim() : '';

  try {
    const metadata = await analyzeActionHref(href);
    return Response.json({ ...metadata, suggestedSlug: slugifyTitle(metadata.suggestedTitle) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'We could not analyze that page.' }, { status: 400 });
  }
}
