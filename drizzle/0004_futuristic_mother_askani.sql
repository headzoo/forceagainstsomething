CREATE TABLE "action_bookmarks" (
	"user_id" text NOT NULL,
	"action_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "action_bookmarks_user_id_action_id_pk" PRIMARY KEY("user_id","action_id")
);
--> statement-breakpoint
ALTER TABLE "action_bookmarks" ADD CONSTRAINT "action_bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_bookmarks" ADD CONSTRAINT "action_bookmarks_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_bookmarks_action_idx" ON "action_bookmarks" USING btree ("action_id");