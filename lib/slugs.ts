import { and, eq, ne } from 'drizzle-orm';
import { actions, orgs } from '@/db/schema';
import { db } from '@/lib/db';

export function slugify(value: string, fallback: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

  return slug || fallback;
}

function withSuffix(base: string, suffix: number) {
  if (suffix === 1) return base;
  const ending = `-${suffix}`;
  return `${base.slice(0, 80 - ending.length).replace(/-+$/g, '')}${ending}`;
}

export async function uniqueActionSlug(issueId: number, value: string, excludeId?: number) {
  const base = slugify(value, 'action');

  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = withSuffix(base, suffix);
    const conditions = [eq(actions.issueId, issueId), eq(actions.slug, candidate)];
    if (excludeId) conditions.push(ne(actions.id, excludeId));
    const [existing] = await db.select({ id: actions.id }).from(actions).where(and(...conditions)).limit(1);
    if (!existing) return candidate;
  }

  return withSuffix(base, Date.now());
}

export async function uniqueOrganizationSlug(value: string, excludeId?: number) {
  const base = slugify(value, 'organization');

  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = withSuffix(base, suffix);
    const conditions = [eq(orgs.slug, candidate)];
    if (excludeId) conditions.push(ne(orgs.id, excludeId));
    const [existing] = await db.select({ id: orgs.id }).from(orgs).where(and(...conditions)).limit(1);
    if (!existing) return candidate;
  }

  return withSuffix(base, Date.now());
}
