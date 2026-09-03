import { bigint, bigserial, boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const issueStatus = pgEnum('issue_status', ['active', 'planned']);
export const actionType = pgEnum('action_type', ['Petition', 'Lawsuit', 'Campaign']);

export const issues = pgTable('issues', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  status: issueStatus('status').notNull().default('planned'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const actions = pgTable('actions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  issueId: bigint('issue_id', { mode: 'number' }).notNull().references(() => issues.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  type: actionType('type').notNull(),
  title: text('title').notNull(),
  organization: text('organization').notNull(),
  detail: text('detail').notNull(),
  effort: text('effort').notNull(),
  href: text('href').notNull(),
  urgent: boolean('urgent').notNull().default(false),
  verified: boolean('verified').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  published: boolean('published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('actions_issue_published_idx').on(table.issueId, table.published, table.sortOrder),
  uniqueIndex('actions_issue_title_unique').on(table.issueId, table.title),
]);

export type Issue = typeof issues.$inferSelect;
export type DirectoryAction = typeof actions.$inferSelect;
