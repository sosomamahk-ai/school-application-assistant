# 🔍 登录 500 错误诊断指南

如果登录页面出现 500 错误，请按照以下步骤诊断和修复。

## 🚨 快速诊断

### 步骤 1: 检查健康状态

访问健康检查端点：

```
https://school-application-assistant.vercel.app/api/health
```

**正常响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "checks": {
    "environmentVariables": {
      "DATABASE_URL": true,
      "JWT_SECRET": true,
      "NEXT_PUBLIC_APP_URL": true,
      "OPENAI_API_KEY": true
    },
    "database": {
      "connected": true,
      "error": null
    }
  }
}
```

**如果返回 503 错误：**
- 检查 `checks.environmentVariables` - 哪些变量缺失
- 检查 `checks.database.connected` - 数据库是否连接成功
- 查看 `checks.database.error` - 数据库错误信息

### 步骤 2: 检查 Vercel 日志

1. 登录 [Vercel Dashboard](https://vercel.com)
2. 进入项目：`school-application-assistant`
3. 点击 **Functions** 标签
4. 找到 `/api/auth/login` 函数
5. 查看 **Logs** 标签中的错误信息

查找以下错误模式：

#### 错误 1: JWT_SECRET 未设置
```
[Login API] JWT_SECRET is not set
```

**解决方案：**
1. Vercel → Settings → Environment Variables
2. 添加 `JWT_SECRET`
3. 值：生成一个至少 32 字符的随机字符串
4. 选择所有环境（Production, Preview, Development）
5. 保存后重新部署

#### 错误 2: 数据库连接失败
```
[Login API] Database connection failed
```

**可能原因：**
- `DATABASE_URL` 未设置
- `DATABASE_URL` 格式错误
- 数据库服务器不可访问
- 网络连接问题

**解决方案：**
1. 检查 `DATABASE_URL` 是否已设置
2. 验证连接字符串格式：`postgresql://user:password@host:port/database`
3. 测试数据库连接（见下方）

#### 错误 3: 数据库查询失败
```
[Login API] Database query failed
```

**可能原因：**
- 数据库表不存在（需要运行迁移）
- 数据库权限问题
- Prisma 客户端未正确生成

**解决方案：**
1. 运行数据库迁移（见下方）
2. 检查数据库用户权限
3. 重新生成 Prisma 客户端

## 🔧 修复步骤

### 修复 1: 配置环境变量

#### 在 Vercel 中添加环境变量

1. **访问 Vercel 项目设置**
   - 登录 https://vercel.com
   - 进入项目：`school-application-assistant`
   - 点击 **Settings** → **Environment Variables**

2. **添加必需变量**

   **DATABASE_URL**
   ```
   Name: DATABASE_URL
   Value: postgresql://user:password@host:port/database
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

   **JWT_SECRET**
   ```
   Name: JWT_SECRET
   Value: [生成至少 32 字符的随机字符串]
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

   **NEXT_PUBLIC_APP_URL**
   ```
   Name: NEXT_PUBLIC_APP_URL
   Value: https://school-application-assistant.vercel.app
   Environments: ✅ Production ✅ Preview ✅ Development
   ```

3. **重新部署**
   - 点击 **Deployments** 标签
   - 找到最新部署
   - 点击 `...` → **Redeploy**

### 修复 2: 运行数据库迁移

如果数据库表不存在，需要运行迁移：

#### 方法 A: 使用 Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 链接项目
cd school-application-assistant
vercel link

# 4. 拉取环境变量
vercel env pull .env.local

# 5. 运行迁移
npx prisma migrate deploy

# 6. 生成 Prisma 客户端
npx prisma generate
```

#### 方法 B: 使用本地数据库连接

```bash
# 1. 在本地 .env 文件中设置生产数据库 URL
DATABASE_URL="postgresql://user:password@host:port/database"

# 2. 运行迁移
npx prisma migrate deploy

# 3. 生成客户端
npx prisma generate
```

### 修复 3: 验证数据库连接

#### 测试数据库连接字符串

```bash
# 使用 psql 测试连接
psql "postgresql://user:password@host:port/database"

# 如果连接成功，运行测试查询
SELECT 1;
```

#### 检查数据库表是否存在

```sql
-- 连接到数据库后运行
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

应该看到以下表：
- `User`
- `UserProfile`
- `SchoolFormTemplate`
- `Application`
- `_prisma_migrations`

如果表不存在，运行迁移：
```bash
npx prisma migrate deploy
```

## 📋 检查清单

使用以下清单确保所有配置正确：

- [ ] **Vercel 环境变量已设置**
  - [ ] `DATABASE_URL` 已设置且格式正确
  - [ ] `JWT_SECRET` 已设置且长度 ≥32 字符
  - [ ] `NEXT_PUBLIC_APP_URL` 已设置且使用 HTTPS

- [ ] **数据库已配置**
  - [ ] 数据库服务器正在运行
  - [ ] 连接字符串可以成功连接
  - [ ] 数据库迁移已运行
  - [ ] Prisma 客户端已生成

- [ ] **应用已重新部署**
  - [ ] 添加环境变量后已重新部署
  - [ ] 部署成功完成
  - [ ] 没有构建错误

- [ ] **健康检查通过**
  - [ ] `/api/health` 返回 `status: "ok"`
  - [ ] 数据库连接成功
  - [ ] 所有环境变量存在

## 🔍 详细诊断

### 查看 Vercel 函数日志

1. **访问函数日志**
   - Vercel → 项目 → **Functions** 标签
   - 找到 `/api/auth/login`
   - 点击查看详情
   - 查看 **Logs** 标签

2. **查找错误信息**
   - 查找 `[Login API]` 开头的日志
   - 查看错误堆栈跟踪
   - 检查 Prisma 错误代码

### 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|---------|------|---------|
| `P1001` | 无法连接到数据库服务器 | 检查 DATABASE_URL 和网络连接 |
| `P1008` | 操作超时 | 检查数据库服务器状态 |
| `P1017` | 服务器关闭连接 | 检查数据库服务器日志 |
| `P2002` | 唯一约束违反 | 数据库数据问题 |
| `P2025` | 记录未找到 | 正常（用户不存在） |

### 测试 API 端点

#### 使用 curl 测试登录

```bash
curl -X POST https://school-application-assistant.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "testpassword"
  }'
```

#### 使用浏览器测试健康检查

直接访问：
```
https://school-application-assistant.vercel.app/api/health
```

## 🆘 仍然无法解决？

如果按照上述步骤仍无法解决问题：

1. **检查 Vercel 构建日志**
   - Deployments → 最新部署 → 查看构建日志
   - 查找 Prisma 生成错误

2. **验证 Prisma Schema**
   ```bash
   npx prisma validate
   ```

3. **重新生成 Prisma 客户端**
   ```bash
   npx prisma generate
   ```

4. **检查数据库迁移状态**
   ```bash
   npx prisma migrate status
   ```

5. **查看 Vercel 函数日志**
   - 在 Vercel Dashboard 中查看实时日志
   - 查找具体的错误信息

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. 健康检查端点响应：`/api/health`
2. Vercel 函数日志中的错误信息
3. 环境变量配置状态（隐藏敏感信息）
4. 数据库连接测试结果

---

**提示：** 大多数 500 错误都是由数据库连接问题或缺失的环境变量引起的。确保所有环境变量都已正确配置并重新部署应用。

