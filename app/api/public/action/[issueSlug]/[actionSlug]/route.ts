import { getPublishedActionBySlugs } from '@/lib/db';
import { publicActionJson } from '@/lib/public-api';

export async function GET(_request: Request, context: { params: Promise<{ issueSlug: string; actionSlug: string }> }) {
  const { issueSlug, actionSlug } = await context.params;
  const action = await getPublishedActionBySlugs(issueSlug, actionSlug);
  if (!action) return Response.json({ error: 'Action not found.' }, { status: 404 });

  return Response.json(publicActionJson(
    action,
    { id: action.issueId, slug: action.issueSlug, name: action.issue },
    { id: action.orgId, slug: action.organizationSlug, name: action.organization },
  ));
}
