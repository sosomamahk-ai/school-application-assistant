# WordPress 数据定时同步 - 完成步骤指南

## ✅ 已完成的工作

### 1. 代码实现 ✅
- ✅ `src/services/wordpressCache.ts` - 缓存服务（支持多后端）
- ✅ `src/pages/api/cron/wordpress-sync.ts` - 定时同步 API
- ✅ `src/pages/api/wordpress/school-profiles-cached.ts` - 缓存读取 API

### 2. 数据库配置 ✅
- ✅ `prisma/schema.prisma` - 已添加 `WordPressProfileCache` 模型
- ✅ 迁移文件已创建并运行：`npx prisma migrate deploy`

### 3. Vercel 配置 ✅
- ✅ `vercel.json` - Cron Job 已配置（每天午夜运行）
- ✅ `CRON_SECRET` 环境变量已配置
- ✅ 代码已部署到 Vercel

### 4. 构建和部署 ✅
- ✅ 构建错误已修复
- ✅ 使用 Vercel CLI 手动部署成功

---

## ⏳ 接下来需要完成的步骤

### 步骤 1: 验证部署状态（2-3 分钟）

**操作：**

1. **访问 Vercel Dashboard**
   - 前往：https://vercel.com/dashboard
   - 选择项目：`school-application-assistant`
   - 前往 **Deployments** 标签

2. **检查最新部署**
   - 确认状态为 **Ready**（绿色）
   - 如果还在 **Building**，等待完成
   - 如果 **Error**，查看构建日志

3. **验证 API 路由已编译**
   - 点击部署查看构建日志
   - 确认看到：`ƒ /api/cron/wordpress-sync`

**预计时间：** 2-3 分钟

---

### 步骤 2: 测试 WordPress 同步 API（必需）

**操作：**

#### 方法 A: 使用测试脚本（推荐）

```powershell
.\test-wordpress-sync.ps1 -AppUrl "https://school-application-assistant.vercel.app" -Secret "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
```

#### 方法 B: 使用 PowerShell 命令

```powershell
$appUrl = "https://school-application-assistant.vercel.app"
$secret = "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
$url = "$appUrl/api/cron/wordpress-sync?secret=$secret"
Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 10
```

#### 方法 C: 使用浏览器

直接访问：
```
https://school-application-assistant.vercel.app/api/cron/wordpress-sync?secret=XCb2Tg10kclvah4jduFHJtGqZErLW58A
```

**预期响应（成功）：**

```json
{
  "success": true,
  "message": "WordPress data synced successfully",
  "stats": {
    "profilesCount": 150,
    "universitiesCount": 20,
    "totalCount": 170
  },
  "cache": {
    "savedTo": ["postgres", "json"],
    "errors": [],
    "backendsCount": 2
  },
  "duration": "2345ms",
  "timestamp": "2024-11-23T10:30:00.000Z"
}
```

**如果返回 404：**
- 等待几分钟让 CDN 缓存刷新
- 或添加时间戳参数：`?secret=XXX&t=1234567890`

**如果返回 401：**
- 检查 `CRON_SECRET` 环境变量是否正确
- 确认值匹配：`XCb2Tg10kclvah4jduFHJtGqZErLW58A`

**如果返回 500：**
- 查看 Vercel Dashboard > Functions > Logs
- 检查 WordPress API 连接
- 检查数据库连接

**预计时间：** 5 分钟

---

### 步骤 3: 验证 Cron Job 配置（必需）

**操作：**

1. **访问 Vercel Dashboard**
   - Settings > **Cron Jobs**

2. **检查配置**
   - ✅ 确认 `/api/cron/wordpress-sync` 已列出
   - ✅ 确认 **Schedule** 为 `0 0 * * *`（每天午夜）
   - ✅ 确认 **Status** 为 **Active**

3. **查看 Cron 历史**
   - 点击 Cron Job 查看执行历史
   - 确认下次运行时间

**预计时间：** 2 分钟

---

### 步骤 4: 测试缓存读取 API（推荐）

**操作：**

测试带缓存的读取 API，确认缓存功能正常：

```powershell
# 测试缓存读取（优先从缓存读取）
$url = "https://school-application-assistant.vercel.app/api/wordpress/school-profiles-cached"
Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 5

# 强制刷新（忽略缓存）
$url = "https://school-application-assistant.vercel.app/api/wordpress/school-profiles-cached?refresh=true"
Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 5
```

**预期：**
- 第一次调用可能从 WordPress API 读取（缓存未命中）
- 第二次调用应该从缓存读取（更快）
- 使用 `?refresh=true` 会强制从 WordPress 重新获取

**预计时间：** 5 分钟

---

### 步骤 5: 验证数据库缓存（可选）

**操作：**

检查数据是否已保存到数据库：

```bash
# 使用 Prisma Studio
npx prisma studio

# 或使用 psql
psql $DATABASE_URL -c "SELECT id, \"lastSyncedAt\", \"updatedAt\" FROM \"WordPressProfileCache\";"
```

