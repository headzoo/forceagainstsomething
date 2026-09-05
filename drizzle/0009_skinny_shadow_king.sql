ALTER TABLE "actions" DROP CONSTRAINT "actions_slug_unique";--> statement-breakpoint
ALTER TABLE "orgs" ADD COLUMN "slug" text;--> statement-breakpoint
DO $$
DECLARE
  organization record;
  base_slug text;
  candidate_slug text;
  suffix integer;
BEGIN
  FOR organization IN SELECT "id", "name" FROM "orgs" ORDER BY "id" LOOP
    base_slug := trim(both '-' from regexp_replace(lower(organization."name"), '[^a-z0-9]+', '-', 'g'));
    IF base_slug = '' THEN
      base_slug := 'organization';
    END IF;

    candidate_slug := base_slug;
    suffix := 2;
    WHILE EXISTS (SELECT 1 FROM "orgs" WHERE "slug" = candidate_slug) LOOP
      candidate_slug := base_slug || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;

    UPDATE "orgs" SET "slug" = candidate_slug WHERE "id" = organization."id";
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "orgs" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "actions_issue_slug_unique" ON "actions" USING btree ("issue_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "orgs_slug_unique" ON "orgs" USING btree ("slug");
