# 突然出现的数据库连接失败解决方案

## 问题描述

环境变量一直正常，之前还可以测试登录，突然就登录不了了。

## 可能的原因

### 1. Supabase 连接池耗尽（最可能）

**原因**：
- Supabase 免费版连接池限制：60 个并发连接
- Vercel 无服务器环境中，每个 API 调用可能创建新连接
- 如果连接没有正确关闭或重用，可能快速耗尽连接池

**症状**：
- 错误代码：P1001
- 无法连接到数据库服务器
- 之前可以，突然不行了

**解决方案**：
1. **等待几分钟**，让空闲连接自动关闭
2. **重启 Supabase 连接池**（如果可能）
3. **改进连接管理**（见下方）

### 2. Prisma Client 连接管理问题

**原因**：
- 在 Vercel 无服务器环境中，Prisma Client 可能没有正确重用
- 每个函数调用可能创建新连接
- 连接没有正确关闭

**解决方案**：
- 确保 Prisma Client 使用单例模式（已在代码中修复）
- 不要在每个请求中调用 `$connect()`（Prisma 会自动管理）
- 确保连接正确关闭

### 3. 网络临时问题

**原因**：
- Supabase 服务临时不可用
- 网络临时中断
- 防火墙规则临时变化

**解决方案**：
- 等待几分钟后重试
- 检查 Supabase 服务状态
- 添加连接重试机制（已在代码中修复）

### 4. Supabase 服务临时问题

**原因**：
- Supabase 服务维护
- 数据库临时不可用
- 服务中断

**解决方案**：
- 检查 [status.supabase.com](https://status.supabase.com)
- 等待服务恢复
- 联系 Supabase 支持

## 已实施的修复

### 修复 1：改进 Prisma Client 配置

更新了 `src/lib/prisma.ts`：
- 确保在 Vercel 生产环境中也重用 Prisma Client
- 添加初始化连接
- 防止连接池耗尽

### 修复 2：添加连接重试机制

更新了 `src/pages/api/auth/login.ts`：
- 添加 3 次重试机制
- 每次重试等待 500ms
- 仅在连接错误时重试

## 立即解决方案

### 方案 1：等待连接池恢复（最简单）

1. **等待 5-10 分钟**
   - Supabase 连接池会自动关闭空闲连接
   - 空闲连接通常在几分钟后关闭

2. **重新测试登录**
   - 如果恢复，说明是连接池耗尽问题

### 方案 2：重新部署应用

1. **提交代码更改**
   ```bash
   git add .
   git commit -m "Fix: Improve database connection management"
   git push
   ```

2. **Vercel 会自动部署**
   - 新的部署会应用修复的代码
   - 连接管理会更好

### 方案 3：检查 Supabase 连接状态

1. **登录 Supabase**
   - 进入项目
   - 查看 **Database** → **Connection Pooling**

2. **检查连接数**
   - 查看当前活跃连接数
   - 如果接近 60，说明连接池快满了

3. **重启连接池**（如果可能）
   - 某些 Supabase 计划支持重启连接池
   - 查看 Supabase 文档

## 预防措施

### 1. 优化连接使用

**不要**在每个请求中调用 `$connect()`：

```typescript
// ❌ 错误：每次都连接
await prisma.$connect();
const user = await prisma.user.findFirst(...);
await prisma.$disconnect();

// ✅ 正确：Prisma 自动管理连接
const user = await prisma.user.findFirst(...);
```

**已经在登录 API 中修复**，但确保其他 API 也遵循这个原则。

### 2. 使用连接池 URL

确保使用连接池 URL（端口 6543）：
```
postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 3. 添加连接监控

创建监控端点来检查连接状态：

```typescript
// src/pages/api/health/db.ts
import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    res.status(200).json({
      status: 'healthy',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 4. 考虑升级 Supabase 计划

如果连接池经常耗尽：
- Supabase Pro 计划：200 个连接
- Supabase Team 计划：400 个连接

## 验证修复

### 步骤 1：部署修复

1. **提交代码更改**
2. **等待 Vercel 自动部署**
3. **查看部署日志**，确认没有错误

### 步骤 2：测试登录

1. **访问登录页面**
2. **尝试登录**
3. **查看 Vercel 日志**，确认连接成功

### 步骤 3：监控连接

1. **定期检查 Supabase 连接数**
2. **如果连接数经常接近上限**，考虑优化或升级

## 如果问题仍然存在

### 检查清单

- [ ] 等待 10 分钟后重试
- [ ] 检查 Supabase 服务状态
- [ ] 检查 Supabase 连接池连接数
- [ ] 查看 Vercel 日志中的详细错误
- [ ] 检查是否其他 API 也受影响
- [ ] 确认修复代码已部署

### 需要帮助？

如果问题持续存在：

1. **查看 Vercel 日志**：获取详细的错误信息
2. **检查 Supabase 日志**：查看数据库端错误
3. **联系 Supabase 支持**：如果是服务问题
4. **考虑切换数据库服务**：如果问题持续

## 代码更改摘要

### 文件 1: `src/lib/prisma.ts`

**更改**：
- 确保在生产环境也重用 Prisma Client
- 添加初始化连接
- 防止连接池耗尽

### 文件 2: `src/pages/api/auth/login.ts`

**更改**：
- 添加连接重试机制（3 次重试）
- 改进错误处理
- 更好的错误日志

## 预期结果

修复后：
- ✅ 连接更稳定
- ✅ 自动重试机制处理临时故障
- ✅ 更好的连接池管理
- ✅ 减少连接池耗尽问题

