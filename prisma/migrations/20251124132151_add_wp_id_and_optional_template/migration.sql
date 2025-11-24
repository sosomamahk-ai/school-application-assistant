-- AlterTable: Make templateId optional
ALTER TABLE "School" 
  ALTER COLUMN "templateId" DROP NOT NULL;

-- AddColumn: Add wpId (WordPress ID) - only if column doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'School' AND column_name = 'wpId') THEN
    ALTER TABLE "School" ADD COLUMN "wpId" INTEGER;
  END IF;
END $$;

-- AddColumn: Add profileType - only if column doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'School' AND column_name = 'profileType') THEN
    ALTER TABLE "School" ADD COLUMN "profileType" TEXT;
  END IF;
END $$;

-- CreateIndex: Add unique index on wpId (only if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "School_wpId_key" ON "School"("wpId") WHERE "wpId" IS NOT NULL;

-- CreateIndex: Add index on wpId for lookups (only if not exists)
CREATE INDEX IF NOT EXISTS "School_wpId_idx" ON "School"("wpId");

-- CreateIndex: Add index on templateId (only if not exists)
CREATE INDEX IF NOT EXISTS "School_templateId_idx" ON "School"("templateId");

