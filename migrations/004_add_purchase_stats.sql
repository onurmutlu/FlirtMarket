ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "total_purchased" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "last_purchase_at" timestamp,
ADD COLUMN IF NOT EXISTS "purchase_count" integer DEFAULT 0; 