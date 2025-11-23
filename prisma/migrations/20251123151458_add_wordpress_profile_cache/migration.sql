-- CreateTable: WordPressProfileCache
-- 用于缓存 WordPress 学校配置文件数据

CREATE TABLE IF NOT EXISTS "WordPressProfileCache" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'current',
    "rawData" JSONB NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "WordPressProfileCache_lastSyncedAt_idx" ON "WordPressProfileCache"("lastSyncedAt");
