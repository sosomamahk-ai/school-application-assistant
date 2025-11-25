# 抽样同步功能说明

## ✅ 功能已实现

抽样同步功能已完全集成到同步脚本中，可以作为正式的 pipeline 分支使用。

## 主要特性

### 1. 随机抽样

- 支持通过 `--sample <数量>` 参数指定抽样数量
- 使用 Fisher-Yates shuffle 算法确保随机性
- 先获取所有 IDs（轻量查询），再随机选择

### 2. 复用所有组件

抽样模式完全复用主同步流程的所有组件：
- ✅ `wordpress-client.ts` - WordPress API 客户端
- ✅ `field-extractor.ts` - 字段提取器
- ✅ `diagnosis.ts` - 字段诊断
- ✅ `prisma-sync.ts` - 数据库同步
- ✅ `logger.ts` - 日志系统

### 3. 完整的诊断和报告

- 详细的抽样报告（包含统计、诊断、警告）
- 缺失字段统计
- 失败率计算和阈值警告
- 原始 API payload 记录（用于诊断）

### 4. 支持 Dry Run

```bash
npm run sync:profile-to-school -- --sample 20 --dry-run
```

### 5. 手动确认机制

抽样完成后不会自动继续，需要手动执行完整同步。

## 使用方式

### 基本用法

```bash
# 抽样 20 条记录，dry-run 模式（推荐）
npm run sync:profile-to-school -- --sample 20 --dry-run

# 抽样 20 条记录，实际同步
npm run sync:profile-to-school -- --sample 20
```

### 工作流程

1. 获取所有 post IDs（轻量查询）
2. 随机抽样指定数量的 IDs
3. 获取抽样 posts 的详细信息
4. 执行完整同步流程
5. 生成详细报告

## 已更新的文件

### 核心代码

1. **config.ts** - 添加了 `sampleSize` 和 `sampleFailureThreshold` 配置
2. **types.ts** - 添加了 `SampleReport` 和 `SamplingMode` 类型
3. **wordpress-client.ts** - 添加了 `getAllPostIds()` 和 `samplePostIds()` 方法
4. **logger.ts** - 添加了 `printSampleReport()` 方法
5. **index.ts** - 添加了 `syncSample()` 函数和抽样模式判断逻辑

### 文档

1. **README.md** - 添加了抽样模式的详细说明
2. **QUICK_START.md** - 更新了快速开始指南，推荐先使用抽样
3. **SAMPLING_GUIDE.md** - 完整的抽样功能使用指南（新建）

## 配置选项

### 环境变量

```env
SAMPLE_FAILURE_THRESHOLD=0.1  # 抽样失败率阈值（默认 10%）
```

### 命令行参数

- `--sample <数量>`: 指定抽样数量（例如 `--sample 20`）
- `--dry-run`: 可选，dry-run 模式下不修改数据库

## 报告内容

抽样报告包含：

- ✅ 抽样数量
- ✅ 总可用记录数
- ✅ 成功/失败统计
- ✅ 缺失字段统计
- ✅ 失败率
- ✅ 字段诊断详情
- ✅ 警告信息（如果失败率超过阈值）
- ✅ 下一步操作建议

## 最佳实践

1. **首次使用前**: 先运行 `--sample 20 --dry-run`
2. **修改配置后**: 重新运行抽样测试
3. **发现问题时**: 使用抽样模式快速验证修复
4. **定期验证**: 定期运行抽样测试检查数据质量

## 技术细节

### 随机抽样算法

使用 Fisher-Yates shuffle 算法：

```typescript
// 打乱数组
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}

// 取前 N 个
return shuffled.slice(0, sampleSize);
```

### 轻量查询优化

首先使用 `_fields=id` 参数只获取 IDs，大大减少网络传输：

```bash
GET /wp-json/wp/v2/profile?_fields=id&per_page=100
```

然后对抽样的 IDs 请求完整信息。

### 失败率阈值

默认阈值为 10%。如果失败率超过阈值：

1. 输出醒目的警告
2. 建议检查配置
3. 不阻止继续，但强烈建议先解决问题

## 注意事项

1. ✅ 抽样不会自动继续完整同步（需要手动执行）
2. ✅ 支持 dry-run 模式
3. ✅ 完全复用主同步流程的所有组件
4. ✅ 生成详细的诊断报告
5. ✅ 记录原始 API payload 用于诊断

## 测试建议

1. 测试少量抽样（`--sample 5`）
2. 测试 dry-run 模式
3. 测试失败率阈值警告
4. 验证报告内容是否完整

## 下一步

如需继续同步全部数据，运行：

```bash
npm run sync:profile-to-school
```

