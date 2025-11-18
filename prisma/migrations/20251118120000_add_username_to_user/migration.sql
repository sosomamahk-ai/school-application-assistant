-- Add username column for optional username-based login
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Ensure usernames are unique when provided
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username") WHERE "username" IS NOT NULL;

