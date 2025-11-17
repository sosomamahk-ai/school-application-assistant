-- ============================================
-- 创建管理员账号 SQL 脚本
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 第1步：添加 role 字段（如果不存在）
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- 第2步：创建或更新管理员账号
-- 注意：密码需要先通过 bcrypt 加密
-- 
-- 推荐方法：
-- 1. 先通过注册API注册账号（email: administrator, password: admin-soma）
-- 2. 然后运行下面的SQL将该账号升级为管理员

-- 将 administrator 账号升级为管理员
UPDATE "User"
SET 
  role = 'admin',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE email = 'administrator';

-- 验证管理员账号是否创建成功
SELECT 
  id,
  email,
  role,
  "createdAt"
FROM "User"
WHERE email = 'administrator' OR role = 'admin';

-- ============================================
-- 如果需要直接在数据库中创建（需要 bcrypt hash）：
-- 
-- 方法1：使用 Node.js 脚本生成 hash
-- 运行：npx ts-node template-examples/create-admin-account.ts
--
-- 方法2：手动计算 bcrypt hash
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('admin-soma', 10);
-- console.log(hash);
--
-- 然后运行：
-- INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt")
-- VALUES (
--   gen_random_uuid()::text,
--   'administrator',
--   '$2a$10$YOUR_BCRYPT_HASH_HERE', -- 替换为实际的 bcrypt hash
--   'admin',
--   CURRENT_TIMESTAMP,
--   CURRENT_TIMESTAMP
-- )
-- ON CONFLICT (email) DO UPDATE SET
--   role = 'admin',
--   password = EXCLUDED.password,
--   "updatedAt" = CURRENT_TIMESTAMP;
-- ============================================
