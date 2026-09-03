CREATE TYPE "public"."action_type" AS ENUM('Petition', 'Lawsuit', 'Campaign');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('active', 'planned');--> statement-breakpoint
CREATE TABLE "actions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"issue_id" bigint NOT NULL,
	"slug" text NOT NULL,
	"type" "action_type" NOT NULL,
	"title" text NOT NULL,
	"organization" text NOT NULL,
	"detail" text NOT NULL,
	"effort" text NOT NULL,
	"href" text NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "actions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"status" "issue_status" DEFAULT 'planned' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issues_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actions_issue_published_idx" ON "actions" USING btree ("issue_id","published","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "actions_issue_title_unique" ON "actions" USING btree ("issue_id","title");