**预期：**
- 应该看到一条记录，`id` 为 `'current'`
- `lastSyncedAt` 应该是最近的时间戳
- `rawData` 包含 WordPress 数据

**预计时间：** 2 分钟

---

### 步骤 6: 配置 Vercel KV / Redis（可选，推荐）

**目的：** 提升缓存性能，减少数据库查询

**操作：**

#### 选项 A: 使用 Vercel KV（推荐）

1. **访问 Vercel Dashboard**
   - Storage > **Create Database**
   - 选择 **KV**
   - 选择区域（推荐：与项目相同）
   - 点击 **Create**

2. **自动配置**
   - Vercel 会自动添加 `KV_URL` 和 `KV_REST_API_TOKEN`
   - 无需手动配置

3. **重新部署**
   - 环境变量添加后会自动触发重新部署
   - 或手动触发：Deployments > Redeploy

#### 选项 B: 使用 Upstash Redis

1. **访问 Upstash**
   - https://console.upstash.com/
   - 创建新的 Redis 数据库

2. **获取连接信息**
   - 复制 **REST URL** 和 **REST TOKEN**

3. **添加到 Vercel**
   - Settings > Environment Variables
   - 添加：
     - `UPSTASH_REDIS_REST_URL`
     - `UPSTASH_REDIS_REST_TOKEN`

4. **重新部署**

**预计时间：** 5-10 分钟

---

### 步骤 7: 更新代码使用缓存 API（可选）

**目的：** 将现有代码迁移到使用缓存 API，提升性能

**操作：**

1. **查找需要修改的文件**

```bash
# 查找使用旧 API 的文件
grep -r "school-profiles" src/ --exclude-dir=node_modules
```

2. **替换 API 调用**

**之前：**
```typescript
fetch('/api/wordpress/school-profiles')
```

**之后：**
```typescript
fetch('/api/wordpress/school-profiles-cached')
```

3. **测试修改后的功能**

**预计时间：** 10-20 分钟（取决于文件数量）

---

## 📋 完成检查清单

### 必需步骤

- [ ] ⏳ **等待部署完成**（2-3 分钟）
- [ ] ⏳ **测试 WordPress 同步 API**
- [ ] ⏳ **验证 Cron Job 配置**

### 推荐步骤

- [ ] ⏳ **测试缓存读取 API**
- [ ] ⏳ **验证数据库缓存**
- [ ] ⏳ **配置 Vercel KV / Redis**（提升性能）

### 可选步骤

- [ ] ⏳ **更新代码使用缓存 API**
- [ ] ⏳ **设置监控告警**（同步失败时通知）

---

## 🎯 快速完成指南（5 分钟）

如果您想快速验证系统是否工作：

1. **等待部署完成**（检查 Vercel Dashboard）
2. **测试同步 API**：
   ```powershell
   .\test-wordpress-sync.ps1 -AppUrl "https://school-application-assistant.vercel.app" -Secret "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
   ```
3. **验证 Cron Job**（Vercel Dashboard > Settings > Cron Jobs）

如果以上都成功，系统就已经可以工作了！

---

## 🔍 故障排除

### 问题 1: API 返回 404

**可能原因：**
- 部署还在进行中
- CDN 缓存未刷新

**解决：**
1. 等待部署完成
2. 等待 2-5 分钟让 CDN 缓存刷新
3. 使用时间戳参数测试：`?secret=XXX&t=1234567890`

### 问题 2: API 返回 401

**可能原因：**
- CRON_SECRET 不匹配
- 环境变量未生效

**解决：**
1. 检查 Vercel Dashboard > Settings > Environment Variables
2. 确认 `CRON_SECRET` 值正确
3. 重新部署应用

### 问题 3: API 返回 500

**可能原因：**
- WordPress API 连接失败
- 数据库连接失败
- 代码错误

**解决：**
1. 查看 Vercel Dashboard > Functions > Logs
2. 检查 WordPress URL 配置
3. 检查数据库连接

### 问题 4: Cron Job 未运行

**可能原因：**
- Cron 配置错误
- Vercel 计划限制

**解决：**
1. 检查 Vercel Dashboard > Settings > Cron Jobs
2. 确认配置正确
3. 注意：Hobby 账户每天只能运行一次

---

## 📚 相关文档

- 📖 [完整配置指南](docs/WORDPRESS_CACHE_SYNC.md)
- 🚀 [快速开始](docs/WORDPRESS_CACHE_QUICKSTART.md)
- 🔧 [故障排除](FIX_VERCEL_DEPLOYMENT.md)
- 📝 [测试指南](docs/TEST_WORDPRESS_SYNC.md)
- ✅ [部署成功报告](DEPLOYMENT_SUCCESS.md)

---

## ⏱️ 预计完成时间

- **最小验证**（必需步骤）：5-10 分钟
- **完整配置**（包括 KV）：15-20 分钟
- **完整迁移**（包括代码更新）：30-45 分钟

---

**最后更新：** 2025-11-23  
**当前状态：** 部署已启动，等待验证

