import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { count } from 'drizzle-orm';
import { actions, issues, orgs } from '../db/schema';

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL_UNPOOLED is missing from .env.local.');
}

const client = neon(connectionString);
const db = drizzle(client);

await migrate(db, { migrationsFolder: './drizzle' });

const issueRows = await db.insert(issues).values([
  { slug: 'voting-rights', name: 'Voting rights', status: 'active', sortOrder: 1 },
  { slug: 'climate-justice', name: 'Climate justice', status: 'planned', sortOrder: 2 },
  { slug: 'reproductive-freedom', name: 'Reproductive freedom', status: 'planned', sortOrder: 3 },
]).onConflictDoUpdate({
  target: issues.slug,
  set: { updatedAt: new Date() },
}).returning({ id: issues.id, slug: issues.slug });

const votingRights = issueRows.find((issue) => issue.slug === 'voting-rights');
if (!votingRights) throw new Error('Voting rights issue was not created.');

const seedActions = [
  { organization: 'Leadership Conference on Civil and Human Rights', slug: 'pass-john-lewis-voting-rights-act', type: 'Petition' as const, title: 'Pass the John R. Lewis Voting Rights Advancement Act', detail: 'Tell Congress to restore and strengthen protections against discriminatory voting rules.', description: '## Why this matters\n\nThe John R. Lewis Voting Rights Advancement Act would restore and modernize federal protections against discriminatory voting practices.\n\n## What you can do\n\nAdd your name and urge Congress to pass the bill.', effort: '2 min', href: 'https://civilrights.org/john-lewis-voting-rights-act/', urgent: true, sortOrder: 1 },
  { organization: 'Campaign Legal Center', slug: 'defend-voters-discriminatory-maps', type: 'Lawsuit' as const, title: 'Defend voters from discriminatory maps', detail: 'Support an active case challenging Florida’s 2026 congressional map as an illegal partisan gerrymander.', description: '## About the case\n\nCampaign Legal Center is challenging Florida’s congressional map and working to protect voters from discriminatory district lines.\n\nFollow the case for filings, decisions, and ways to support fair representation.', effort: 'Follow case', href: 'https://campaignlegal.org/cases-actions/fighting-partisan-gerrymandering-florida-thompson-wynn-v-byrd', sortOrder: 2 },
  { organization: 'Common Cause', slug: 'join-local-voting-rights-team', type: 'Campaign' as const, title: 'Join a local voting rights team', detail: 'Get trained to protect elections, contact lawmakers, and organize in your community.', description: '## Make an impact locally\n\nJoin volunteers working in their communities to protect elections and expand access to the ballot. Opportunities can include voter education, contacting lawmakers, and election protection.', effort: 'Volunteer', href: 'https://www.commoncause.org/articles/why-do-people-volunteer-to-help-with-elections/', sortOrder: 3 },
  { organization: 'League of Women Voters', slug: 'support-expansion-voting-rights', type: 'Petition' as const, title: 'Support the expansion of voting rights', detail: 'Add your voice to the national push for accessible, secure, and fair elections.', description: '## Add your voice\n\nTell elected officials that accessible, secure, and fair elections are a priority. The League of Women Voters provides a direct way to support expanded voting rights.', effort: '3 min', href: 'https://www.lwv.org/take-action/support-expansion-voting-rights', sortOrder: 4 },
  { organization: 'Vote.org', slug: 'help-voters-prepare-next-election', type: 'Campaign' as const, title: 'Help voters get ready for the next election', detail: 'Share trusted registration, ballot, and polling-place tools with your network.', description: '## Help someone vote\n\nShare trusted tools that help people check their registration, request a ballot, find a polling place, and understand important election deadlines.', effort: 'Share', href: 'https://www.vote.org/', sortOrder: 5 },
];

for (const action of seedActions) {
  const [organization] = await db.insert(orgs).values({ name: action.organization }).onConflictDoUpdate({
    target: orgs.name,
    set: { updatedAt: new Date() },
  }).returning({ id: orgs.id });

  const values: typeof actions.$inferInsert = {
    issueId: votingRights.id,
    orgId: organization.id,
    slug: action.slug,
    type: action.type,
    title: action.title,
    detail: action.detail,
    description: action.description,
    effort: action.effort,
    href: action.href,
    urgent: action.urgent ?? false,
    sortOrder: action.sortOrder,
    approved: true,
    published: true,
    verified: true,
    verifiedAt: new Date('2026-09-03T00:00:00Z'),
  };

  await db.insert(actions).values(values).onConflictDoUpdate({
    target: actions.slug,
    set: { ...values, updatedAt: new Date() },
  });
}

const [{ issueCount }] = await db.select({ issueCount: count() }).from(issues);
const [{ actionCount }] = await db.select({ actionCount: count() }).from(actions);
console.log(`Neon migration complete. Database contains ${issueCount} issues and ${actionCount} actions.`);
