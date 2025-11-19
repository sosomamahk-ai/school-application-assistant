# Supabase 连接问题排查

## 当前状态

✅ `.env` 文件格式正确
❌ 数据库连接仍然失败："Tenant or user not found"

## 🔍 可能的原因

### 1. 密码不正确

即使格式正确，如果密码错误也会导致此错误。

**解决方案**：
- 在 Supabase Dashboard 中重新获取密码
- 或者重置数据库密码

### 2. 连接字符串格式问题

Supabase 的连接字符串可能有不同的格式。

**解决方案**：从 Supabase Dashboard 重新获取连接字符串

## 📋 步骤 1: 从 Supabase Dashboard 获取正确的连接字符串

1. **登录 Supabase Dashboard**
   - 访问 https://app.supabase.com
   - 选择你的项目

2. **获取连接字符串**
   - 点击 **Settings**（左下角齿轮图标）
   - 点击 **Database**
   - 找到 **Connection string** 部分
   - **重要**：选择 **Session mode**（不是 Transaction mode）
   - 复制连接字符串

3. **连接字符串格式应该是**：
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   或者
   ```
   postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

## 📋 步骤 2: 检查 Supabase 项目状态

1. **确认项目未暂停**
   - 在 Dashboard 中检查项目状态
   - 确保项目处于活跃状态

2. **检查数据库密码**
   - Settings → Database → Database Password
   - 确认密码是否正确
   - 如果需要，点击 "Reset database password" 重置密码

## 📋 步骤 3: 尝试不同的连接方式

### 选项 A: 使用直接连接（端口 5432）

临时修改 `.env` 文件，使用直接连接测试：

```env
# 临时使用直接连接测试
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

然后运行测试：
```bash
npm run test:db
```

### 选项 B: 使用完整的项目引用格式

如果 Supabase 要求使用项目引用格式，尝试：

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

注意：这里使用了 `postgres.[PROJECT-REF]` 格式（项目引用）

## 📋 步骤 4: 在 Supabase SQL Editor 中测试

1. **打开 Supabase SQL Editor**
   - Dashboard → SQL Editor

2. **运行测试查询**：
   ```sql
   SELECT version();
   ```

3. **如果查询成功**：
   - 说明数据库连接正常
   - 问题可能在连接字符串格式或密码

4. **如果查询失败**：
   - 可能是 Supabase 服务端问题
   - 检查 Supabase 状态页面：https://status.supabase.com/

## 📋 步骤 5: 验证密码

如果怀疑密码问题，可以：

1. **重置数据库密码**
   - Settings → Database → Database Password
   - 点击 "Reset database password"
   - 复制新密码
   - 更新 `.env` 文件

2. **使用新密码测试连接**

## 🔧 推荐的完整配置

根据 Supabase 的最新格式，尝试以下配置：

```env
# 如果 Supabase Dashboard 显示的是 postgres.[PROJECT-REF] 格式
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 如果 Supabase Dashboard 显示的是 postgres 格式
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# DIRECT_URL 应该使用直接连接
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

## 🆘 如果仍然无法解决

1. **检查 Supabase 状态**
   - https://status.supabase.com/
   - 确认服务正常运行

2. **联系 Supabase 支持**
   - 在 Dashboard 中提交支持请求
   - 提供错误信息和连接字符串（隐藏密码）

3. **尝试创建新项目**
   - 如果当前项目有问题，可以创建新项目测试

