# 全量重新同步所有 Profiles 的完整指南

## 🎯 快速开始

### 方式 1: 从 WordPress 全量同步（推荐）⭐

这会从 WordPress 获取所有 profile posts 并同步到数据库，确保数据最新：

```bash
npm run sync:profile-to-school
```

**适用场景**：
- ✅ 想要确保同步所有 WordPress posts
- ✅ 想要处理新增的 posts
- ✅ 想要使用最新的字段映射逻辑
- ✅ 首次同步或定期全量同步

**执行时间**：约 1962 条记录，预计 30-60 分钟

### 方式 2: 重新同步数据库中已有记录

这会基于数据库中已有的记录进行重新同步，更新所有字段：

```bash
# 全量重新同步所有有 wpId 的记录（6784 条）
npm run sync:profile-to-school:resync -- --all
```

**适用场景**：
- ✅ 只想更新数据库中已有的记录
- ✅ WordPress 中 posts 数量没有变化
- ✅ 需要修复已有记录的字段映射

**执行时间**：约 6784 条记录，预计 1-2 小时

## 📋 详细说明

### 方式 1: 主同步脚本（推荐）

```bash
npm run sync:profile-to-school
```

**工作流程**：
1. 从 WordPress REST API 获取所有 profile posts
2. 提取 ACF 字段和 Taxonomy 字段
3. 映射到数据库字段（`school_profile_type` 和 `profileType` 分开）
4. 更新或创建数据库记录（幂等操作）

**优点**：
- ✅ 自动处理所有 WordPress posts
- ✅ 包含新增的 posts
- ✅ 使用最新的字段提取和映射逻辑
- ✅ 提供详细的进度报告

**缺点**：
- ⚠️ 需要从 WordPress 重新获取所有数据（网络请求较多）
- ⚠️ 执行时间较长

### 方式 2: 重新同步脚本

```bash
# 全量重新同步
npm run sync:profile-to-school:resync -- --all

# 或分批同步（如果全量太慢）
npm run sync:profile-to-school:resync -- --all --limit 500
```

**工作流程**：
1. 从数据库查找所有有 `wpId` 的记录
2. 根据 `wpId` 从 WordPress 重新获取数据
3. 使用最新逻辑提取字段
4. 更新数据库记录

**优点**：
- ✅ 只处理数据库中已有的记录
- ✅ 不会添加新记录
- ✅ 支持分批执行（使用 `--limit`）

**缺点**：
- ⚠️ 不会同步 WordPress 中新增但数据库中没有的记录
- ⚠️ 执行时间较长（6784 条记录）

## 🚀 推荐执行步骤

### 步骤 1: 验证当前状态

```bash
npm run sync:profile-to-school:verify
```

查看需要同步的记录数量。

### 步骤 2: 选择同步方式并执行

#### 如果您想确保同步所有 WordPress posts（推荐）：

```bash
npm run sync:profile-to-school
```

#### 如果只想更新数据库中已有记录：

```bash
npm run sync:profile-to-school:resync -- --all
```

### 步骤 3: 验证结果

```bash
# 查看整体统计
npm run sync:profile-to-school:verify

# 验证特定记录
npm run sync:profile-to-school:verify -- --wp-id 12224
```

## 🔧 分批执行（推荐）

由于记录数量较多，建议分批执行以避免超时或连接问题：

### 使用主同步脚本

主同步脚本会自动分页处理，无需手动分批。但如果需要，可以中断后继续运行（幂等操作）。

### 使用重新同步脚本分批

```bash
# 第 1 批：500 条
npm run sync:profile-to-school:resync -- --all --limit 500

# 等待完成后，验证进度
npm run sync:profile-to-school:verify

# 第 2 批：500 条（会继续处理剩余的记录）
npm run sync:profile-to-school:resync -- --all --limit 500

# 重复直到所有记录同步完成
```

## ⚠️ 重要注意事项

### 1. 执行时间

- **主同步脚本**：约 30-60 分钟（1962 条记录）
- **重新同步脚本**：约 1-2 小时（6784 条记录）

### 2. 网络稳定性

- 确保网络连接稳定
- 脚本已实现自动重试机制
- 如果中断，可以重新运行（幂等操作）

### 3. 数据库连接

- 脚本会自动重试数据库连接
- 建议在数据库负载较低时运行

### 4. 幂等性

- 所有同步操作都是幂等的
- 重复运行不会导致数据重复
- 只会更新字段，不会重复创建记录

## 📊 进度监控

同步过程中会显示：
- 当前进度（X/总数）
- 百分比
- 成功/失败计数

示例输出：
```
进度: 100/1962 (5.1%)
进度: 200/1962 (10.2%)
...
同步完成
成功: 1950 条
失败: 12 条
```

## 🎯 快速命令参考

```bash
# ===== 全量同步 =====

# 方式 1: 从 WordPress 全量同步（推荐）
npm run sync:profile-to-school

# 方式 2: 重新同步数据库中所有记录
npm run sync:profile-to-school:resync -- --all

# 方式 3: 分批重新同步
npm run sync:profile-to-school:resync -- --all --limit 500

# ===== 验证 =====

# 查看整体统计
npm run sync:profile-to-school:verify

# 验证单条记录
npm run sync:profile-to-school:verify -- --wp-id 12224

# ===== 其他选项 =====

# Dry Run 模式（测试，不实际修改数据库）
npm run sync:profile-to-school -- --dry-run

# 只重新同步缺失字段的记录
npm run sync:profile-to-school:resync
```

## ✅ 推荐方案

**对于您的场景（全量重新同步所有 profiles），推荐使用方式 1**：

```bash
npm run sync:profile-to-school
```

**原因**：
1. ✅ 确保同步所有 WordPress posts
2. ✅ 使用最新的字段映射逻辑
3. ✅ 自动处理新增的 posts
4. ✅ 提供详细的进度和错误报告

执行完成后验证：

```bash
npm run sync:profile-to-school:verify
```

应该看到所有字段都正确填充了！

