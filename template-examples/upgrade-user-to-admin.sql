-- ============================================
-- 将现有用户升级为管理员
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 方法1：只升级角色（不修改密码）
-- 将 sosomamahk@gmail.com 账号升级为管理员
UPDATE "User"
SET 
  role = 'admin',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE email = 'sosomamahk@gmail.com';

-- 验证升级是否成功
SELECT 
  id,
  email,
  role,
  "createdAt",
  "updatedAt"
FROM "User"
WHERE email = 'sosomamahk@gmail.com';

-- ============================================
-- 方法2：如果需要重置密码（需要先计算 bcrypt hash）
-- 
-- 步骤：
-- 1. 使用 Node.js 计算新密码的 bcrypt hash：
--    const bcrypt = require('bcryptjs');
--    bcrypt.hash('admin-sosomama', 10).then(hash => console.log(hash));
--
-- 2. 复制生成的 hash，替换下面的 YOUR_BCRYPT_HASH
--
-- 3. 运行以下 SQL：
--
-- UPDATE "User"
-- SET 
--   role = 'admin',
--   password = 'YOUR_BCRYPT_HASH_HERE',  -- 替换为实际的 bcrypt hash
--   "updatedAt" = CURRENT_TIMESTAMP
-- WHERE email = 'sosomamahk@gmail.com';
-- ============================================

-- ============================================
-- 查看所有管理员账号
-- ============================================
SELECT 
  id,
  email,
  role,
  "createdAt"
FROM "User"
WHERE role = 'admin';

-- ============================================
-- 如果账号不存在，可以先检查
-- ============================================
SELECT 
  id,
  email,
  role,
  "createdAt"
FROM "User"
WHERE email = 'sosomamahk@gmail.com';

