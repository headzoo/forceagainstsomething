import { sql } from 'drizzle-orm';
import { bigint, bigserial, boolean, customType, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

export * from './auth-schema';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const issueStatus = pgEnum('issue_status', ['active', 'planned']);
export const actionType = pgEnum('action_type', ['Petition', 'Lawsuit', 'Campaign']);

export const issues = pgTable('issues', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  detail: text('detail').notNull().default(''),
  description: text('description').notNull().default(''),
  status: issueStatus('status').notNull().default('planned'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orgs = pgTable('orgs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  ownerUserId: text('owner_user_id').references(() => user.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  website: text('website'),
  description: text('description').notNull().default(''),
  searchTsv: tsvector('search_tsv').generatedAlwaysAs(sql`
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  `),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('orgs_owner_user_unique').on(table.ownerUserId),
  uniqueIndex('orgs_name_unique').on(table.name),
]);

export const actions = pgTable('actions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  issueId: bigint('issue_id', { mode: 'number' }).notNull().references(() => issues.id, { onDelete: 'cascade' }),
  orgId: bigint('org_id', { mode: 'number' }).notNull().references(() => orgs.id, { onDelete: 'restrict' }),
  submittedByUserId: text('submitted_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  automaticallyAdded: boolean('automatically_added').notNull().default(false),
  slug: text('slug').notNull().unique(),
  type: actionType('type').notNull(),
  title: text('title').notNull(),
  detail: text('detail').notNull(),
  description: text('description').notNull().default(''),
  effort: text('effort').notNull(),
  href: text('href').notNull(),
  urgent: boolean('urgent').notNull().default(false),
  verified: boolean('verified').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  approved: boolean('approved').notNull().default(false),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedByUserId: text('approved_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  published: boolean('published').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  searchTsv: tsvector('search_tsv').generatedAlwaysAs(sql`
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(detail, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  `),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('actions_issue_approved_published_idx').on(table.issueId, table.approved, table.published, table.sortOrder),
  index('actions_org_idx').on(table.orgId),
  index('actions_submitter_idx').on(table.submittedByUserId),
  uniqueIndex('actions_issue_title_unique').on(table.issueId, table.title),
]);

export const actionBookmarks = pgTable('action_bookmarks', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  actionId: bigint('action_id', { mode: 'number' }).notNull().references(() => actions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.actionId] }),
  index('action_bookmarks_action_idx').on(table.actionId),
]);

export type Issue = typeof issues.$inferSelect;
export type Organization = typeof orgs.$inferSelect;
export type ActionRecord = typeof actions.$inferSelect;
export type ActionBookmark = typeof actionBookmarks.$inferSelect;
