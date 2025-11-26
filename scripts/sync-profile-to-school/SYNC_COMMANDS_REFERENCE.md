# 同步命令参考手册

本文档包含所有 Profile 和 University 同步相关的命令，方便快速查找和使用。

## 📋 目录

- [Profile 同步命令](#profile-同步命令)
- [University 同步命令](#university-同步命令)
- [通用同步命令](#通用同步命令)
- [验证和诊断命令](#验证和诊断命令)
- [快速参考](#快速参考)

---

## Profile 同步命令

### 1. 同步所有 Profiles（从 WordPress 获取）

```bash
# 全量同步所有 profile posts
npm run sync:profile-to-school:resync-all

# 测试模式（只同步 10 条）
npm run sync:profile-to-school:resync-all -- --limit 10

# 测试模式（只同步 50 条）
npm run sync:profile-to-school:resync-all -- --limit 50

# 使用较小的批次大小
npm run sync:profile-to-school:resync-all -- --batch-size 20

# 测试模式（不修改数据库）
npm run sync:profile-to-school:resync-all -- --dry-run
```

### 2. 同步缺失字段的 Profiles

```bash
# 同步所有缺失字段的记录（自动根据 postType 选择 endpoint）
npm run sync:profile-to-school:resync -- --all

# 只同步前 100 条缺失字段的记录
npm run sync:profile-to-school:resync -- --limit 100

# 同步指定的 profile
npm run sync:profile-to-school:resync -- --wp-id <wpId>

# 测试模式
npm run sync:profile-to-school:resync -- --limit 10 --dry-run
```

---

## University 同步命令

### 1. 同步所有 Universities（从 WordPress 获取）

```bash
# 全量同步所有 university posts（4800+ 条）
npm run sync:university:resync-all

# 快速测试（只同步 10 条）⭐ 推荐先执行
npm run sync:university:test

# 测试模式（只同步 20 条）
npm run sync:university:resync-all -- --limit 20

# 测试模式（只同步 50 条）
npm run sync:university:resync-all -- --limit 50

# 测试模式（只同步 100 条）
npm run sync:university:resync-all -- --limit 100

# 使用较小的批次大小
npm run sync:university:resync-all -- --batch-size 20

# 测试模式（不修改数据库）
npm run sync:university:resync-all -- --dry-run
```

### 2. 同步缺失字段的 Universities

```bash
# 同步所有缺失字段的记录（自动根据 postType 选择 endpoint）
npm run sync:profile-to-school:resync -- --all

# 只同步前 100 条缺失字段的记录
npm run sync:profile-to-school:resync -- --limit 100

# 同步指定的 university
npm run sync:profile-to-school:resync -- --wp-id <wpId>

# 测试模式
npm run sync:profile-to-school:resync -- --limit 10 --dry-run
```

---

## 通用同步命令

### 主同步脚本（从 WordPress 获取所有数据）

```bash
# 同步所有 posts（profile 和 university）
npm run sync:profile-to-school
```

### 重新同步缺失字段（智能识别 postType）

```bash
# 同步所有有 wpId 但字段缺失的记录
npm run sync:profile-to-school:resync

# 同步所有有 wpId 的记录（全量重新同步）
npm run sync:profile-to-school:resync -- --all

# 限制数量
npm run sync:profile-to-school:resync -- --limit 500

# 同步指定 wpId
npm run sync:profile-to-school:resync -- --wp-id 22117
```

---

## 验证和诊断命令

### 1. 查看同步统计

```bash
# 查看整体同步状态（包括 postType 统计）
npm run sync:profile-to-school:verify
```

**输出内容**：
- 总记录数
- 有 wpId 的记录数
- **postType 统计**（profile/university/未设置）⭐
- school_profile_type 填充情况
- profileType 填充情况
- nameEnglish 填充情况
- 最近同步的 University 记录示例

### 2. 验证单条记录

```bash
# 验证指定的 wpId
npm run sync:profile-to-school:verify -- --wp-id <wpId>

# 示例：验证 university
npm run sync:profile-to-school:verify -- --wp-id 22117

# 示例：验证 profile
npm run sync:profile-to-school:verify -- --wp-id 12345
```

**输出内容**：
- 数据库中的当前值（包括 postType）⭐
- WordPress 原始数据
- 提取的字段值
- 数据是否匹配

### 3. 测试单个 Post

```bash
# 测试单个 post 的字段提取
npm run sync:profile-to-school:test-post -- <wpId>

# 测试字段提取逻辑
npm run sync:profile-to-school:test-extraction
```

---

## 快速参考

### 🚀 首次同步流程（推荐）

#### Profile 首次同步

```bash
# 步骤 1: 测试 10 条记录
npm run sync:profile-to-school:resync-all -- --limit 10

# 步骤 2: 验证结果
npm run sync:profile-to-school:verify

# 步骤 3: 如果测试成功，全量同步
npm run sync:profile-to-school:resync-all
```

#### University 首次同步

```bash
# 步骤 1: 快速测试 10 条记录 ⭐
npm run sync:university:test

# 步骤 2: 验证结果（检查 postType 是否设置）
npm run sync:profile-to-school:verify

# 步骤 3: 如果测试成功，扩大测试（50 条）
npm run sync:university:resync-all -- --limit 50

# 步骤 4: 再次验证
npm run sync:profile-to-school:verify

# 步骤 5: 确认无误后，全量同步（4800+ 条）
npm run sync:university:resync-all
```

### 🔄 重新同步流程

#### 重新同步所有数据

```bash
# 重新同步所有有 wpId 的记录（自动识别 postType）
npm run sync:profile-to-school:resync -- --all
```

#### 重新同步缺失字段

```bash
# 只同步缺失字段的记录
npm run sync:profile-to-school:resync

# 限制数量（避免一次性处理太多）
npm run sync:profile-to-school:resync -- --limit 500
```

### 🔍 诊断流程

```bash
# 步骤 1: 查看整体统计
npm run sync:profile-to-school:verify

# 步骤 2: 如果发现 postType 为 null，验证单条记录
npm run sync:profile-to-school:verify -- --wp-id <wpId>

# 步骤 3: 重新同步该记录
npm run sync:profile-to-school:resync -- --wp-id <wpId>

# 步骤 4: 再次验证
npm run sync:profile-to-school:verify -- --wp-id <wpId>
```

---

## 参数说明

### 通用参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--limit <number>` | 限制同步的记录数（用于测试） | `--limit 10` |
| `--batch-size <number>` | 设置批次大小 | `--batch-size 20` |
| `--dry-run` | 测试模式，不实际修改数据库 | `--dry-run` |
| `--wp-id <number>` | 同步指定的 wpId | `--wp-id 22117` |
| `--all` | 同步所有记录（不限制缺失字段） | `--all` |

### 命令组合示例

```bash
# 测试 10 条记录，使用小批次，不修改数据库
npm run sync:university:resync-all -- --limit 10 --batch-size 5 --dry-run

# 同步 100 条记录，使用小批次
npm run sync:university:resync-all -- --limit 100 --batch-size 10

# 重新同步所有记录，限制批次大小
npm run sync:profile-to-school:resync -- --all --batch-size 20
```

---

## 常用场景命令

### 场景 1: 测试 University 同步（首次）

```bash
# 快速测试
npm run sync:university:test

# 验证结果
npm run sync:profile-to-school:verify
```

### 场景 2: 修复 postType 为 null 的记录

```bash
# 查看统计（确认有多少条 postType 为 null）
npm run sync:profile-to-school:verify

# 重新同步所有记录（会自动设置 postType）
npm run sync:profile-to-school:resync -- --all

# 再次验证
npm run sync:profile-to-school:verify
```

### 场景 3: 修复单个记录

```bash
# 验证记录
npm run sync:profile-to-school:verify -- --wp-id 22117

# 重新同步
npm run sync:profile-to-school:resync -- --wp-id 22117

# 再次验证
npm run sync:profile-to-school:verify -- --wp-id 22117
```

### 场景 4: 批量测试（逐步扩大）

```bash
# 测试 10 条
npm run sync:university:resync-all -- --limit 10
npm run sync:profile-to-school:verify

# 测试 50 条
npm run sync:university:resync-all -- --limit 50
npm run sync:profile-to-school:verify

# 测试 100 条
npm run sync:university:resync-all -- --limit 100
npm run sync:profile-to-school:verify

# 全量同步
npm run sync:university:resync-all
```

---

## 注意事项

1. **测试优先**：在同步大量数据前，先使用 `--limit` 参数测试少量记录
2. **验证结果**：每次同步后运行 `verify` 命令检查结果
3. **postType 字段**：确保同步后 `postType` 字段已正确设置（profile 或 university）
4. **批次大小**：如果遇到性能问题，可以减小 `--batch-size`
5. **Dry Run**：不确定时使用 `--dry-run` 查看将要执行的操作

---

## 故障排查

### 问题：postType 全部为 null

```bash
# 解决方案：重新同步所有记录
npm run sync:profile-to-school:resync -- --all
```

### 问题：某些记录同步失败

```bash
# 查看失败记录的详情
npm run sync:profile-to-school:verify

# 单独重新同步失败的记录
npm run sync:profile-to-school:resync -- --wp-id <wpId>
```

### 问题：404 错误（post 不存在）

```bash
# 这是正常的，脚本会自动跳过不存在的 post
# 检查 verify 输出中的警告信息
npm run sync:profile-to-school:verify
```

---

## 命令速查表

| 用途 | Profile | University |
|------|---------|------------|
| **全量同步** | `npm run sync:profile-to-school:resync-all` | `npm run sync:university:resync-all` |
| **快速测试** | `npm run sync:profile-to-school:resync-all -- --limit 10` | `npm run sync:university:test` |
| **重新同步缺失字段** | `npm run sync:profile-to-school:resync` | `npm run sync:profile-to-school:resync` |
| **验证统计** | `npm run sync:profile-to-school:verify` | `npm run sync:profile-to-school:verify` |
| **验证单条** | `npm run sync:profile-to-school:verify -- --wp-id <id>` | `npm run sync:profile-to-school:verify -- --wp-id <id>` |

---

**最后更新**: 2025-11-25

