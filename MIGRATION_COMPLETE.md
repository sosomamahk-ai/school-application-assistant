# ✅ 迁移修复完成

## 已完成的步骤

1. ✅ **关闭所有Node进程** - 解决了EPERM文件锁定错误
2. ✅ **清除Prisma缓存** - 删除了 `node_modules/.prisma` 目录
3. ✅ **应用数据库迁移** - 成功应用了以下迁移：
   - `20250101000000_add_wp_id_and_optional_template`
   - `20251124132151_add_wp_id_and_optional_template`
4. ✅ **生成Prisma客户端** - Prisma Client已成功生成

## 数据库变更

迁移已成功应用到数据库，包括：

- ✅ `templateId` 字段已改为可选（移除了NOT NULL约束）
- ✅ `wpId` 字段已添加（INTEGER, 可空, 唯一索引）
- ✅ `profileType` 字段已添加（TEXT, 可空）
- ✅ 索引已创建：
  - `School_wpId_key` (唯一索引)
  - `School_wpId_idx` (普通索引)
  - `School_templateId_idx` (普通索引)

## 下一步操作

现在可以触发WordPress学校数据同步：

### 方法1: 使用API调用

```bash
POST /api/admin/sync-schools
Headers: Authorization: Bearer <admin-token>
```

### 方法2: 使用curl

```bash
curl -X POST https://your-app.vercel.app/api/admin/sync-schools \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 方法3: 在代码中调用

```typescript
import { syncAllWPSchools } from '@/services/syncWPSchools';

// 在管理后台页面或API路由中调用
const result = await syncAllWPSchools();
console.log(`同步了 ${result.synced} 所学校`);
```

## 验证修复

同步完成后，验证以下内容：

1. **检查数据库**:
   ```sql
   SELECT COUNT(*) FROM "School" WHERE "nameShort" IS NOT NULL;
   ```

2. **检查前端页面**:
   - 访问 `/schools` 页面
   - 所有学校都应该显示 `name_short`
   - 访问 `/admin/templates-v2` 页面
   - 所有学校都应该显示 `name_short`

3. **检查API响应**:
   ```bash
   GET /api/schools
   # 应该返回所有学校的 nameShort 字段
   ```

## 注意事项

- 旧的迁移状态错误（P3015）仍然存在，但不影响新迁移的功能
- 如果需要完全清理迁移状态，可以删除 `prisma/migrations/20251120170000_manual_initial_migration` 目录
- 所有新的迁移都已成功应用，数据库结构已更新

## 完成状态

✅ 数据库迁移：完成  
✅ Prisma客户端生成：完成  
✅ 代码更新：完成  
⏳ WordPress数据同步：待执行（需要调用 `/api/admin/sync-schools`）

