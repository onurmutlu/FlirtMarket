ALTER TABLE "users"
ADD COLUMN "total_purchased" integer DEFAULT 0,
ADD COLUMN "last_purchase_at" timestamp,
ADD COLUMN "purchase_count" integer DEFAULT 0; 