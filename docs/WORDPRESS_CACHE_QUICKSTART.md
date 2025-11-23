# WordPress 缓存同步快速配置指南

## 5 分钟快速设置

### 1. 运行数据库迁移

```bash
# 生成迁移
npx prisma migrate dev --name add_wordpress_profile_cache

# 或直接执行 SQL（生产环境）
psql $DATABASE_URL < prisma/migrations/add_wordpress_profile_cache.sql
```

### 2. 配置环境变量

在 Vercel 项目设置中添加：

#### 必需变量

```bash
# Cron 安全密钥（生成随机字符串）
CRON_SECRET=your-random-secret-key-here

# 缓存 TTL（毫秒），默认 1 小时
WORDPRESS_CACHE_TTL=3600000
```

#### 可选：Vercel KV / Redis（推荐）

在 Vercel 项目中：
1. 前往 **Storage** > **Create Database**
2. 选择 **KV**（或使用 Upstash Redis）
3. 系统会自动添加 `KV_URL` 和 `KV_REST_API_TOKEN`

或手动添加：

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

#### 可选：Postgres（已配置）

如果使用 Vercel Postgres 或 Supabase，`DATABASE_URL` 已存在，无需额外配置。

### 3. 验证配置

```bash
# 手动触发同步（替换 YOUR_SECRET）
curl https://your-app.vercel.app/api/cron/wordpress-sync?secret=YOUR_SECRET

# 应该返回成功响应
```

### 4. 查看同步状态

```bash
# 查看 Vercel 日志
vercel logs --follow

# 或访问 Vercel Dashboard
# Functions > /api/cron/wordpress-sync > Logs
```

## 使用缓存读取

### 替换现有 API 调用

**之前：**
```typescript
// 直接调用 WordPress API
fetch('/api/wordpress/school-profiles')
```

**之后：**
```typescript
// 使用缓存 API（自动优先读取缓存）
fetch('/api/wordpress/school-profiles-cached')
```

### API 参数

```bash
# 使用缓存（默认）
GET /api/wordpress/school-profiles-cached

# 强制刷新（忽略缓存）
GET /api/wordpress/school-profiles-cached?refresh=true

# 禁用缓存（直接调用 WordPress API）
GET /api/wordpress/school-profiles-cached?cache=false
```

## 定时同步配置

`vercel.json` 已配置每 6 小时同步一次：

```json
{
  "crons": [{
    "path": "/api/cron/wordpress-sync",
    "schedule": "0 */6 * * *"
  }]
}
```

### 修改同步频率

编辑 `vercel.json`：

```json
{
  "crons": [{
    "path": "/api/cron/wordpress-sync",
    "schedule": "0 */1 * * *"  // 每小时
    // "0 */6 * * *"  // 每 6 小时（默认）
    // "0 0 * * *"    // 每天午夜
  }]
}
```

## 支持的存储后端

系统会自动检测并使用可用的后端：

1. ✅ **Postgres** - 使用现有 `DATABASE_URL`（自动启用）
2. ✅ **JSON 文件** - 本地缓存（开发环境，自动启用）
3. ⚠️ **KV/Redis** - 需要配置环境变量（推荐）
4. ⚠️ **Supabase** - 检测 `SUPABASE_URL`（自动启用）

**优先级顺序：** KV > Postgres > Supabase > JSON

## 监控和调试

### 检查缓存状态

```typescript
import { getCache } from '@/services/wordpressCache';

const result = await getCache();
console.log('Cache:', {
  available: result?.success,
  backend: result?.backend,
  age: result?.age ? `${Math.round(result.age / 1000)}s` : 'N/A',
  profiles: result?.data?.profiles?.length || 0
});
```

### 清除缓存

```typescript
import { clearCache } from '@/services/wordpressCache';

const result = await clearCache();
console.log('Cleared:', result.cleared);
console.log('Errors:', result.errors);
```

## 故障排除

### 问题：同步失败

**检查：**
- `CRON_SECRET` 是否正确配置
- WordPress API 是否可访问
- 查看 Vercel 日志中的错误信息

**解决：**
```bash
# 手动触发同步
curl https://your-app.vercel.app/api/cron/wordpress-sync?secret=YOUR_SECRET
```

### 问题：缓存未生效

**检查：**
- 确认迁移已运行
- 检查环境变量是否配置
- 查看同步日志是否成功

**解决：**
```bash
# 手动触发同步一次
curl https://your-app.vercel.app/api/cron/wordpress-sync?secret=YOUR_SECRET

# 然后测试缓存 API
curl https://your-app.vercel.app/api/wordpress/school-profiles-cached
```

### 问题：KV/Redis 连接失败

**检查：**
- `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN` 是否正确
- Upstash Dashboard 中的连接信息

**解决：**
- 如果没有配置 KV，系统会自动使用 Postgres 缓存
- 检查环境变量配置

## 性能优化建议

1. **生产环境**：启用 KV + Postgres（双重缓存）
2. **缓存 TTL**：根据数据更新频率调整（默认 1 小时）
3. **同步频率**：根据 WordPress 数据更新频率调整（默认 6 小时）
4. **监控**：设置同步失败的告警

## 下一步

- 阅读完整文档：`docs/WORDPRESS_CACHE_SYNC.md`
- 查看 API 文档：`src/pages/api/cron/wordpress-sync.ts`
- 查看缓存服务：`src/services/wordpressCache.ts`

