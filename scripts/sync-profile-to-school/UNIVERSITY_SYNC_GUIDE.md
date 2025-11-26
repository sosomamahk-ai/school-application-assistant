# University 同步脚本使用指南

## 📋 概述

为了将 profile 和 university 的同步分开，我们创建了专门用于 university 的同步脚本。这样可以：
- ✅ 独立同步 university 数据，不影响 profile 同步
- ✅ 根据 postType 自动选择正确的 endpoint
- ✅ 避免 404 错误（因为会使用正确的 endpoint）

## 🚀 快速开始

### 1. 测试同步（推荐先执行）

在同步全部 4800+ 条记录之前，建议先测试少量记录：

```bash
# 测试同步 10 条记录（快速验证）
npm run sync:university:test

# 或者自定义测试数量
npm run sync:university:resync-all -- --limit 20
```

**功能**：
- 只同步指定数量的记录（默认 10 条）
- 快速验证同步流程是否正常
- 确认数据格式和字段提取是否正确

### 2. 同步所有 Universities

测试成功后，同步所有 university posts：

```bash
npm run sync:university:resync-all
```

**功能**：
- 从 WordPress `/wp-json/wp/v2/university` endpoint 获取所有 university posts
- 提取字段并同步到数据库
- 自动设置 `postType = 'university'`

### 同步缺失字段的 Universities

同步数据库中 postType 为 'university' 且字段缺失的记录：

```bash
npm run sync:profile-to-school:resync
```

**注意**：`resync-missing-fields.ts` 脚本已经更新，会根据数据库中的 `postType` 字段自动选择正确的 endpoint：
- 如果 `postType = 'university'`，使用 `/wp-json/wp/v2/university` endpoint
- 如果 `postType = 'profile'` 或 `null`，使用 `/wp-json/wp/v2/profile` endpoint

## 📝 命令说明

### 1. 测试同步（少量记录）

```bash
# 快速测试 10 条记录
npm run sync:university:test

# 或者自定义测试数量
npm run sync:university:resync-all -- --limit 20
```

**参数**：
- `--limit <number>`: 限制同步的记录数（用于测试）

**示例**：
```bash
# 测试 10 条记录（默认）
npm run sync:university:test

# 测试 50 条记录
npm run sync:university:resync-all -- --limit 50

# 测试 100 条记录
npm run sync:university:resync-all -- --limit 100
```

### 2. 同步所有 Universities

```bash
npm run sync:university:resync-all
```

**参数**：
- `--dry-run`: 只显示将要执行的操作，不实际修改数据库
- `--batch-size <number>`: 设置批次大小（默认使用配置中的值）
- `--limit <number>`: 限制同步的记录数（用于测试）

**示例**：
```bash
# 正常同步所有记录
npm run sync:university:resync-all

# 测试模式（不修改数据库）
npm run sync:university:resync-all -- --dry-run

# 使用较小的批次大小
npm run sync:university:resync-all -- --batch-size 20

# 只同步前 100 条（测试用）
npm run sync:university:resync-all -- --limit 100
```

### 2. 同步缺失字段（支持 Profile 和 University）

```bash
npm run sync:profile-to-school:resync
```

**参数**：
- `--all`: 同步所有有 wpId 的记录（不限制缺失字段）
- `--limit <number>`: 限制同步的记录数
- `--wp-id <number>`: 同步指定的 wpId
- `--dry-run`: 测试模式

**示例**：
```bash
# 同步所有缺失字段的记录（自动根据 postType 选择 endpoint）
npm run sync:profile-to-school:resync -- --all

# 只同步前 100 条
npm run sync:profile-to-school:resync -- --limit 100

# 同步指定的 university
npm run sync:profile-to-school:resync -- --wp-id 22117
```

## 🔧 工作原理

### University 同步脚本 (`resync-all-universities.ts`)

1. **加载配置**：从环境变量加载 WordPress 配置
2. **替换 Endpoint**：将 `wpApiProfileEndpoint` 从 `/wp-json/wp/v2/profile` 替换为 `/wp-json/wp/v2/university`
3. **获取所有 IDs**：从 WordPress university endpoint 获取所有 post IDs
4. **批量处理**：分批获取 posts 并同步到数据库
5. **设置 postType**：同步时自动设置 `postType = 'university'`

