# 管理员账号设置指南

## 📋 概述

本系统已实现管理员权限控制，只有管理员账号才能访问"管理模板"功能。普通用户只能选择学校并填写申请表单。

## 🔐 管理员账号信息

- **邮箱**: `administrator`
- **密码**: `admin-soma`

## 🚀 创建管理员账号的三种方法

### 方法1：使用 Node.js 脚本（推荐）

1. **确保已安装依赖**
   ```bash
   npm install
   # 或
   yarn install
   ```

2. **配置数据库连接**
   - 确保 `.env` 文件中有正确的 `DATABASE_URL`
   - 或者在 Vercel 环境变量中设置

3. **运行创建脚本**
   ```bash
   npx ts-node template-examples/create-admin-account.ts
   ```

   脚本会自动：
   - 检查管理员账号是否已存在
   - 如果存在，更新密码和角色
   - 如果不存在，创建新管理员账号
   - 使用 bcrypt 加密密码

4. **验证创建成功**
   - 脚本会输出管理员账号信息
   - 使用账号登录验证

---

### 方法2：使用 Supabase SQL Editor

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择您的项目

2. **打开 SQL Editor**
   - 左侧菜单点击 **"SQL Editor"**
   - 点击 **"New query"**

3. **添加 role 字段**（如果还没有）
   ```sql
   ALTER TABLE "User" 
   ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';
   ```

4. **注册管理员账号**
   - 先在应用中注册账号（email: `administrator`, password: `admin-soma`）
   - 然后运行以下 SQL 升级为管理员：

   ```sql
   UPDATE "User"
   SET 
     role = 'admin',
     "updatedAt" = CURRENT_TIMESTAMP
   WHERE email = 'administrator';
   ```

5. **验证**
   ```sql
   SELECT id, email, role, "createdAt"
   FROM "User"
   WHERE email = 'administrator';
   ```

---

### 方法3：直接在数据库中创建（需要 bcrypt hash）

1. **生成 bcrypt hash**
   
   使用 Node.js：
   ```javascript
   const bcrypt = require('bcryptjs');
   bcrypt.hash('admin-soma', 10).then(hash => {
     console.log(hash);
   });
   ```

   或在线工具：
   - 访问：https://bcrypt-generator.com/
   - 输入密码：`admin-soma`
   - 轮数：10
   - 复制生成的 hash

2. **在 Supabase SQL Editor 中执行**
   ```sql
   -- 添加 role 字段
   ALTER TABLE "User" 
   ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';
   
   -- 插入管理员账号（替换 YOUR_BCRYPT_HASH）
   INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt")
   VALUES (
     gen_random_uuid()::text,
     'administrator',
     'YOUR_BCRYPT_HASH_HERE',  -- 替换为实际的 bcrypt hash
     'admin',
     CURRENT_TIMESTAMP,
     CURRENT_TIMESTAMP
   )
   ON CONFLICT (email) DO UPDATE SET
     role = 'admin',
     password = EXCLUDED.password,
     "updatedAt" = CURRENT_TIMESTAMP;
   ```

---

## ✅ 验证管理员账号

1. **登录系统**
   - 访问：https://your-app.vercel.app/auth/login
   - 邮箱：`administrator`
   - 密码：`admin-soma`

2. **检查导航栏**
   - 登录后应该能看到 **"管理模板"** 链接
   - 点击应该能进入 `/admin/templates` 页面

3. **检查权限**
   - 普通用户登录后不应该看到"管理模板"链接
   - 普通用户直接访问 `/admin/templates` 应该返回 403 错误

---

## 🔒 权限说明

### 管理员权限（role: 'admin'）
- ✅ 查看和编辑所有模板（包括禁用的）
- ✅ 创建新模板
- ✅ 删除模板
- ✅ 导入/导出模板
- ✅ 启用/禁用模板

### 普通用户权限（role: 'user'）
- ✅ 查看已启用的学校模板
- ✅ 选择学校并填写申请表单
- ✅ 查看个人申请列表
- ✅ 编辑个人资料
- ❌ **无法访问管理模板功能**

---

## 🛠️ 数据库迁移

如果您已经运行了应用，需要迁移现有数据库：

1. **运行 Prisma 迁移**
   ```bash
   npx prisma migrate dev --name add_user_role
   ```

2. **或者直接在 Supabase 中添加字段**
   ```sql
   ALTER TABLE "User" 
   ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';
   ```

3. **重新生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

---

## 📝 注意事项

1. **密码安全**
   - 生产环境中请修改默认密码
   - 使用强密码策略
   - 定期更换密码

2. **账号管理**
   - 建议限制管理员账号数量
   - 定期审核管理员权限
   - 保留管理员操作日志

3. **数据库备份**
   - 修改数据库前请先备份
   - 建议在生产环境前先在测试环境验证

---

## 🐛 故障排查

### 问题1：登录后看不到"管理模板"链接

**原因**：
- 账号角色不是 `admin`
- localStorage 中的用户信息没有更新

**解决方案**：
1. 检查数据库中账号的 role 字段：
   ```sql
   SELECT email, role FROM "User" WHERE email = 'administrator';
   ```
2. 确保 role = 'admin'
3. 退出登录后重新登录
4. 清除浏览器缓存和 localStorage

### 问题2：访问管理页面返回 403

**原因**：
- JWT token 中没有 role 信息
- 用户角色不是 admin

**解决方案**：
1. 退出登录后重新登录
2. 检查 JWT token 中是否包含 role
3. 确保数据库中用户 role = 'admin'

### 问题3：TypeScript 类型错误

**原因**：
- Prisma Client 没有重新生成

**解决方案**：
```bash
npx prisma generate
```

---

## 📞 需要帮助？

如果遇到问题：
1. 检查浏览器控制台错误信息
2. 检查 Vercel 函数日志
3. 检查 Supabase 数据库日志
4. 查看本指南的故障排查部分

---

**祝您使用愉快！** 🎉

