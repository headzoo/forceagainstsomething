import { neon } from '@neondatabase/serverless';
import { asc, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';
import { actions, issues, type DirectoryAction, type Issue } from '@/db/schema';

export type { DirectoryAction, Issue } from '@/db/schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured. Connect the site to Neon or add it to the local environment.');
}

export const db = drizzle(neon(connectionString), { schema });

export async function getDirectoryData() {
  const [issueRows, actionRows] = await Promise.all([
    db.select().from(issues).orderBy(asc(issues.sortOrder), asc(issues.name)),
    db.select().from(actions).where(eq(actions.published, true)).orderBy(desc(actions.urgent), asc(actions.sortOrder), asc(actions.title)),
  ]);

  return {
    issues: issueRows as Issue[],
    actions: actionRows as DirectoryAction[],
  };
}
