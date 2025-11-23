# Profile Type 分类错误修复总结

## 问题描述

WordPress 获取 profiles 时，大量本地中学/本地小学 profile 无法取得 raw post 数据（raw post map 缺失），导致被错误归类为"国际学校"。

### 问题表现

```
[school-profiles] Profile 13378 (香港潮阳小学) not found in raw data map.
[school-profiles] CRITICAL: Cannot determine profile_type for profile 13378 (香港潮阳小学). No raw post data available.
[school-profiles] Profile 13378 (香港潮阳小学): {
  hasRawPost: false,
  profileTypeSlug: null,
  category: '香港国际学校',
  finalCategory: '国际学校'  // ❌ 错误分类
}
```

## 修复方案

### 1. ✅ 分页完整抓取所有 school_profile

**修复前：**
- 只抓取 10 页（最多 1000 个 profiles）
- 使用错误的 endpoint：`/wp-json/wp/v2/profile`

**修复后：**
- 使用正确的 endpoint：`/wp-json/wp/v2/school_profile`
- 使用 `X-WP-TotalPages` header 获取总页数
- 循环抓取所有页面，直到抓完所有数据
- 构建完整的 `rawPostsMap: Map<id, post>`

**代码位置：** `src/pages/api/wordpress/school-profiles.ts` (第 132-164 行)

### 2. ✅ 完整的回退机制（Fallback Logic）

对在 `rawPostsMap` 中仍然缺失的 `profileId` 执行以下回退流程：

#### (1) 逐个请求 GET by ID
```
GET /wp-json/wp/v2/school_profile/<id>?_embed
```
- 如果成功，加入 map（`found_by: "id"`）

#### (2) 尝试 slug 查询
```
GET /wp-json/wp/v2/school_profile?slug=<slug>&_embed
```
- 从 title 构造 slug（如果可用）
- 如果找到，加入 map（`found_by: "slug"`）

#### (3) 尝试 search 查询
```
GET /wp-json/wp/v2/school_profile?search=<title>&per_page=5&_embed
```
- 优先精确匹配（rendered title）
- 其次模糊匹配（fallback）
- 如果找到，加入 map（`found_by: "search"`）

#### (4) 若仍无法找到 → 标记为 `unresolved_raw`
- 不再强制归类为"国际学校"
- 输出详细日志，包含：
  - `attempted: [id, slug, search]`
  - `statuses`
  - `title`
  - `expected profile_type`

**代码位置：** `src/pages/api/wordpress/school-profiles.ts` (第 200-350 行)

### 3. ✅ 正确提取 profile_type

从 `_embedded['wp:term']` 中寻找：
- `taxonomy === "profile_type"`
- 返回其 `slug`（如：`hk-ls-primary-template`）

**优先级：**
1. `_embedded['wp:term']` → `profile_type` → `slug`
2. 直接 `profile_type` 字段
3. ACF 字段 `acf.profile_type`

**代码位置：** `src/pages/api/wordpress/school-profiles.ts` (第 11-86 行)

### 4. ✅ 删除错误逻辑

**修复前：**
```typescript
// ❌ 错误：默认归类为"国际学校"
const profileType = profileWithTemplate.profileType || '国际学校';
if (groupedProfiles[profileType]) {
  groupedProfiles[profileType].push(profileWithTemplate);
} else {
  groupedProfiles['国际学校'].push(profileWithTemplate); // ❌ 强制归类
}
```

**修复后：**
```typescript
// ✅ 正确：返回 unresolved_raw
function mapSlugToCategory(slug: string | null): string {
  if (!slug) return 'unresolved_raw'; // ✅ 不再默认归类
  // ...
}

// ✅ 正确：处理 unresolved_raw
if (groupedProfiles[profileType]) {
  groupedProfiles[profileType].push(profileWithTemplate);
} else {
  groupedProfiles['unresolved_raw'].push(profileWithTemplate); // ✅ 标记为未解决
}
```

**代码位置：** `src/pages/api/wordpress/school-profiles.ts` (第 88-102 行, 第 390-398 行)

### 5. ✅ 详细 Debug 日志

所有日志包含以下信息：
- `found_by: "id" | "slug" | "search" | "none" | "paginated"`
- `http status`
- `taxonomy 可见性`（`visible`, `hasEmbedded`, `hasTerms`）
- `attempted` 方法列表
- `statuses` HTTP 状态码列表

**示例日志：**
```typescript
console.log(`[school-profiles] ✅ Found profile ${profile.id} (${profile.title}) via ${result.foundBy}`, {
  profileId: profile.id,
  title: profile.title,
  foundBy: result.foundBy,
  attempted: result.attempted,
  statuses: result.statuses
});
```

**代码位置：** `src/pages/api/wordpress/school-profiles.ts` (多处)

### 6. ✅ UI 更新处理 unresolved_raw

**新增功能：**
1. 在 Tab 标签页中添加"未分类 (需检查)"标签
2. 显示警告图标和黄色高亮
3. 显示详细的 WordPress 检查项提示
4. 在统计中显示未分类数量

**代码位置：** `src/pages/admin/templates-v2.tsx`

**UI 提示内容：**
- 确保 `profile_type` taxonomy 的 `show_in_rest` 设置为 `true`
- 确保 post type `school_profile` 的 `show_in_rest` 设置为 `true`
- 检查 post 的 `post_status` 是否为 `publish`
- 确认 REST API 权限允许访问这些数据

## 分类规则

### 最终分类来源顺序：

1. ✅ `raw post` → `_embedded` → `profile_type` → `slug`
2. ✅ `fallback` 找到的 raw post（id/slug/search）
3. ✅ 若全部失败 → `"unresolved_raw"`

### 严禁：

- ❌ 使用未知字段推测分类
- ❌ 使用 `category` 字段当成 `profile_type`
- ❌ 使用默认 fallback "国际学校"

## WordPress 端检查项

### 1. Post Type 设置
```php
register_post_type('school_profile', [
    'show_in_rest' => true,  // ✅ 必须为 true
    'rest_base' => 'school_profile',
    // ...
]);
```

### 2. Taxonomy 设置
```php
register_taxonomy('profile_type', ['school_profile'], [
    'show_in_rest' => true,  // ✅ 必须为 true
    'rest_base' => 'profile_type',
    // ...
]);
```

### 3. Post Status
- 确保需要获取的 posts 的 `post_status` 为 `publish`
- 检查 REST API 权限设置

### 4. REST API 权限
- 确保 REST API 可以访问 `school_profile` post type
- 确保 REST API 可以访问 `profile_type` taxonomy

## 测试建议

1. **测试分页抓取：**
   - 确认所有页面都被抓取
   - 检查 `X-WP-TotalPages` 是否正确

2. **测试回退机制：**
   - 手动删除某些 profile 的 raw post
   - 确认回退机制能够找到这些 profile

3. **测试分类：**
   - 确认本地中学/本地小学不再被错误归类为国际学校
   - 确认无法分类的 profile 显示为 `unresolved_raw`

4. **测试 UI：**
   - 确认 `unresolved_raw` tab 正确显示
   - 确认警告信息正确显示

## 相关文件

- `src/pages/api/wordpress/school-profiles.ts` - 主要修复文件
- `src/pages/admin/templates-v2.tsx` - UI 更新文件

## 后续优化建议

1. 考虑添加缓存机制，避免每次都重新抓取所有数据
2. 考虑添加批量回退请求，提高效率
3. 考虑添加监控和告警，当 `unresolved_raw` 数量过多时通知管理员

