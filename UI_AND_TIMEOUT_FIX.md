# UI 和超时问题修复

## 修复内容

### 1. 表格高度限制修复 ✅

**问题**: 表格被 `height: 85vh; min-height: 600px;` 限制了高度，无法显示更多行。

**修复**: 
- 文件: `src/components/admin/schools/SchoolGrid.tsx`
- 移除了 `height: '85vh'` 限制
- 设置 `minHeight` 为至少 10 行的高度（960px）
- 现在表格会根据内容自动扩展，最少显示 10 行才出现滚动条

**修改前**:
```tsx
<div style={{ height: '85vh', minHeight: '600px' }}>
```

**修改后**:
```tsx
const minHeight = Math.max(10 * 96, 600); // 至少 960px 或 600px
<div style={{ minHeight: `${minHeight}px` }}>
```

### 2. WordPress 学校数据加载超时修复 ✅

**问题**: WordPress 学校数据加载时出现"请求超时。数据量较大，请稍后重试。"错误。

**修复**:
- 文件: `src/services/wordpressSchoolService.ts`
- 文件: `src/pages/api/wordpress/schools.ts`
- 将前端请求超时从 120 秒增加到 180 秒（3 分钟）
- 将 API 路由超时从 120 秒增加到 180 秒（3 分钟）
- 改进了错误提示信息

**修改内容**:

1. **前端超时** (`src/services/wordpressSchoolService.ts`):
   ```typescript
   // 从 120000 (120秒) 增加到 180000 (180秒)
   const timeoutId = setTimeout(() => controller.abort(), 180000);
   ```

2. **API 路由超时** (`src/pages/api/wordpress/schools.ts`):
   ```typescript
   // 从 120000 (2分钟) 增加到 180000 (3分钟)
   req.setTimeout(180000);
   ```

3. **错误提示改进**:
   ```typescript
   throw new Error('请求超时。数据量较大，请稍后重试。如果问题持续，请联系管理员。');
   ```

## ⚠️ 重要提示

### Vercel 超时限制

**注意**: Vercel 的 API 路由有超时限制：
- **免费计划**: 10 秒
- **Pro 计划**: 60 秒
- **Enterprise**: 可配置更长时间

如果您的 Vercel 计划是免费或 Pro，180 秒的超时设置可能会被 Vercel 平台限制截断。

### 解决方案

如果仍然遇到超时问题，可以考虑：

1. **升级到 Vercel Pro 或 Enterprise**
   - Pro 计划支持 60 秒超时
   - Enterprise 可以配置更长时间

2. **实现分页加载**
   - 将大量数据分批加载
   - 使用虚拟滚动或分页

3. **优化 WordPress API 查询**
   - 减少每次请求的数据量
   - 使用 WordPress 自定义端点优化查询
   - 添加缓存机制

4. **使用后台任务**
   - 将数据加载改为后台任务
   - 使用 WebSocket 或 Server-Sent Events 推送进度

5. **增加缓存时间**
   - 文件: `src/services/wordpressSchoolService.ts`
   - 当前缓存时间: 5 分钟 (`DEFAULT_CACHE_TTL`)
   - 可以增加到更长时间，减少重复请求

## 验证修复

### 1. 测试表格高度

1. 启动开发服务器: `npm run dev`
2. 访问: http://localhost:3000/admin/schools
3. 检查表格是否：
   - 至少显示 10 行
   - 超过 10 行后出现滚动条
   - 没有 85vh 的高度限制

### 2. 测试 WordPress 数据加载

1. 在浏览器中打开开发者工具（F12）
2. 访问学校管理页面
3. 查看 Network 标签中的 `/api/wordpress/schools` 请求
4. 检查：
   - 请求是否成功完成
   - 如果超时，是否在 180 秒后超时
   - 错误信息是否清晰

### 3. 检查控制台日志

查看浏览器控制台和服务器日志，确认：
- 没有超时错误
- 数据加载成功
- 缓存正常工作

## 后续优化建议

如果数据量持续增长，建议实施以下优化：

### 1. 实现增量加载

```typescript
// 示例：分批加载数据
const loadSchoolsInBatches = async (batchSize = 50) => {
  let allSchools = [];
  let page = 1;
  
  while (true) {
    const batch = await fetchSchoolsBatch(page, batchSize);
    if (batch.length === 0) break;
    allSchools = [...allSchools, ...batch];
    page++;
  }
  
  return allSchools;
};
```

### 2. 使用 React Query 或 SWR

这些库提供了更好的缓存和重试机制：

```typescript
import useSWR from 'swr';

const { data, error } = useSWR('/api/wordpress/schools', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 300000, // 5 分钟
});
```

### 3. 优化 WordPress API

在 WordPress 端创建优化的自定义端点：

```php
// WordPress 自定义端点，只返回必要字段
add_action('rest_api_init', function () {
    register_rest_route('schools/v1', '/list-optimized', [
        'methods' => 'GET',
        'callback' => function() {
            // 只返回 ID、标题、类型等必要字段
            // 不包含完整的 ACF 数据
        }
    ]);
});
```

## 相关文件

- `src/components/admin/schools/SchoolGrid.tsx` - 表格组件
- `src/services/wordpressSchoolService.ts` - WordPress 数据服务
- `src/pages/api/wordpress/schools.ts` - WordPress API 代理
- `src/hooks/useWordPressSchools.ts` - WordPress 数据 Hook

---

**修复完成日期**: 2025-01-XX

如果问题仍然存在，请检查：
1. Vercel 部署日志
2. 浏览器控制台错误
3. 网络请求详情

