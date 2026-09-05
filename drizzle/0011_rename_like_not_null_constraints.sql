ALTER TABLE "action_likes" RENAME CONSTRAINT "action_bookmarks_user_id_not_null" TO "action_likes_user_id_not_null";--> statement-breakpoint
ALTER TABLE "action_likes" RENAME CONSTRAINT "action_bookmarks_action_id_not_null" TO "action_likes_action_id_not_null";--> statement-breakpoint
ALTER TABLE "action_likes" RENAME CONSTRAINT "action_bookmarks_created_at_not_null" TO "action_likes_created_at_not_null";
