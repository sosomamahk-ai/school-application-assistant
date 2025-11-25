# 🚀 全部 Profiles 重新同步 - 快速指南

## 最简单的命令

```bash
npm run sync:profile-to-school:resync-all
```

这个命令会：
1. ✅ 从 WordPress 获取所有 profile posts（约 1962 条）
2. ✅ 重新同步到数据库
3. ✅ 更新所有字段，包括 `school_profile_type` 和 `profileType`
4. ✅ 显示详细进度和结果报告

## 📋 完整步骤

### 1. 查看当前状态

```bash
npm run sync:profile-to-school:verify
```

### 2. 执行全量重新同步

```bash
npm run sync:profile-to-school:resync-all
```

**预计时间**：约 30-60 分钟（1962 条记录）

### 3. 验证同步结果

```bash
npm run sync:profile-to-school:verify
```

## ⚙️ 选项

### Dry Run 模式（测试，不修改数据库）

```bash
npm run sync:profile-to-school:resync-all -- --dry-run
```

### 自定义批次大小

```bash
# 每批处理 20 条（默认 10）
npm run sync:profile-to-school:resync-all -- --batch-size 20
```

## 📊 替代方案

### 方式 2: 重新同步数据库中所有有 wpId 的记录

```bash
# 重新同步所有有 wpId 的记录（约 6784 条）
npm run sync:profile-to-school:resync -- --all
```

这种方式只处理数据库中已有的记录，不会创建新记录。

## ⚠️ 注意事项

1. **时间消耗**：全量同步需要较长时间，建议在网络稳定时执行
2. **进度显示**：脚本会显示批次进度和成功/失败统计
3. **自动重试**：遇到连接问题会自动重试
4. **数据安全**：使用 upsert，不会删除已有数据

## 🎯 推荐流程

```bash
# 1. 查看状态
npm run sync:profile-to-school:verify

# 2. 执行全量重新同步
npm run sync:profile-to-school:resync-all

# 3. 验证结果
npm run sync:profile-to-school:verify
```

就这么简单！🎉

