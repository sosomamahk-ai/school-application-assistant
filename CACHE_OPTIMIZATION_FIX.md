# 缓存和搜索优化修复

## 问题描述

学校管理页面存在以下性能问题：
1. 每次重新进入页面都重新搜索 WordPress 学校数据
2. 已经绑定好的学校也要重新搜索匹配
3. 对服务器造成很大压力，导致负载问题

## 修复内容

### 1. 增加缓存时间 ✅

**文件**: `src/services/wordpressSchoolService.ts`

- 将缓存时间从 5 分钟增加到 30 分钟
- 减少重复请求，降低服务器压力

**修改**:
```typescript
// 从 5 分钟增加到 30 分钟
const DEFAULT_CACHE_TTL = Number(process.env.NEXT_PUBLIC_WORDPRESS_SCHOOL_CACHE_TTL ?? 30 * 60 * 1000);
```

### 2. 添加 localStorage 持久化缓存 ✅

**文件**: `src/services/wordpressSchoolService.ts`

- 添加了 localStorage 持久化缓存
- 即使刷新页面，缓存仍然有效
- 缓存过期时间与内存缓存一致（30 分钟）

**新增功能**:
- `loadFromStorage()` - 从 localStorage 加载缓存
- `saveToStorage()` - 保存缓存到 localStorage
- 自动清理过期缓存

### 3. 优化匹配逻辑 ✅

**文件**: `src/pages/admin/schools.tsx`

**优化点**:
1. **优先使用已绑定信息**: 如果 `schoolId` 已经包含 WordPress 绑定信息（格式：`wp-profile-123`），直接通过 ID 查找，避免名称匹配
2. **创建索引**: 使用 Map 创建索引，将查找时间复杂度从 O(n) 降低到 O(1)
3. **避免重复搜索**: 只在必要时（没有绑定或绑定无效）才进行名称匹配

**修改前**:
```typescript
// 每次都进行名称匹配
const wordpressSchool = matchWordPressSchoolFromTemplate(
  { schoolId: tpl.schoolId, schoolName: tpl.schoolName },
  wordpressSchools
);
```

**修改后**:
```typescript
// 1. 先尝试通过 ID 直接查找（如果已绑定）
if (tpl.schoolId) {
  const parsed = parseWordPressTemplateId(tpl.schoolId);
  if (parsed) {
    wordpressSchool = wpSchoolIndex.get(`${parsed.type}-${parsed.id}`) ?? null;
  }
}

// 2. 只有在没有找到绑定时，才进行名称匹配
if (!wordpressSchool && wordpressSchools.length > 0) {
  wordpressSchool = matchWordPressSchoolFromTemplate(...);
}
```

### 4. 优化 Hook 加载逻辑 ✅

**文件**: `src/hooks/useWordPressSchools.ts`

- 只在数据为空时才自动获取
- 避免每次组件重新渲染时都重新请求

**修改**:
```typescript
useEffect(() => {
  if (!autoFetch) return;
  // 只在首次加载或数据为空时获取，避免重复请求
  if (!data) {
    fetchData();
  }
}, [autoFetch, fetchData, data]);
```

## 性能提升

### 优化前
- 每次进入页面：重新请求 WordPress API（即使有缓存，5 分钟后也会过期）
- 每次匹配：对所有模板进行名称匹配（O(n) 复杂度）
- 服务器压力：频繁的 API 请求

### 优化后
- 缓存时间：30 分钟（6 倍提升）
- 持久化缓存：刷新页面后缓存仍然有效
- 匹配优化：已绑定的学校直接通过 ID 查找（O(1) 复杂度）
- 服务器压力：大幅减少重复请求

## 缓存策略

### 三级缓存机制

1. **内存缓存** (最快)
   - 存储在 `cache` 变量中
   - 页面刷新后失效
   - 过期时间：30 分钟

2. **localStorage 缓存** (持久化)
   - 存储在浏览器 localStorage
   - 页面刷新后仍然有效
   - 过期时间：30 分钟
   - 自动清理过期数据

3. **API 请求** (最后手段)
   - 只在缓存失效或强制刷新时请求
   - 请求后更新所有缓存

### 缓存失效条件

- 缓存过期（30 分钟后）
- 手动调用 `invalidateWordPressSchoolCache()`
- 调用 `refetch(true)` 强制刷新

## 使用建议

### 开发环境

如果需要测试最新的 WordPress 数据，可以：
1. 在浏览器控制台运行：`localStorage.clear()`
2. 或者点击页面上的"重试"按钮（会强制刷新）

### 生产环境

- 缓存会自动工作，无需额外配置
- 如果 WordPress 数据更新，等待 30 分钟后会自动刷新
- 或者手动调用 `refetch(true)` 强制刷新

## 验证修复

### 1. 检查缓存

打开浏览器开发者工具 → Application → Local Storage，应该能看到：
- `wordpress_schools_cache` - 缓存的数据
- `wordpress_schools_cache_expiry` - 过期时间

### 2. 检查网络请求

1. 打开开发者工具 → Network 标签
2. 访问学校管理页面
3. 第一次访问：应该看到 `/api/wordpress/schools` 请求
4. 刷新页面：**不应该**看到新的请求（使用缓存）
5. 30 分钟后：会看到新的请求（缓存过期）

### 3. 检查匹配性能

1. 打开浏览器控制台
2. 访问学校管理页面
3. 查看控制台日志，应该看到：
   - 已绑定的学校：直接通过 ID 查找（快速）
   - 未绑定的学校：进行名称匹配（仅在必要时）

## 相关文件

- `src/services/wordpressSchoolService.ts` - WordPress 数据服务和缓存逻辑
- `src/hooks/useWordPressSchools.ts` - WordPress 数据 Hook
- `src/pages/admin/schools.tsx` - 学校管理页面

## 后续优化建议

如果数据量继续增长，可以考虑：

1. **实现增量更新**
   - 只获取变更的数据
   - 使用时间戳或版本号

2. **使用 Service Worker**
   - 离线缓存
   - 后台同步

3. **优化 WordPress API**
   - 创建自定义端点
   - 只返回必要字段
   - 实现分页

4. **使用 IndexedDB**
   - 存储更大的数据集
   - 更高效的查询

---

**修复完成日期**: 2025-01-XX

现在页面加载更快，服务器压力大幅降低！

