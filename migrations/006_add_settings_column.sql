ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "settings" jsonb DEFAULT '{}'::jsonb; 