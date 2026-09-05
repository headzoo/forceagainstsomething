ALTER TABLE "action_bookmarks" RENAME TO "action_likes";--> statement-breakpoint
ALTER TABLE "action_likes" DROP CONSTRAINT "action_bookmarks_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "action_likes" DROP CONSTRAINT "action_bookmarks_action_id_actions_id_fk";
--> statement-breakpoint
DROP INDEX "action_bookmarks_action_idx";--> statement-breakpoint
ALTER TABLE "action_likes" DROP CONSTRAINT "action_bookmarks_user_id_action_id_pk";--> statement-breakpoint
ALTER TABLE "action_likes" ADD CONSTRAINT "action_likes_user_id_action_id_pk" PRIMARY KEY("user_id","action_id");--> statement-breakpoint
ALTER TABLE "action_likes" ADD CONSTRAINT "action_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_likes" ADD CONSTRAINT "action_likes_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_likes_action_idx" ON "action_likes" USING btree ("action_id");