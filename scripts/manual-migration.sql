-- 手动迁移脚本：添加 ApplicationData 表
-- 如果 Prisma migrate 卡死，可以直接在数据库中执行此 SQL

-- 创建 ApplicationData 表
CREATE TABLE IF NOT EXISTS "ApplicationData" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationData_pkey" PRIMARY KEY ("id")
);

-- 创建唯一索引（schoolId + userId 组合唯一）
CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationData_schoolId_userId_key" 
ON "ApplicationData"("schoolId", "userId");

-- 创建索引（提高查询性能）
CREATE INDEX IF NOT EXISTS "ApplicationData_schoolId_idx" 
ON "ApplicationData"("schoolId");

CREATE INDEX IF NOT EXISTS "ApplicationData_userId_idx" 
ON "ApplicationData"("userId");

-- 验证表是否创建成功
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'ApplicationData'
ORDER BY ordinal_position;

