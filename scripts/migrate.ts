import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { count, sql } from 'drizzle-orm';
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
  { slug: 'criminal-justice', name: 'Criminal justice', status: 'active', sortOrder: 2 },
  { slug: 'reproductive-freedom', name: 'Reproductive freedom', status: 'active', sortOrder: 3 },
  { slug: 'climate-justice', name: 'Climate justice', status: 'planned', sortOrder: 4 },
]).onConflictDoUpdate({
  target: issues.slug,
  set: {
    name: sql`excluded.name`,
    status: sql`excluded.status`,
    sortOrder: sql`excluded.sort_order`,
    updatedAt: new Date(),
  },
}).returning({ id: issues.id, slug: issues.slug, status: issues.status, sortOrder: issues.sortOrder });

const votingRights = issueRows.find((issue) => issue.slug === 'voting-rights');
const criminalJustice = issueRows.find((issue) => issue.slug === 'criminal-justice');
const reproductiveFreedom = issueRows.find((issue) => issue.slug === 'reproductive-freedom');
if (!votingRights || !criminalJustice || !reproductiveFreedom) {
  throw new Error('An active issue was not created.');
}

const seedActions = [
  { issueId: votingRights.id, organization: 'Leadership Conference on Civil and Human Rights', slug: 'pass-john-lewis-voting-rights-act', type: 'Petition' as const, title: 'Pass the John R. Lewis Voting Rights Advancement Act', detail: 'Tell Congress to restore and strengthen protections against discriminatory voting rules.', description: '## Why this matters\n\nThe John R. Lewis Voting Rights Advancement Act would restore and modernize federal protections against discriminatory voting practices.\n\n## What you can do\n\nAdd your name and urge Congress to pass the bill.', effort: '2 min', href: 'https://civilrights.org/john-lewis-voting-rights-act/', urgent: true, sortOrder: 1 },
  { issueId: votingRights.id, organization: 'Campaign Legal Center', slug: 'defend-voters-discriminatory-maps', type: 'Lawsuit' as const, title: 'Defend voters from discriminatory maps', detail: 'Support an active case challenging Florida’s 2026 congressional map as an illegal partisan gerrymander.', description: '## About the case\n\nCampaign Legal Center is challenging Florida’s congressional map and working to protect voters from discriminatory district lines.\n\nFollow the case for filings, decisions, and ways to support fair representation.', effort: 'Follow case', href: 'https://campaignlegal.org/cases-actions/fighting-partisan-gerrymandering-florida-thompson-wynn-v-byrd', sortOrder: 2 },
  { issueId: votingRights.id, organization: 'Common Cause', slug: 'join-local-voting-rights-team', type: 'Campaign' as const, title: 'Join a local voting rights team', detail: 'Get trained to protect elections, contact lawmakers, and organize in your community.', description: '## Make an impact locally\n\nJoin volunteers working in their communities to protect elections and expand access to the ballot. Opportunities can include voter education, contacting lawmakers, and election protection.', effort: 'Volunteer', href: 'https://www.commoncause.org/articles/why-do-people-volunteer-to-help-with-elections/', sortOrder: 3 },
  { issueId: votingRights.id, organization: 'League of Women Voters', slug: 'support-expansion-voting-rights', type: 'Petition' as const, title: 'Support the expansion of voting rights', detail: 'Add your voice to the national push for accessible, secure, and fair elections.', description: '## Add your voice\n\nTell elected officials that accessible, secure, and fair elections are a priority. The League of Women Voters provides a direct way to support expanded voting rights.', effort: '3 min', href: 'https://www.lwv.org/take-action/support-expansion-voting-rights', sortOrder: 4 },
  { issueId: votingRights.id, organization: 'Vote.org', slug: 'help-voters-prepare-next-election', type: 'Campaign' as const, title: 'Help voters get ready for the next election', detail: 'Share trusted registration, ballot, and polling-place tools with your network.', description: '## Help someone vote\n\nShare trusted tools that help people check their registration, request a ballot, find a polling place, and understand important election deadlines.', effort: 'Share', href: 'https://www.vote.org/', sortOrder: 5 },
  { issueId: criminalJustice.id, organization: 'The Bail Project', slug: 'stop-harmful-federal-bail-bills', type: 'Petition' as const, title: 'Tell Congress to reject harmful federal bail bills', detail: 'Email your representative to oppose bills that would punish state and local governments for adopting bail reform.', description: '## What is happening\n\nCongress is considering federal proposals aimed at pressuring state and local governments to roll back evidence-based bail reforms. The Bail Project warns that the measures would deepen a two-tiered pretrial system in which freedom depends on wealth.\n\n## What you can do\n\nUse the Bail Project’s action link to email your House representative and ask for a no vote on H.R. 5213, H.R. 5625, and H.R. 6260.', effort: '3 min', href: 'https://bailproject.org/policy/take-action-stop-harmful-bail-legislation-in-congress/', urgent: true, sortOrder: 1 },
  { issueId: criminalJustice.id, organization: 'Innocence Project', slug: 'compensate-exoneree-dion-harrell', type: 'Petition' as const, title: 'Demand compensation for exoneree Dion Harrell', detail: 'Ask New Jersey’s attorney general to compensate Dion Harrell after DNA evidence cleared his wrongful conviction.', description: '## Why this matters\n\nDion Harrell spent four years in prison and more than two decades on New Jersey’s sex-offender registry before DNA evidence proved his innocence. The state agrees he is innocent but has opposed compensation on a filing-deadline technicality.\n\n## What you can do\n\nSign the Innocence Project petition asking the New Jersey attorney general to compensate him now.', effort: '2 min', href: 'https://innocenceproject.org/petitions/compensate-dion/', sortOrder: 2 },
  { issueId: criminalJustice.id, organization: 'FAMM', slug: 'end-mandatory-minimums-state', type: 'Campaign' as const, title: 'Tell your state lawmakers to end mandatory minimums', detail: 'Send a state-specific message supporting sentencing laws that let judges consider the facts of each case.', description: '## The issue\n\nMandatory minimum laws require fixed prison terms and prevent judges from tailoring a sentence to the person and circumstances before them. FAMM is campaigning state by state to repeal or reform these laws.\n\n## What you can do\n\nEnter your address to contact the lawmakers who represent you and urge them to oppose new mandatory minimums and reform the ones already in place.', effort: '5 min', href: 'https://secure.everyaction.com/BQjj7tbFcEaTHEFM1pyy2w2', sortOrder: 3 },
  { issueId: criminalJustice.id, organization: 'American Civil Liberties Union', slug: 'challenge-facial-recognition-wrongful-arrest', type: 'Lawsuit' as const, title: 'Follow the challenge to a facial-recognition wrongful arrest', detail: 'Track a 2026 lawsuit seeking accountability and policy changes after police arrested the wrong person using an incorrect facial-recognition match.', description: '## About the case\n\nRobert Dillon is suing three Florida law-enforcement defendants after officers relied on an incorrect facial-recognition result, allowed it to influence a photo lineup, and arrested him for a crime committed hundreds of miles from his home.\n\nThe ongoing lawsuit seeks damages and policy changes designed to prevent future wrongful arrests driven by unreliable facial-recognition matches.', effort: 'Follow case', href: 'https://www.aclu.org/cases/dillon-v-city-of-jacksonville-beach', sortOrder: 4 },
  { issueId: criminalJustice.id, organization: 'American Civil Liberties Union', slug: 'defend-family-visits-in-jail', type: 'Lawsuit' as const, title: 'Defend families’ right to visit loved ones in jail', detail: 'Follow an ongoing Colorado case challenging a county jail’s ban on in-person family visits.', description: '## About the case\n\nFamilies of people incarcerated in Adams County Jail are challenging a ban on in-person visits under the Colorado Constitution. The appeal also asks whether state courts can directly stop ongoing violations of constitutional rights.\n\nFollow the case for filings and updates about family association and the enforceability of state constitutional protections.', effort: 'Follow case', href: 'https://www.aclu.org/cases/e-l-v-claps', sortOrder: 5 },
  { issueId: reproductiveFreedom.id, organization: 'American Civil Liberties Union', slug: 'protect-emergency-abortion-care', type: 'Petition' as const, title: 'Demand protection for emergency abortion care', detail: 'Tell the administration to stop weakening federal protections for pregnant patients who need stabilizing abortion care.', description: '## Why this is urgent\n\nThe federal government withdrew from litigation challenging Idaho’s abortion ban, weakening enforcement of the Emergency Medical Treatment and Labor Act for pregnant patients who need stabilizing care.\n\n## What you can do\n\nAdd your name to the ACLU petition demanding an end to federal actions that put emergency abortion care at risk.', effort: '2 min', href: 'https://action.aclu.org/petition/president-trump-stop-risking-pregnant-patients-lives', urgent: true, sortOrder: 1 },
  { issueId: reproductiveFreedom.id, organization: 'American Civil Liberties Union', slug: 'demand-federal-abortion-rights-access', type: 'Petition' as const, title: 'Tell Congress to protect abortion access nationwide', detail: 'Send Congress a message supporting the right to abortion, medication abortion, and meaningful access for everyone.', description: '## The issue\n\nAfter the loss of the federal constitutional right to abortion, access has depended heavily on geography and resources. Medication abortion and the ability to receive it by mail remain targets of legal and political attacks.\n\n## What you can do\n\nUse the ACLU’s form to tell Congress that any federal solution should protect abortion rights nationwide and remove barriers to care.', effort: '3 min', href: 'https://action.aclu.org/send-message/demand-federal-action-abortion-rights-and-access', sortOrder: 2 },
  { issueId: reproductiveFreedom.id, organization: 'Planned Parenthood Great Northwest', slug: 'fight-alaska-telehealth-abortion-ban', type: 'Lawsuit' as const, title: 'Follow the fight for telehealth medication abortion in Alaska', detail: 'Track the 2026 lawsuit challenging a ban that forces Alaskans to travel to receive medication abortion.', description: '## About the case\n\nPlanned Parenthood Great Northwest filed suit against Alaska’s ban on direct-to-patient telehealth medication abortion. The restriction can force patients to travel hundreds of miles to Anchorage or Fairbanks, including people in communities reachable only by plane.\n\nThe lawsuit argues that this medically unnecessary travel burden violates the Alaska Constitution’s protection for abortion access.', effort: 'Follow case', href: 'https://www.aclu.org/cases/planned-parenthood-great-northwest-hawai%CA%BBi-alaska-indiana-and-kentucky-v-state-of-alaska-et-al', sortOrder: 3 },
  { issueId: reproductiveFreedom.id, organization: 'National Family Planning & Reproductive Health Association', slug: 'protect-title-x-family-planning-care', type: 'Lawsuit' as const, title: 'Protect Title X family planning care', detail: 'Follow a lawsuit challenging political conditions that could push qualified providers out of the federal family-planning program.', description: '## About the case\n\nThe National Family Planning & Reproductive Health Association and the Family Health Council of Central Pennsylvania sued over the federal government’s fiscal-year 2027 Title X funding process.\n\nThey argue that political alignment requirements could displace qualified providers and undermine a program that supports contraception, cancer screening, STI care, and other preventive services for patients with low incomes.', effort: 'Follow case', href: 'https://www.aclu.org/cases/national-family-planning-reproductive-health-association-et-al-v-robert-f-kennedy-jr-et-al', sortOrder: 4 },
  { issueId: reproductiveFreedom.id, organization: 'National Network of Abortion Funds', slug: 'support-local-abortion-fund', type: 'Campaign' as const, title: 'Support a local abortion fund', detail: 'Find a fund in your community to donate, volunteer, or help with travel, lodging, childcare, and other access needs.', description: '## Turn support into access\n\nLocal abortion funds help people cover the cost of care and overcome logistical barriers such as travel, lodging, translation, and childcare. Their capacity and availability can change quickly.\n\n## What you can do\n\nSearch the National Network of Abortion Funds directory, choose a fund serving your community, and use its page to donate or find other ways to get involved.', effort: 'Find a fund', href: 'https://abortionfunds.org/find-a-fund/', sortOrder: 5 },
];

for (const action of seedActions) {
  const [organization] = await db.insert(orgs).values({ name: action.organization }).onConflictDoUpdate({
    target: orgs.name,
    set: { updatedAt: new Date() },
  }).returning({ id: orgs.id });

  const values: typeof actions.$inferInsert = {
    issueId: action.issueId,
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
    verifiedAt: new Date('2026-09-04T00:00:00Z'),
  };

  await db.insert(actions).values(values).onConflictDoUpdate({
    target: actions.slug,
    set: { ...values, updatedAt: new Date() },
  });
}

const [{ issueCount }] = await db.select({ issueCount: count() }).from(issues);
const [{ actionCount }] = await db.select({ actionCount: count() }).from(actions);
console.log(`Neon migration complete. Database contains ${issueCount} issues and ${actionCount} actions.`);
