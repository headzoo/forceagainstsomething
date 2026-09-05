ALTER TABLE "actions" ADD COLUMN "start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "end_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "actions_visibility_idx" ON "actions" USING btree ("approved","published","start_at","end_at","sort_order");--> statement-breakpoint
CREATE INDEX "actions_issue_visibility_idx" ON "actions" USING btree ("issue_id","approved","published","start_at","end_at","sort_order");--> statement-breakpoint
CREATE INDEX "actions_org_visibility_idx" ON "actions" USING btree ("org_id","approved","published","start_at","end_at","sort_order");