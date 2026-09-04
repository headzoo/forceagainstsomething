CREATE TABLE "orgs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"owner_user_id" text,
	"name" text NOT NULL,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "actions_issue_published_idx";--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "published" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "org_id" bigint;--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "submitted_by_user_id" text;--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "approved_by_user_id" text;--> statement-breakpoint
INSERT INTO "orgs" ("name")
SELECT DISTINCT "organization" FROM "actions";--> statement-breakpoint
UPDATE "actions"
SET "org_id" = "orgs"."id"
FROM "orgs"
WHERE "orgs"."name" = "actions"."organization";--> statement-breakpoint
UPDATE "actions"
SET "approved" = "published",
    "approved_at" = CASE WHEN "published" THEN now() ELSE NULL END;--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "org_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orgs" ADD CONSTRAINT "orgs_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "orgs_owner_user_unique" ON "orgs" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orgs_name_unique" ON "orgs" USING btree ("name");--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_submitted_by_user_id_user_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_approved_by_user_id_user_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actions_issue_approved_published_idx" ON "actions" USING btree ("issue_id","approved","published","sort_order");--> statement-breakpoint
CREATE INDEX "actions_org_idx" ON "actions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "actions_submitter_idx" ON "actions" USING btree ("submitted_by_user_id");--> statement-breakpoint
ALTER TABLE "actions" DROP COLUMN "organization";
