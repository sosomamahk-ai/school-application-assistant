-- Add role column with default value for existing rows
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- Backfill any NULL role values to comply with NOT NULL constraint
UPDATE "User" SET "role" = 'user' WHERE "role" IS NULL;

-- Enforce NOT NULL once data is backfilled
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;