### 智能 Endpoint 选择 (`resync-missing-fields.ts`)

当同步数据库中已有的记录时，脚本会：
1. **读取 postType**：从数据库读取每条记录的 `postType` 字段
2. **选择 Endpoint**：
   - 如果 `postType = 'university'` → 使用 `/wp-json/wp/v2/university`
   - 如果 `postType = 'profile'` 或 `null` → 使用 `/wp-json/wp/v2/profile`
3. **创建客户端**：为每条记录创建对应的 WordPressClient
4. **同步数据**：使用正确的 endpoint 获取数据并同步

## 📊 使用场景

### 场景 1: 首次同步（推荐流程）

```bash
# 步骤 1: 先测试 10 条记录，确认同步正常
npm run sync:university:test

# 步骤 2: 如果测试成功，测试更多记录（如 50 条）
npm run sync:university:resync-all -- --limit 50

# 步骤 3: 确认无误后，同步所有记录
npm run sync:university:resync-all
```

### 场景 2: 首次同步所有 Universities（跳过测试）

```bash
# 直接同步所有 university posts（不推荐，建议先测试）
npm run sync:university:resync-all
```

### 场景 3: 更新缺失字段的 Universities

```bash
# 同步所有 postType='university' 且字段缺失的记录
npm run sync:profile-to-school:resync
```

### 场景 4: 全量重新同步所有 Universities

```bash
# 重新同步所有有 wpId 的记录（包括 profile 和 university）
npm run sync:profile-to-school:resync -- --all
```

### 场景 5: 修复单个 University

```bash
# 同步指定的 university
npm run sync:profile-to-school:resync -- --wp-id 22117
```

## ⚙️ 配置

确保 `.env` 文件中配置了正确的 WordPress URL：

```env
WP_BASE_URL=https://your-wordpress-site.com
WP_API_PROFILE_ENDPOINT=/wp-json/wp/v2/profile
```

**注意**：University 脚本会自动将 endpoint 替换为 `/wp-json/wp/v2/university`，无需额外配置。

## 🔍 验证同步结果

使用验证脚本检查同步结果：

```bash
npm run sync:profile-to-school:verify
```

这会显示：
- 总记录数
- 已填充字段的记录数
- 缺失字段的记录数
- 按 postType 分类的统计（包含 profile/university 数量）
- 最近同步的 University 示例（含 postType 字段）

## ❓ 常见问题

### Q: 为什么需要分开 profile 和 university 的同步？

**A**: 因为 WordPress 中有两个不同的 post type（`profile` 和 `university`），它们使用不同的 REST API endpoint。分开同步可以：
- 避免混淆和错误
- 更清晰地管理不同数据类型
- 提高同步效率

### Q: `resync-missing-fields.ts` 会自动识别 postType 吗？

**A**: 是的。脚本会从数据库读取 `postType` 字段，并自动选择正确的 endpoint。如果 `postType` 为 `null`，默认使用 profile endpoint。

### Q: 如何确保 postType 字段已正确设置？

**A**: 运行 `resync-all-universities.ts` 时，会自动设置 `postType = 'university'`。如果使用其他同步方式，确保同步时设置了 `postType` 字段。

### Q: 可以同时运行 profile 和 university 同步吗？

**A**: 可以，但建议分开运行以避免数据库冲突。先运行一个，完成后再运行另一个。

### Q: 如何测试同步是否正常？

**A**: 使用测试命令先同步少量记录：
```bash
# 测试 10 条记录
npm run sync:university:test

# 或测试更多记录
npm run sync:university:resync-all -- --limit 50
```
确认测试成功后再运行全量同步。

## 📚 相关文档

- [Profile 同步指南](./RESYNC_ALL_GUIDE.md)
- [验证同步结果](./VERIFY_AND_RESYNC_GUIDE.md)
- [完整同步指南](./FULL_RESYNC_GUIDE.md)

