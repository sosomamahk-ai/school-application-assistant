-- ============================================
-- 添加 role 字段到 User 表
-- 在 Supabase SQL Editor 中运行此脚本
-- 这是修复注册/登录错误的必要步骤
-- ============================================

-- 添加 role 字段（如果不存在）
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- 更新现有用户的 role（如果为空，设置为 'user'）
UPDATE "User"
SET role = 'user'
WHERE role IS NULL;

-- 验证字段已添加
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'User' AND column_name = 'role';

-- 查看所有用户及其角色
SELECT 
  id,
  email,
  role,
  "createdAt"
FROM "User"
LIMIT 10;

