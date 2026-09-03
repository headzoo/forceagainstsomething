import { neon } from '@neondatabase/serverless';
import { asc, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { actions, issues, type DirectoryAction, type Issue } from '@/db/schema';

export type { DirectoryAction, Issue } from '@/db/schema';

function getSql() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured. Connect Neon to this Vercel project or pull the Vercel development environment.');
  }

  return neon(connectionString);
}

export async function getDirectoryData() {
  const db = drizzle(getSql());
  const [issueRows, actionRows] = await Promise.all([
    db.select().from(issues).orderBy(asc(issues.sortOrder), asc(issues.name)),
    db.select().from(actions).where(eq(actions.published, true)).orderBy(desc(actions.urgent), asc(actions.sortOrder), asc(actions.title)),
  ]);

  return {
    issues: issueRows as Issue[],
    actions: actionRows as DirectoryAction[],
  };
}
