ALTER TABLE "actions" ADD COLUMN "automatically_added" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "actions" SET "automatically_added" = true;
