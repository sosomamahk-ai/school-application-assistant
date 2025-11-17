# 数据库迁移指南 - 添加 role 字段

## ⚠️ 重要：必须先完成此步骤

在运行应用之前，**必须**先在数据库中添加 `role` 字段，否则注册和登录功能会失败。

---

## 🔧 步骤 1：添加 role 字段

### 方法1：使用 Supabase SQL Editor（推荐）

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择您的项目

2. **打开 SQL Editor**
   - 左侧菜单点击 **"SQL Editor"**
   - 点击 **"New query"**

3. **复制并运行以下 SQL**

```sql
-- 添加 role 字段（如果不存在）
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- 更新现有用户的 role（如果为空，设置为 'user'）
UPDATE "User"
SET role = 'user'
WHERE role IS NULL;
```

4. **验证字段已添加**

```sql
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'User' AND column_name = 'role';
```

应该看到 `role` 字段存在，默认值为 `'user'`。

---

## 👤 步骤 2：将现有账号升级为管理员

### 方法1：只升级角色（不修改密码）

如果您的账号密码正确，只需要升级角色：

```sql
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
  "createdAt"
FROM "User"
WHERE email = 'sosomamahk@gmail.com';
```

### 方法2：使用 Node.js 脚本（重置密码）

如果您忘记了密码或需要重置密码：

1. **确保已配置 DATABASE_URL**
   - 在 `.env` 文件中设置 `DATABASE_URL`
   - 或在 Vercel 环境变量中设置

2. **运行重置脚本**

```bash
npx ts-node template-examples/reset-admin-password.ts
```

脚本会：
- 检查账号是否存在
- 重置密码为 `admin-sosomama`
- 升级角色为 `admin`

3. **使用新密码登录**
   - 邮箱：`sosomamahk@gmail.com`
   - 密码：`admin-sosomama`

### 方法3：手动重置密码（使用 SQL）

1. **生成 bcrypt hash**

使用 Node.js：
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('admin-sosomama', 10).then(hash => {
  console.log(hash);
});
```

或在线工具：
- 访问：https://bcrypt-generator.com/
- 输入密码：`admin-sosomama`
- 轮数：10
- 复制生成的 hash

2. **在 Supabase SQL Editor 中运行**

```sql
-- 替换 YOUR_BCRYPT_HASH 为实际的 bcrypt hash
UPDATE "User"
SET 
  role = 'admin',
  password = 'YOUR_BCRYPT_HASH_HERE',  -- 替换为实际的 bcrypt hash
  "updatedAt" = CURRENT_TIMESTAMP
WHERE email = 'sosomamahk@gmail.com';
```

---

## ✅ 验证步骤

### 1. 检查数据库字段

```sql
-- 查看 role 字段
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'User' AND column_name = 'role';
```

### 2. 检查管理员账号

```sql
-- 查看所有管理员
SELECT 
  id,
  email,
  role,
  "createdAt"
FROM "User"
WHERE role = 'admin';
```

### 3. 登录测试

1. 访问应用登录页面
2. 使用管理员账号登录：
   - 邮箱：`sosomamahk@gmail.com`
   - 密码：`admin-sosomama`（如果已重置）
3. 登录后应该能看到 **"管理模板"** 链接

---

## 🐛 故障排查

### 问题1：401 Invalid credentials

**可能原因：**
- 密码错误
- 账号不存在

**解决方案：**
1. 检查账号是否存在：
   ```sql
   SELECT email, role FROM "User" WHERE email = 'sosomamahk@gmail.com';
   ```
2. 如果账号存在，重置密码（见方法2或方法3）
3. 如果账号不存在，先注册账号，再升级为管理员

### 问题2：注册失败 - role 字段不存在

**解决方案：**
- 运行步骤1的SQL添加 role 字段
- 重新部署应用

### 问题3：登录成功但看不到"管理模板"链接

**可能原因：**
- 账号角色不是 `admin`
- localStorage 中的用户信息没有更新

**解决方案：**
1. 检查数据库中账号的 role：
   ```sql
   SELECT email, role FROM "User" WHERE email = 'sosomamahk@gmail.com';
   ```
2. 确保 role = 'admin'
3. 退出登录后重新登录
4. 清除浏览器缓存和 localStorage

---

## 📝 完整操作流程

### 场景1：账号已存在，但忘记密码

```bash
# 1. 重置密码并升级为管理员
npx ts-node template-examples/reset-admin-password.ts

# 2. 使用新密码登录
# 邮箱: sosomamahk@gmail.com
# 密码: admin-sosomama
```

### 场景2：账号已存在，密码记得

```sql
-- 在 Supabase SQL Editor 中运行
UPDATE "User"
SET role = 'admin', "updatedAt" = CURRENT_TIMESTAMP
WHERE email = 'sosomamahk@gmail.com';
```

### 场景3：账号不存在

1. 先在应用中注册账号（邮箱：`sosomamahk@gmail.com`）
2. 然后运行上面的 SQL 升级为管理员

---

## 🎯 管理员账号信息

- **邮箱**: `sosomamahk@gmail.com`
- **密码**: `admin-sosomama`（如果使用重置脚本）

**⚠️ 重要：请妥善保管管理员密码！**

---

**完成以上步骤后，您的应用应该可以正常工作了！** 🎉

