CREATE EXTENSION IF NOT EXISTS lakebase_text;--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "search_tsv" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(detail, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED;--> statement-breakpoint
ALTER TABLE "orgs" ADD COLUMN "search_tsv" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;--> statement-breakpoint
CREATE INDEX actions_search_bm25 ON actions
  USING lakebase_bm25 (search_tsv)
  WITH (k1 = 1.2, b = 0.75, default_limit = 20);--> statement-breakpoint
CREATE INDEX orgs_search_bm25 ON orgs
  USING lakebase_bm25 (search_tsv)
  WITH (k1 = 1.2, b = 0.75, default_limit = 20);
