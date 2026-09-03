import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { count } from 'drizzle-orm';
import { actions, issues } from '../db/schema';

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

const seedActions: Array<typeof actions.$inferInsert> = [
  { issueId: votingRights.id, slug: 'pass-john-lewis-voting-rights-act', type: 'Petition', title: 'Pass the John R. Lewis Voting Rights Advancement Act', organization: 'Leadership Conference on Civil and Human Rights', detail: 'Tell Congress to restore and strengthen protections against discriminatory voting rules.', effort: '2 min', href: 'https://civilrights.org/john-lewis-voting-rights-act/', urgent: true, verified: true, verifiedAt: new Date('2026-09-03T00:00:00Z'), sortOrder: 1 },
  { issueId: votingRights.id, slug: 'defend-voters-discriminatory-maps', type: 'Lawsuit', title: 'Defend voters from discriminatory maps', organization: 'Campaign Legal Center', detail: 'Support an active case challenging Florida’s 2026 congressional map as an illegal partisan gerrymander.', effort: 'Follow case', href: 'https://campaignlegal.org/cases-actions/fighting-partisan-gerrymandering-florida-thompson-wynn-v-byrd', verified: true, verifiedAt: new Date('2026-09-03T00:00:00Z'), sortOrder: 2 },
  { issueId: votingRights.id, slug: 'join-local-voting-rights-team', type: 'Campaign', title: 'Join a local voting rights team', organization: 'Common Cause', detail: 'Get trained to protect elections, contact lawmakers, and organize in your community.', effort: 'Volunteer', href: 'https://www.commoncause.org/articles/why-do-people-volunteer-to-help-with-elections/', verified: true, verifiedAt: new Date('2026-09-03T00:00:00Z'), sortOrder: 3 },
  { issueId: votingRights.id, slug: 'support-expansion-voting-rights', type: 'Petition', title: 'Support the expansion of voting rights', organization: 'League of Women Voters', detail: 'Add your voice to the national push for accessible, secure, and fair elections.', effort: '3 min', href: 'https://www.lwv.org/take-action/support-expansion-voting-rights', verified: true, verifiedAt: new Date('2026-09-03T00:00:00Z'), sortOrder: 4 },
  { issueId: votingRights.id, slug: 'help-voters-prepare-next-election', type: 'Campaign', title: 'Help voters get ready for the next election', organization: 'Vote.org', detail: 'Share trusted registration, ballot, and polling-place tools with your network.', effort: 'Share', href: 'https://www.vote.org/', verified: true, verifiedAt: new Date('2026-09-03T00:00:00Z'), sortOrder: 5 },
];

for (const action of seedActions) {
  await db.insert(actions).values(action).onConflictDoUpdate({
    target: actions.slug,
    set: { ...action, updatedAt: new Date() },
  });
}

const [{ issueCount }] = await db.select({ issueCount: count() }).from(issues);
const [{ actionCount }] = await db.select({ actionCount: count() }).from(actions);
console.log(`Neon migration complete. Database contains ${issueCount} issues and ${actionCount} actions.`);
