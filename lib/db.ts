import { neon } from '@neondatabase/serverless';
import { and, asc, desc, eq, getTableColumns } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';
import { actions, issues, orgs, type ActionRecord, type Issue } from '@/db/schema';

export type { ActionRecord, Issue, Organization } from '@/db/schema';

export type DirectoryAction = ActionRecord & { organization: string };
export type PublishedOrganization = {
  id: number;
  name: string;
  website: string | null;
  description: string;
  actions: Array<ActionRecord & { issue: string }>;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured. Connect the site to Neon or add it to the local environment.');
}

export const db = drizzle(neon(connectionString), { schema });

export async function getDirectoryData() {
  const [issueRows, actionRows] = await Promise.all([
    db.select().from(issues).orderBy(asc(issues.sortOrder), asc(issues.name)),
    db
      .select({ ...getTableColumns(actions), organization: orgs.name })
      .from(actions)
      .innerJoin(orgs, eq(actions.orgId, orgs.id))
      .where(and(eq(actions.approved, true), eq(actions.published, true)))
      .orderBy(desc(actions.urgent), asc(actions.sortOrder), asc(actions.title)),
  ]);

  return {
    issues: issueRows as Issue[],
    actions: actionRows as DirectoryAction[],
  };
}

export async function getActiveIssues() {
  return db
    .select({ id: issues.id, name: issues.name, slug: issues.slug })
    .from(issues)
    .where(eq(issues.status, 'active'))
    .orderBy(asc(issues.sortOrder), asc(issues.name));
}

export async function getPublishedAction(id: number) {
  const [action] = await db
    .select({
      ...getTableColumns(actions),
      organization: orgs.name,
      issue: issues.name,
    })
    .from(actions)
    .innerJoin(orgs, eq(actions.orgId, orgs.id))
    .innerJoin(issues, eq(actions.issueId, issues.id))
    .where(and(
      eq(actions.id, id),
      eq(actions.approved, true),
      eq(actions.published, true),
    ))
    .limit(1);

  return action;
}

export async function getPublishedOrganization(id: number): Promise<PublishedOrganization | undefined> {
  const [organization] = await db
    .select({ id: orgs.id, name: orgs.name, website: orgs.website, description: orgs.description })
    .from(orgs)
    .where(eq(orgs.id, id))
    .limit(1);

  if (!organization) return undefined;

  const actionRows = await db
    .select({ ...getTableColumns(actions), issue: issues.name })
    .from(actions)
    .innerJoin(issues, eq(actions.issueId, issues.id))
    .where(and(
      eq(actions.orgId, id),
      eq(actions.approved, true),
      eq(actions.published, true),
    ))
    .orderBy(desc(actions.urgent), asc(actions.sortOrder), asc(actions.title));

  return { ...organization, actions: actionRows };
}
