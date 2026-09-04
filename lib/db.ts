import { neon } from '@neondatabase/serverless';
import { and, asc, desc, eq, exists, getTableColumns, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';
import { actions, issues, orgs, type ActionRecord, type Issue } from '@/db/schema';

export type { ActionRecord, Issue, Organization } from '@/db/schema';

const { searchTsv: _actionsSearchTsv, ...actionColumns } = getTableColumns(actions);
void _actionsSearchTsv;

export type PublicAction = Omit<ActionRecord, 'searchTsv'>;
export type DirectoryAction = PublicAction & { organization: string };
export type PublishedOrganization = {
  id: number;
  name: string;
  website: string | null;
  description: string;
  actions: Array<PublicAction & { issue: string }>;
};

export type SearchActionResult = {
  id: number;
  title: string;
  type: PublicAction['type'];
  detail: string;
  organization: string;
  issue: string;
};

export type SearchOrganizationResult = {
  id: number;
  name: string;
  description: string;
};

export type SearchResults = {
  actions: SearchActionResult[];
  organizations: SearchOrganizationResult[];
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
      .select({ ...actionColumns, organization: orgs.name })
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
      ...actionColumns,
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
    .select({ ...actionColumns, issue: issues.name })
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

export async function searchPublishedContent(query: string): Promise<SearchResults> {
  const actionScore = sql<number>`${actions.searchTsv} <@> to_bm25query(to_tsvector('english', ${query}), 'actions_search_bm25'::regclass)`;
  const orgScore = sql<number>`${orgs.searchTsv} <@> to_bm25query(to_tsvector('english', ${query}), 'orgs_search_bm25'::regclass)`;

  const publishedAction = exists(
    db
      .select({ id: sql`1` })
      .from(actions)
      .where(and(
        eq(actions.orgId, orgs.id),
        eq(actions.approved, true),
        eq(actions.published, true),
      )),
  );

  const [actionRows, organizationRows] = await Promise.all([
    db
      .select({
        id: actions.id,
        title: actions.title,
        type: actions.type,
        detail: actions.detail,
        organization: orgs.name,
        issue: issues.name,
        score: actionScore,
      })
      .from(actions)
      .innerJoin(orgs, eq(actions.orgId, orgs.id))
      .innerJoin(issues, eq(actions.issueId, issues.id))
      .where(and(eq(actions.approved, true), eq(actions.published, true)))
      .orderBy(asc(actionScore))
      .limit(8),
    db
      .select({
        id: orgs.id,
        name: orgs.name,
        description: orgs.description,
        score: orgScore,
      })
      .from(orgs)
      .where(publishedAction)
      .orderBy(asc(orgScore))
      .limit(5),
  ]);

  return {
    actions: actionRows.map(({ score: _score, ...row }) => row),
    organizations: organizationRows.map(({ score: _score, description, ...row }) => ({
      ...row,
      description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description,
    })),
  };
}
