# WordPress 数据定时同步（Headless CMS Cache）

## 概述

本系统实现了 WordPress 数据的定时同步和缓存机制，支持多个存储后端，以减少 WordPress API 负担并提高 Vercel 的读取效率。

## 功能特性

- ✅ **多后端支持**：Vercel KV/Redis、Postgres、Supabase、JSON 文件缓存
- ✅ **定时同步**：使用 Vercel Cron Jobs 自动同步
- ✅ **智能缓存**：优先读取缓存，自动回退到 WordPress API
- ✅ **高性能**：减少 WordPress API 调用，提高响应速度
- ✅ **容错机制**：多后端冗余，确保可用性

## 快速开始

### 1. 运行数据库迁移

```bash
npx prisma migrate dev --name add_wordpress_profile_cache
```

### 2. 配置环境变量

```bash
# 必需
CRON_SECRET=your-random-secret

# 可选：Vercel KV/Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 3. 使用缓存 API

```typescript
// 替换现有调用
fetch('/api/wordpress/school-profiles-cached')
```

## 文档

- 📖 [完整配置指南](docs/WORDPRESS_CACHE_SYNC.md)
- 🚀 [快速开始](docs/WORDPRESS_CACHE_QUICKSTART.md)
- 📝 [API 文档](src/pages/api/cron/wordpress-sync.ts)

## 架构

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

## 支持的存储后端

| 后端 | 状态 | 配置 |
|------|------|------|
| Vercel KV / Redis | ⚠️ 可选 | 配置 `UPSTASH_REDIS_REST_URL` |
| Postgres / Supabase | ✅ 自动 | 使用现有 `DATABASE_URL` |
| JSON 文件 | ✅ 自动 | 开发环境，无需配置 |

## 使用示例

### 手动触发同步

```bash
curl https://your-app.vercel.app/api/cron/wordpress-sync?secret=YOUR_SECRET
```

### 读取缓存

```typescript
import { getCache } from '@/services/wordpressCache';

const result = await getCache();
if (result?.success) {
  console.log('Cache hit:', result.backend);
  console.log('Data:', result.data);
}
```

### 保存缓存

```typescript
import { saveCache } from '@/services/wordpressCache';
import { getWordPressSchools } from '@/services/wordpressSchoolService';

const data = await getWordPressSchools({ forceRefresh: true });
const result = await saveCache(data);
console.log('Saved to:', result.savedTo);
```

## 配置

### Vercel Cron

`vercel.json` 已配置每 6 小时同步一次：

```json
{
  "crons": [{
    "path": "/api/cron/wordpress-sync",
    "schedule": "0 */6 * * *"
  }]
}
```

### 环境变量

| 变量 | 必需 | 说明 |
|------|------|------|
| `CRON_SECRET` | ✅ | Cron 安全密钥 |
| `WORDPRESS_CACHE_TTL` | ❌ | 缓存 TTL（毫秒），默认 3600000 |
| `UPSTASH_REDIS_REST_URL` | ❌ | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | Upstash Redis Token |
| `SUPABASE_URL` | ❌ | Supabase URL（自动检测） |

## 性能优化

- **缓存优先级**：KV > Postgres > Supabase > JSON
- **缓存 TTL**：默认 1 小时，可配置
- **同步频率**：默认 6 小时，可调整

## 监控

查看同步状态：

```bash
# Vercel CLI
vercel logs --follow

# 或访问 Dashboard
# Functions > /api/cron/wordpress-sync > Logs
```

## 故障排除

查看 [快速配置指南](docs/WORDPRESS_CACHE_QUICKSTART.md) 中的故障排除部分。

## 相关文件

- `src/services/wordpressCache.ts` - 缓存服务
- `src/pages/api/cron/wordpress-sync.ts` - 定时同步 API
- `src/pages/api/wordpress/school-profiles-cached.ts` - 缓存读取 API
- `prisma/schema.prisma` - 数据库 Schema
- `prisma/migrations/add_wordpress_profile_cache.sql` - 迁移 SQL

