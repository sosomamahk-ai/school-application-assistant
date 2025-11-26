# 同步命令快速参考

> 📖 详细说明请查看 [SYNC_COMMANDS_REFERENCE.md](./SYNC_COMMANDS_REFERENCE.md)

## 🚀 快速开始

### University 首次同步（推荐流程）

```bash
# 1. 测试 10 条记录
npm run sync:university:test

# 2. 验证结果
npm run sync:profile-to-school:verify

# 3. 如果成功，全量同步
npm run sync:university:resync-all
```

### Profile 首次同步

```bash
# 1. 测试 10 条记录
npm run sync:profile-to-school:resync-all -- --limit 10

# 2. 验证结果
npm run sync:profile-to-school:verify

# 3. 如果成功，全量同步
npm run sync:profile-to-school:resync-all
```

---

## 📋 常用命令

### University 同步

| 命令 | 说明 |
|------|------|
| `npm run sync:university:test` | 快速测试 10 条记录 ⭐ |
| `npm run sync:university:resync-all` | 全量同步所有 universities |
| `npm run sync:university:resync-all -- --limit 50` | 测试 50 条记录 |
| `npm run sync:university:resync-all -- --dry-run` | 测试模式（不修改数据库） |

### Profile 同步

| 命令 | 说明 |
|------|------|
| `npm run sync:profile-to-school:resync-all` | 全量同步所有 profiles |
| `npm run sync:profile-to-school:resync-all -- --limit 10` | 测试 10 条记录 |
| `npm run sync:profile-to-school:resync-all -- --dry-run` | 测试模式 |

### 重新同步缺失字段（通用）

| 命令 | 说明 |
|------|------|
| `npm run sync:profile-to-school:resync` | 同步缺失字段的记录 |
| `npm run sync:profile-to-school:resync -- --all` | 重新同步所有记录 |
| `npm run sync:profile-to-school:resync -- --limit 100` | 只同步前 100 条 |
| `npm run sync:profile-to-school:resync -- --wp-id 22117` | 同步指定记录 |

### 验证和诊断

| 命令 | 说明 |
|------|------|
| `npm run sync:profile-to-school:verify` | 查看整体统计（包括 postType）⭐ |
| `npm run sync:profile-to-school:verify -- --wp-id 22117` | 验证单条记录 |
| `npm run sync:profile-to-school:test-post -- 22117` | 测试单个 post |

---

## 🔧 参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `--limit <N>` | 限制记录数（测试用） | `--limit 10` |
| `--batch-size <N>` | 批次大小 | `--batch-size 20` |
| `--dry-run` | 测试模式 | `--dry-run` |
| `--wp-id <ID>` | 指定 wpId | `--wp-id 22117` |
| `--all` | 所有记录 | `--all` |

---

## 📊 验证 postType 是否设置

```bash
# 查看统计（会显示 postType 统计）
npm run sync:profile-to-school:verify
```

**期望输出**：
```
postType (WordPress Post Type) ⭐:
  总数: 6900
  profile: 1962 (28.4%)
  university: 10 (0.1%)  ← 应该 > 0
  未设置: 4928 (71.4%)
```

---

## 🔄 修复 postType 为 null

```bash
# 重新同步所有记录（会自动设置 postType）
npm run sync:profile-to-school:resync -- --all

# 验证结果
npm run sync:profile-to-school:verify
```

---

## ⚡ 常用组合

```bash
# 测试 + 验证
npm run sync:university:test && npm run sync:profile-to-school:verify

# 测试 50 条 + 小批次
npm run sync:university:resync-all -- --limit 50 --batch-size 10

# 重新同步 + 验证
npm run sync:profile-to-school:resync -- --all && npm run sync:profile-to-school:verify
```

---

**提示**: 所有命令都支持 `--dry-run` 参数，可以先测试再执行！

