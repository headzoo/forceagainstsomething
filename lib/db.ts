import { neon } from '@neondatabase/serverless';
import { and, asc, desc, eq, getTableColumns } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';
import { actions, issues, orgs, type ActionRecord, type Issue } from '@/db/schema';

export type { ActionRecord, Issue, Organization } from '@/db/schema';

export type DirectoryAction = ActionRecord & { organization: string };

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
