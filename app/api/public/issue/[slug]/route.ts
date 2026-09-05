import { getIssueBySlug, getRecentPublishedActionsForIssue } from '@/lib/db';
import { publicActionJson } from '@/lib/public-api';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const issue = await getIssueBySlug(slug);
  if (!issue) return Response.json({ error: 'Issue not found.' }, { status: 404 });

  const actions = await getRecentPublishedActionsForIssue(issue.id);
  return Response.json({
    id: issue.id,
    slug: issue.slug,
    url: `/issue/${issue.slug}`,
    name: issue.name,
    detail: issue.detail,
    description: issue.description,
    status: issue.status,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    actions: actions.map((action) => publicActionJson(
      action,
      { id: issue.id, slug: issue.slug, name: issue.name },
      { id: action.orgId, slug: action.organizationSlug, name: action.organization },
    )),
  });
}
