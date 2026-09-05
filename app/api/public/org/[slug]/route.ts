import { getOrganizationBySlug, getRecentPublishedActionsForOrganization } from '@/lib/db';
import { publicActionJson } from '@/lib/public-api';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const organization = await getOrganizationBySlug(slug);
  if (!organization) return Response.json({ error: 'Organization not found.' }, { status: 404 });

  const actions = await getRecentPublishedActionsForOrganization(organization.id);
  return Response.json({
    ...organization,
    url: `/org/${organization.slug}`,
    actions: actions.map((action) => publicActionJson(
      action,
      { id: action.issueId, slug: action.issueSlug, name: action.issue },
      { id: organization.id, slug: organization.slug, name: organization.name },
    )),
  });
}
