# WordPress 数据定时同步（Headless CMS Cache）

## 概述

本系统实现了 WordPress 数据的定时同步和缓存机制，支持多个存储后端，以减少 WordPress API 负担并提高 Vercel 的读取效率。

## 支持的存储后端

1. **Vercel KV / Redis** - 快速的内存缓存
2. **Vercel Postgres** - 持久化数据库缓存
3. **Supabase / PlanetScale** - 基于 Postgres 的云数据库
4. **JSON 文件缓存** - 本地文件系统缓存（开发/备用）

## 架构设计

```
WordPress API
    ↓ (定时同步)
[同步服务] → Vercel KV/Redis
          → Postgres/Supabase
          → JSON 文件
    ↓ (读取请求)
[缓存读取] → 优先从缓存读取
          → 缓存失效时回退到 WordPress API
```

## 配置步骤

### 1. 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

#### 必需变量

```bash
# WordPress 配置
WORDPRESS_BASE_URL=https://your-wordpress-site.com
NEXT_PUBLIC_WORDPRESS_BASE_URL=https://your-wordpress-site.com

# Cron 安全密钥（用于手动触发和验证）
CRON_SECRET=your-random-secret-key

# 缓存 TTL（毫秒），默认 1 小时
WORDPRESS_CACHE_TTL=3600000
```

#### Vercel KV / Redis 配置（可选）

如果使用 Vercel KV 或 Upstash Redis：

```bash
# Upstash Redis REST API
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# 或 Vercel KV
KV_URL=https://your-kv-instance.vercel.app
KV_REST_API_TOKEN=your-token

# 或标准 Redis
REDIS_URL=redis://your-redis-instance:6379
```

#### Supabase 配置（可选）

如果使用 Supabase：

```bash
SUPABASE_URL=https://your-project.supabase.co
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### 2. 数据库迁移

运行 Prisma 迁移以创建缓存表：

```bash
# 生成迁移
npx prisma migrate dev --name add_wordpress_profile_cache

# 或直接执行 SQL（生产环境）
npx prisma migrate deploy
```

迁移会创建 `WordPressProfileCache` 表用于存储缓存数据。

### 3. Vercel Cron 配置

`vercel.json` 已配置定时同步任务：

```json
{
  "crons": [
    {
      "path": "/api/cron/wordpress-sync",
      "schedule": "0 */6 * * *"  // 每 6 小时执行一次
    }
  ]
}
```

**Cron 计划表达式说明：**
- `0 */6 * * *` - 每 6 小时执行一次（例如：00:00, 06:00, 12:00, 18:00）
- `0 */1 * * *` - 每小时执行一次
- `0 0 * * *` - 每天午夜执行一次
- `*/30 * * * *` - 每 30 分钟执行一次

### 4. 配置存储后端

在 `src/services/wordpressCache.ts` 中，系统会自动检测可用的存储后端：

- **KV/Redis**: 检测 `KV_URL` 或 `REDIS_URL` 环境变量
- **Postgres**: 使用现有的 `DATABASE_URL`
- **Supabase**: 检测 `SUPABASE_URL` 和 `DATABASE_URL` 中的 `supabase`
- **JSON**: 默认启用（保存到 `.cache/wordpress-profiles.json`）

## 使用方法

### 手动触发同步

```bash
# 使用 secret 手动触发
curl https://your-app.vercel.app/api/cron/wordpress-sync?secret=YOUR_CRON_SECRET

# 或使用 Authorization header
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/wordpress-sync
```

### API 端点

#### 1. 定时同步端点

**GET** `/api/cron/wordpress-sync`

- 从 WordPress 获取最新数据
- 保存到所有配置的缓存后端
- 需要认证（Vercel Cron 自动认证或手动提供 secret）

**响应示例：**

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
    "savedTo": ["kv", "postgres", "json"],
    "errors": [],
    "backendsCount": 3
  },
  "duration": "2345ms",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. 带缓存的读取端点

**GET** `/api/wordpress/school-profiles-cached`

- 优先从缓存读取
- 缓存失效时回退到 WordPress API
- 支持查询参数：
  - `refresh=true` - 强制刷新，忽略缓存
  - `cache=false` - 禁用缓存

**查询示例：**

```bash
# 使用缓存（默认）
GET /api/wordpress/school-profiles-cached

