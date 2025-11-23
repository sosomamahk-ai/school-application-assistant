# WordPress Profile 数据缓存优化方案

## 问题分析

当前模板列表页面每次加载都需要从 WordPress API 获取所有 profile 数据，导致：
1. 加载时间长（需要多次 API 请求）
2. 分类不准确（无法正确获取 taxonomy slug）
3. 依赖 WordPress API 可用性

## 解决方案：数据库缓存

### 方案 1：添加 Prisma Model（推荐）

在 `prisma/schema.prisma` 中添加：

```prisma
model WordPressProfileCache {
  id              String   @id @default(cuid())
  wpProfileId     Int      @unique
  title           String
  profileTypeSlug String?
  category        String?
  nameShort       String?
  rawData         Json?
  lastSyncedAt    DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([wpProfileId])
  @@index([profileTypeSlug])
}
```

### 方案 2：使用现有 School 表扩展

可以在 `School` 表中添加 WordPress profile 相关字段，但需要确保数据一致性。

## 实施步骤

### 步骤 1：更新 Prisma Schema

1. 在 `prisma/schema.prisma` 中添加 `WordPressProfileCache` model
2. 运行 `npx prisma migrate dev --name add_wordpress_profile_cache`
3. 运行 `npx prisma generate`

### 步骤 2：创建同步 API

创建 `src/pages/api/admin/wordpress/sync-profiles.ts` 用于同步 WordPress 数据到数据库。

### 步骤 3：修改 school-profiles API

修改 `src/pages/api/wordpress/school-profiles.ts` 优先从数据库读取，如果数据过期则从 WordPress 同步。

## 当前优化（无需数据库）

如果暂时不想修改数据库，可以：

1. **使用内存缓存** - 已在代码中实现
2. **优化 API 调用** - 批量获取，减少请求次数
3. **添加详细日志** - 帮助诊断问题

## 诊断当前问题

如果仍然出现 "no raw post data available"，请检查：

1. **ID 匹配问题**：
   - `getWordPressSchools` 返回的 profile.id 是否与 WordPress API 返回的 post.id 一致？
   - 检查日志中的 `sampleIds` 和 `profileId` 是否匹配

2. **WordPress API 响应**：
   - 检查 WordPress API 是否返回了 `_embedded['wp:term']` 数据
   - 检查 taxonomy 名称是否为 `profile_type`

3. **数据格式问题**：
   - WordPress REST API 可能返回不同的数据结构
   - 需要根据实际响应调整提取逻辑

## 快速修复建议

如果问题持续，可以：

1. **直接使用 WordPress API**：不通过 `getWordPressSchools`，直接从 WordPress API 获取
2. **使用 WordPress 自定义端点**：如果 WordPress 有自定义 API 端点，使用它
3. **添加重试机制**：如果某个 profile 找不到，单独获取

