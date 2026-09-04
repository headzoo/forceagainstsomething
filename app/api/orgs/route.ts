import { eq } from 'drizzle-orm';
import { orgs } from '@/db/schema';
import { db } from '@/lib/db';
import { getMemberSession } from '@/lib/member';
import { parsePublicHttpUrl } from '@/lib/action-metadata';

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session) return Response.json({ error: 'Sign in to create an organization.' }, { status: 401 });

  const [existing] = await db.select().from(orgs).where(eq(orgs.ownerUserId, session.user.id)).limit(1);
  if (existing) return Response.json({ error: 'Your account already has an organization.', organization: existing }, { status: 409 });

  const body = await request.json().catch(() => null) as { name?: unknown; website?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const websiteInput = typeof body?.website === 'string' ? body.website.trim() : '';

  if (name.length < 2 || name.length > 120) {
    return Response.json({ error: 'Organization name must be between 2 and 120 characters.' }, { status: 400 });
  }

  let website: string | null = null;
  if (websiteInput) {
    try {
      website = parsePublicHttpUrl(websiteInput).toString();
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : 'Enter a valid organization website.' }, { status: 400 });
    }
  }

  try {
    const [organization] = await db.insert(orgs).values({
      ownerUserId: session.user.id,
      name,
      website,
    }).returning();

    return Response.json({ organization }, { status: 201 });
  } catch {
    return Response.json({ error: 'That organization name is already registered.' }, { status: 409 });
  }
}
