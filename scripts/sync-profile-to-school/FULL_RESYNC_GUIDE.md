# 全量重新同步指南

## 📋 两种全量同步方式

### 方式 1: 使用主同步脚本（推荐）⭐

这会从 WordPress 获取所有 profile posts 并同步到数据库：

```bash
# 全量同步所有 WordPress profile posts
npm run sync:profile-to-school
```

**特点**：
- ✅ 从 WordPress 获取最新的所有 posts
- ✅ 自动处理所有记录（包括新增和更新）
- ✅ 使用最新的字段映射逻辑
- ✅ 支持进度显示和错误处理

**执行时间**：取决于 WordPress posts 数量（约 1962 条），预计需要 30-60 分钟

### 方式 2: 使用重新同步脚本

这会基于数据库中已有的记录进行重新同步：

```bash
# 全量重新同步所有有 wpId 的记录
npm run sync:profile-to-school:resync -- --all
```

**特点**：
- ✅ 只重新同步数据库中已有的记录
- ✅ 不会添加新的记录（只在 WordPress 中存在但数据库中不存在的）
- ✅ 适用于只更新现有记录

## 🚀 推荐流程

### 步骤 1: 先验证当前状态

```bash
npm run sync:profile-to-school:verify
```

查看需要同步的记录数量。

### 步骤 2: 选择同步方式

#### 选项 A: 全量同步（推荐）

如果您想确保同步所有 WordPress posts（包括可能的新增），使用：

```bash
npm run sync:profile-to-school
```

这会：
1. 从 WordPress 获取所有 profile posts（约 1962 条）
2. 提取字段（ACF 和 Taxonomy）
3. 更新或创建数据库记录

#### 选项 B: 重新同步现有记录

如果只想更新数据库中已有的记录，使用：

```bash
npm run sync:profile-to-school:resync -- --all
```

这会：
1. 查找所有有 wpId 的数据库记录
2. 从 WordPress 重新获取数据
3. 更新数据库记录

### 步骤 3: 验证结果

```bash
# 查看整体统计
npm run sync:profile-to-school:verify

# 验证特定记录
npm run sync:profile-to-school:verify -- --wp-id 35899
```

## ⚠️ 注意事项

### 执行时间

- **全量同步**：约 1962 条记录，预计 30-60 分钟
- **重新同步**：取决于数据库中已有记录数（约 6784 条），预计 1-2 小时

### 网络稳定性

- 确保网络连接稳定
- 脚本已实现自动重试机制
- 如果中断，可以重新运行（幂等操作，不会重复创建）

### 数据库连接

- 脚本会自动重试数据库连接
- 如果遇到连接问题，会等待并重试
- 建议在数据库负载较低时运行

## 📊 进度监控

同步过程中会显示：
- 进度百分比
- 成功/失败计数
- 错误详情（如果有）

示例输出：
```
进度: 100/1962 (5.1%)
进度: 200/1962 (10.2%)
...
同步完成
成功: 1950 条
失败: 12 条
```

## 🔧 分批执行（如果全量同步太慢）

如果全量同步时间太长，可以分批执行：

### 使用主同步脚本的分页

主同步脚本会自动分页处理，无需手动分批。

### 使用重新同步脚本分批

```bash
# 第 1 批：前 500 条
npm run sync:profile-to-school:resync -- --limit 500

# 等待完成后，第 2 批
npm run sync:profile-to-school:resync -- --limit 500

# ... 依此类推
```

## 🎯 快速命令参考

```bash
# 全量同步（从 WordPress 获取所有 posts）
npm run sync:profile-to-school

# 全量重新同步（更新数据库中所有已有记录）
npm run sync:profile-to-school:resync -- --all

# 重新同步缺失字段的记录（默认行为）
npm run sync:profile-to-school:resync

# 重新同步前 100 条缺失字段的记录
npm run sync:profile-to-school:resync -- --limit 100

# 验证同步状态
npm run sync:profile-to-school:verify

# 验证单条记录
npm run sync:profile-to-school:verify -- --wp-id 35899
```

## ✅ 推荐方案

**如果您想确保数据完整和最新，推荐使用方式 1**：

```bash
npm run sync:profile-to-school
```

这会：
- ✅ 获取 WordPress 中的所有最新 posts
- ✅ 自动处理新增和更新
- ✅ 使用最新的字段映射逻辑
- ✅ 提供详细的进度和错误报告

完成后验证：

```bash
npm run sync:profile-to-school:verify
```

