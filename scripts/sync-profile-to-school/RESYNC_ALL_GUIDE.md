# 全部 Profiles 重新同步指南

## 🎯 两种全量重新同步方式

### 方式 1: 从 WordPress 重新同步所有 Profiles（推荐）

从 WordPress 获取所有 profile posts 并同步到数据库。这种方式最可靠，因为总是从 WordPress 获取最新数据。

```bash
# 重新同步所有 WordPress profiles
npm run sync:profile-to-school:resync-all
```

**特点**：
- ✅ 从 WordPress 获取所有 profile posts（约 1962 条）
- ✅ 更新数据库中对应的记录
- ✅ 如果记录不存在则创建
- ✅ 分批处理，自动控制并发和速度
- ✅ 详细的进度报告

**选项**：
```bash
# Dry run 模式（测试，不修改数据库）
npm run sync:profile-to-school:resync-all -- --dry-run

# 自定义批次大小（默认 10）
npm run sync:profile-to-school:resync-all -- --batch-size 20
```

### 方式 2: 重新同步数据库中所有有 wpId 的记录

基于数据库中已有的记录（有 wpId），从 WordPress 重新获取数据并更新。

```bash
# 重新同步数据库中所有有 wpId 的记录
npm run sync:profile-to-school:resync -- --all
```

**特点**：
- ✅ 只处理数据库中已有 wpId 的记录（约 6784 条）
- ✅ 从 WordPress 重新获取最新数据
- ✅ 不会创建新记录
- ✅ 可以限制数量

**选项**：
```bash
# 重新同步所有有 wpId 的记录
npm run sync:profile-to-school:resync -- --all

# 只重新同步前 100 条（用于测试）
npm run sync:profile-to-school:resync -- --all --limit 100

# Dry run 模式
npm run sync:profile-to-school:resync -- --all --dry-run
```

## 📊 两种方式的区别

| 特性 | 方式 1: resync-all | 方式 2: resync --all |
|------|-------------------|---------------------|
| 数据源 | WordPress（所有 posts） | 数据库（有 wpId 的记录） |
| 记录数量 | ~1962 条 | ~6784 条 |
| 会创建新记录 | ✅ 是 | ❌ 否 |
| 会更新已有记录 | ✅ 是 | ✅ 是 |
| 处理顺序 | WordPress ID 顺序 | 数据库 updatedAt 倒序 |

## 🚀 推荐使用方式 1

**推荐使用方式 1** (`resync-all`)，因为：
1. ✅ 确保同步所有 WordPress profiles
2. ✅ 数据源是 WordPress，更可靠
3. ✅ 如果数据库中有记录但 WordPress 中不存在，会被跳过
4. ✅ 适合首次同步或完全重新同步

## 📋 完整重新同步步骤

### 步骤 1: 验证当前状态

```bash
npm run sync:profile-to-school:verify
```

查看当前同步状态，了解有多少记录需要更新。

### 步骤 2: 先进行小批量测试（可选但推荐）

```bash
# 测试同步 10 条记录
npm run sync:profile-to-school:resync-all -- --batch-size 5 --dry-run
```

### 步骤 3: 执行全量重新同步

```bash
# 方式 1（推荐）：从 WordPress 重新同步所有 profiles
npm run sync:profile-to-school:resync-all

# 或者方式 2：重新同步数据库中所有有 wpId 的记录
npm run sync:profile-to-school:resync -- --all
```

**注意**：这会花费较长时间（约 1962 条记录，每条约 1-2 秒，总计约 30-60 分钟）

### 步骤 4: 验证同步结果

```bash
# 查看整体统计
npm run sync:profile-to-school:verify

# 验证特定记录
npm run sync:profile-to-school:verify -- --wp-id 12224
```

## ⚙️ 性能优化建议

### 1. 调整批次大小

默认批次大小是 10。如果网络和数据库性能较好，可以增加：

```bash
npm run sync:profile-to-school:resync-all -- --batch-size 20
```

### 2. 分批执行（如果担心超时）

可以将同步分成多个阶段：

```bash
# 阶段 1：前 500 条
# （使用主同步脚本，可以指定偏移量）

# 或者使用方式 2，分批执行：
npm run sync:profile-to-school:resync -- --all --limit 500
# 等待完成后继续
npm run sync:profile-to-school:resync -- --all --limit 500
# ... 依此类推
```

### 3. 后台运行（Linux/Mac）

```bash
nohup npm run sync:profile-to-school:resync-all > sync.log 2>&1 &
```

### 4. 监控进度

脚本会自动输出进度信息：
- 当前批次
- 成功/失败数量
- 预计剩余时间

## ⚠️ 注意事项

1. **时间消耗**：全量重新同步约 1962 条记录需要 30-60 分钟
2. **数据库连接**：脚本会自动处理连接问题和重试
3. **网络稳定性**：建议在网络稳定时执行
4. **数据安全**：脚本使用 upsert，不会删除已有数据，只会更新

## 🔍 故障排查

### 如果同步中断

脚本支持断点续传（基于数据库记录）。如果中断后想继续：

```bash
# 重新运行即可，已同步的记录会更新，未同步的记录会继续
npm run sync:profile-to-school:resync-all
```

### 如果某些记录失败

查看日志中的错误信息，然后：

```bash
# 重新同步失败的特定记录
npm run sync:profile-to-school:resync -- --wp-id <wpId>
```

### 如果遇到连接问题

脚本会自动重试。如果仍然失败，检查：
1. 数据库连接配置
2. WordPress API 连接
3. 网络稳定性

## 📝 执行示例

```bash
# 1. 查看当前状态
$ npm run sync:profile-to-school:verify
总记录数: 6788
有 wpId 的记录数: 6784 (99.9%)
school_profile_type 已填充: 109 (1.6%)
profileType 已填充: 11 (0.2%)

# 2. 开始全量重新同步
$ npm run sync:profile-to-school:resync-all

🔄 开始重新同步所有 WordPress Profiles
═══════════════════════════════════════════════════════════

验证 Prisma Client...
Prisma Client 验证成功
测试 WordPress 连接...
WordPress REST API 连接成功
获取所有 profile post IDs...
总共找到 1962 条 profile posts

处理批次 1/197 (1-10/1962)
同步 10 条记录到数据库...
✅ 成功同步 wpId=13307
✅ 成功同步 wpId=13308
...

处理批次 2/197 (11-20/1962)
...

✅ 重新同步完成
总记录数: 1962
成功: 1960 条 (99.9%)
失败: 2 条 (0.1%)

# 3. 验证结果
$ npm run sync:profile-to-school:verify
school_profile_type 已填充: 1895 (96.6%)
profileType 已填充: 1850 (94.3%)
```

## 🎯 快速开始

```bash
# 最简单的命令：重新同步所有 WordPress profiles
npm run sync:profile-to-school:resync-all
```

这就是全部！脚本会自动处理所有细节。

