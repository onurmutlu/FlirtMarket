ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "is_verified" boolean DEFAULT false; 