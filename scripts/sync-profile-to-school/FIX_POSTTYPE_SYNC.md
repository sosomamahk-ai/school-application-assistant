# PostType 同步问题修复说明

## 问题描述

1. **Profile 同步问题**：同步 profile 数据时，没能排除大学数据，会同时同步大学数据
2. **University 同步问题**：同步大学数据时，全部都出错，显示无法获得 post type 数据（404 错误）

## 根本原因

1. `resync-missing-fields.ts` 脚本在遇到 postType 为 null 或错误的记录时，会默认使用 profile endpoint，导致 university 数据被错误地尝试从 profile endpoint 获取，返回 404
2. 数据库中的 postType 可能被错误标记（例如标记为 'profile' 但实际是 'university'），导致同步失败

## 修复方案

### 1. 智能 postType 检测（`resync-missing-fields.ts`）

修改了 `resync-missing-fields.ts`，使其能够自动检测正确的 postType：

- **如果 postType 为 null**：先尝试 profile endpoint，如果 404，再尝试 university endpoint
- **如果 postType 为 'profile' 但返回 404**：自动尝试 university endpoint
- **如果 postType 为 'university' 但返回 404**：自动尝试 profile endpoint
- **自动更新 postType**：检测到正确的 postType 后，会自动更新数据库中的 postType 字段

### 2. 改进 404 错误处理（`wordpress-client.ts`）

修改了 `getPost` 方法：

- **之前**：遇到 404 时抛出错误
- **现在**：遇到 404 时返回 `null`，便于调用方判断和处理

### 3. 确保 postType 正确设置

- `resync-all-profiles.ts`：只从 profile endpoint 获取数据，自动设置 `postType = 'profile'`
- `resync-all-universities.ts`：只从 university endpoint 获取数据，自动设置 `postType = 'university'`
- `postTypeSyncRunner.ts`：通过 `buildPostTypeConfig` 确保配置中的 `wpPostType` 正确设置

## 使用建议

### 修复错误的 postType

如果数据库中有很多 postType 为 null 或错误的记录，可以运行：

```bash
# 重新同步所有记录（会自动检测并修复 postType）
npm run sync:profile-to-school:resync -- --all

# 或者限制数量先测试
npm run sync:profile-to-school:resync -- --all --limit 100
```

### 分别同步 Profile 和 University

```bash
# 只同步 Profile 数据（自动设置 postType = 'profile'）
npm run sync:profile-to-school:resync-all

# 只同步 University 数据（自动设置 postType = 'university'）
npm run sync:university:resync-all

# 测试模式
npm run sync:university:test
```

### 验证修复结果

```bash
# 查看 postType 统计
npm run sync:profile-to-school:verify
```

期望看到：
- `profile: X 条`
- `university: Y 条`
- `未设置: 0 条`（或接近 0）

## 技术细节

### 自动检测逻辑

```typescript
// 确定要尝试的 postType 顺序
const postTypesToTry: PostTypeKey[] = [];
if (recordPostType === 'profile' || recordPostType === null) {
  // 如果标记为 profile 或 null，先尝试 profile
  postTypesToTry.push('profile', 'university');
} else if (recordPostType === 'university') {
  // 如果标记为 university，先尝试 university
  postTypesToTry.push('university', 'profile');
} else {
  // 未知类型，先尝试 profile
  postTypesToTry.push('profile', 'university');
}

// 尝试每个 postType
for (const tryPostType of postTypesToTry) {
  const post = await wpClient.getPost(wpId);
  if (post) {
    detectedPostType = tryPostType;
    break;
  }
}
```

### postType 设置流程

1. `buildPostTypeConfig` 设置 `config.wpPostType = postType`
2. `extractFields` 从 `config.wpPostType` 提取 postType
3. `prisma-sync.ts` 的 `extractToPrismaData` 将 postType 保存到数据库

## 测试验证

修复后，运行以下命令验证：

```bash
# 1. 测试少量记录
npm run sync:profile-to-school:resync -- --limit 10

# 2. 验证结果
npm run sync:profile-to-school:verify

# 3. 如果成功，全量同步
npm run sync:profile-to-school:resync -- --all
```

## 注意事项

1. **首次同步**：建议先使用 `--limit` 参数测试少量记录
2. **全量同步**：确认测试成功后，再运行全量同步
3. **验证结果**：每次同步后运行 `verify` 命令检查 postType 是否正确设置
4. **性能考虑**：自动检测会尝试两个 endpoint，可能会增加一些请求时间，但能确保数据准确性

## 相关文件

- `scripts/sync-profile-to-school/resync-missing-fields.ts` - 智能 postType 检测
- `scripts/sync-profile-to-school/wordpress-client.ts` - 404 错误处理改进
- `scripts/sync-profile-to-school/postTypeSyncRunner.ts` - postType 同步逻辑
- `scripts/sync-profile-to-school/postTypeConfig.ts` - postType 配置构建
- `scripts/sync-profile-to-school/prisma-sync.ts` - postType 数据库保存

---

**修复日期**: 2025-11-25

