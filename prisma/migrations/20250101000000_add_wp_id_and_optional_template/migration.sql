-- AlterTable: Make templateId optional and add wpId
ALTER TABLE "School" 
  ALTER COLUMN "templateId" DROP NOT NULL;

-- AddColumn: Add wpId (WordPress ID)
ALTER TABLE "School" 
  ADD COLUMN IF NOT EXISTS "wpId" INTEGER;

-- AddColumn: Add profileType
ALTER TABLE "School" 
  ADD COLUMN IF NOT EXISTS "profileType" TEXT;

-- CreateIndex: Add unique index on wpId
CREATE UNIQUE INDEX IF NOT EXISTS "School_wpId_key" ON "School"("wpId") WHERE "wpId" IS NOT NULL;

-- CreateIndex: Add index on wpId for lookups
CREATE INDEX IF NOT EXISTS "School_wpId_idx" ON "School"("wpId");

-- CreateIndex: Add index on templateId (if not exists)
CREATE INDEX IF NOT EXISTS "School_templateId_idx" ON "School"("templateId");