# 强制刷新
GET /api/wordpress/school-profiles-cached?refresh=true

# 禁用缓存
GET /api/wordpress/school-profiles-cached?cache=false
```

### 代码使用示例

```typescript
import { getCache, saveCache } from '@/services/wordpressCache';

// 读取缓存
const cacheResult = await getCache();
if (cacheResult?.success && cacheResult.data) {
  console.log('Cache hit:', cacheResult.backend);
  console.log('Data:', cacheResult.data);
}

// 保存缓存
const wordPressData = await getWordPressSchools({ forceRefresh: true });
const saveResult = await saveCache(wordPressData);
console.log('Saved to:', saveResult.savedTo);
```

## 性能优化

### 缓存策略

1. **读取优先顺序**：KV > Postgres > Supabase > JSON
2. **缓存 TTL**：默认 1 小时，可通过环境变量配置
3. **自动失效**：缓存过期后自动从 WordPress 重新获取

### 建议配置

- **高频读取场景**：启用 KV/Redis（最快）
- **数据持久化**：启用 Postgres/Supabase
- **开发环境**：使用 JSON 文件缓存（简单）
- **生产环境**：同时启用 KV + Postgres（性能和可靠性兼顾）

## 监控和日志

### 同步日志

查看 Vercel 日志：

```bash
# 使用 Vercel CLI
vercel logs --follow

# 或查看 Dashboard
# Vercel Dashboard > Project > Functions > /api/cron/wordpress-sync
```

### 健康检查

检查缓存状态：

```typescript
import { getCache } from '@/services/wordpressCache';

const result = await getCache();
console.log('Cache status:', {
  available: result?.success,
  backend: result?.backend,
  age: result?.age ? `${Math.round(result.age / 1000)}s` : 'N/A'
});
```

## 故障排除

### 问题 1：缓存未生效

**检查项：**
- 确认环境变量已配置
- 检查 Cron Job 是否正常运行
- 查看同步日志是否有错误

**解决：**
```bash
# 手动触发同步
curl https://your-app.vercel.app/api/cron/wordpress-sync?secret=YOUR_SECRET
```

### 问题 2：KV/Redis 连接失败

**检查项：**
- 确认 `KV_URL` 和 `KV_REST_API_TOKEN` 配置正确
- 验证 Redis 实例可访问

**解决：**
- 检查 Upstash Dashboard 中的连接信息
- 验证网络连接和防火墙设置

### 问题 3：Postgres 表不存在

**解决：**
```bash
# 运行迁移
npx prisma migrate deploy

# 或直接执行 SQL
psql $DATABASE_URL < prisma/migrations/add_wordpress_profile_cache.sql
```

### 问题 4：JSON 文件缓存失败

**检查项：**
- 确认文件系统可写（Vercel 不支持本地文件写入）
- JSON 缓存仅在开发环境或支持文件系统的环境可用

**解决：**
- 生产环境使用 KV 或 Postgres
- 开发环境确认 `.cache` 目录可写

## 最佳实践

1. **定时同步频率**：
   - 高流量场景：每小时或每 30 分钟
   - 低流量场景：每 6 小时或每天
   - 根据 WordPress 数据更新频率调整

2. **缓存 TTL**：
   - 快速变化数据：30 分钟
   - 稳定数据：1-6 小时
   - 静态数据：24 小时

3. **多后端配置**：
   - 生产环境至少启用 KV + Postgres
   - 提供冗余和容错能力

4. **监控告警**：
   - 设置同步失败的告警
   - 监控缓存命中率
   - 跟踪 WordPress API 调用次数

## 相关文件

- `src/services/wordpressCache.ts` - 缓存服务实现
- `src/pages/api/cron/wordpress-sync.ts` - 定时同步 API
- `src/pages/api/wordpress/school-profiles-cached.ts` - 带缓存的读取 API
- `prisma/migrations/add_wordpress_profile_cache.sql` - 数据库迁移

## 更新日志

- **v1.0.0** (2024-01-15)
  - 初始实现
  - 支持 Vercel KV、Postgres、Supabase、JSON 缓存
  - Vercel Cron 定时同步

