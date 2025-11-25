# 测试和同步步骤指南

本指南将帮助您完成同步脚本的测试和正式同步。

## 📋 前置检查清单

在开始之前，请确认：

- [ ] 项目依赖已安装（`npm install`）
- [ ] Prisma schema 文件存在（`prisma/schema.prisma`）
- [ ] 数据库连接配置正确（`.env` 文件中的 `DATABASE_URL`）
- [ ] WordPress 站点可访问
- [ ] WordPress REST API 可用

## 🔧 步骤 1: 配置环境变量

### 方式 A: 自动配置（推荐）

使用交互式配置脚本自动配置环境变量：

```bash
npm run sync:profile-to-school:setup
```

脚本会引导您完成所有配置：
- ✅ 检查现有配置
- ✅ 交互式输入 WordPress URL 和认证信息
- ✅ 验证输入格式
- ✅ 自动保存到 `.env` 文件

**详细说明**: 查看 `SETUP_ENV_README.md`

### 方式 B: 手动配置

如果需要手动配置，在项目根目录的 `.env` 文件中添加以下配置：

```env
# WordPress 配置
WP_BASE_URL=http://localhost:3000
WP_API_PROFILE_ENDPOINT=/wp-json/wp/v2/profile

# 认证配置（选择一种方式）
# 方式 1: 无认证（公开站点）
WP_AUTH_TYPE=none

# 方式 2: Basic Auth
# WP_AUTH_TYPE=basic
# WP_AUTH_USERNAME=your-username
# WP_AUTH_PASSWORD=your-password

# 方式 3: Bearer Token
# WP_AUTH_TYPE=bearer
# WP_AUTH_TOKEN=your-token

# 方式 4: WordPress Application Password
# WP_AUTH_TYPE=wp-app-password
# WP_AUTH_USERNAME=your-username
# WP_AUTH_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# 数据库连接（应该已存在）
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# 可选配置
BATCH_SIZE=50
LOG_LEVEL=info
```

**重要提示**：
- 如果您的 WordPress 站点在本地运行，`WP_BASE_URL` 应该是 `http://localhost:3000`（或您的实际端口）
- 如果是远程站点，使用完整的 URL，例如 `https://example.com`
- 确认 `WP_API_PROFILE_ENDPOINT` 路径正确（通常是 `/wp-json/wp/v2/profile`）

## 🔨 步骤 2: 生成 Prisma Client

在运行同步脚本之前，必须先生成 Prisma Client：

```bash
npx prisma generate
```

**预期输出**：
```
✔ Generated Prisma Client (x.xx.xx)
```

如果看到错误，请检查：
- `prisma/schema.prisma` 文件是否存在
- `DATABASE_URL` 是否正确配置
- 数据库是否可以连接

## 🎲 步骤 3: 运行抽样测试（推荐）

在正式同步全部数据之前，强烈建议先运行抽样测试验证脚本是否正常工作。

### 3.1 Dry Run 模式（不修改数据库）

```bash
npm run sync:profile-to-school -- --sample 20 --dry-run
```

**这一步会**：
- 随机抽取 20 条 WordPress profile posts
- 执行完整的同步流程（字段提取、诊断、验证）
- **不会修改数据库**
- 生成详细的测试报告

**预期结果**：
- ✅ 应该看到 "抽样同步模式" 的输出
- ✅ 显示抽取的 Post IDs
- ✅ 显示成功/失败统计
- ✅ 如果有字段缺失，会显示诊断信息

**如果看到错误**：
1. **Prisma Client 错误**: 运行 `npx prisma generate`
2. **WordPress 连接错误**: 检查 `WP_BASE_URL` 和网络连接
3. **认证错误**: 检查 `WP_AUTH_*` 配置
4. **字段缺失**: 查看诊断报告，使用提供的 curl 命令验证

### 3.2 实际同步测试（可选）

如果 Dry Run 成功，可以尝试实际同步这 20 条记录到数据库：

```bash
npm run sync:profile-to-school -- --sample 20
```

**这一步会**：
- 实际将 20 条记录写入数据库
- 可以验证数据库操作是否正常

### 3.3 验证抽样结果

使用 Prisma Studio 查看数据库：

```bash
npx prisma studio
```

在浏览器中：
1. 打开 `School` 表
2. 检查是否有新记录（或更新的记录）
3. 验证字段是否正确填充
4. 检查 `wpId` 是否正确关联

**检查要点**：
- ✅ 记录数量是否正确（应该与抽样数量一致）
- ✅ `wpId` 字段是否正确
- ✅ ACF 字段（`nameEnglish`, `nameShort` 等）是否正确
- ✅ Taxonomy 字段（`profileType`, `country`, `location` 等）是否正确

## 🔍 步骤 4: 分析抽样报告

### 4.1 检查失败率

查看输出中的失败率：

```
失败率: 10.0%
```

- ✅ **失败率 < 10%**: 可以继续完整同步
- ⚠️ **失败率 >= 10%**: 需要先解决问题

### 4.2 检查缺失字段

查看 "缺失字段统计" 部分：

```
缺失字段统计:
  profileType: 3 条记录缺失
  nameEnglish: 2 条记录缺失
```

**评估标准**：
- ✅ **少量缺失（< 20%）**: 正常，可能是某些记录确实没有该字段
- ⚠️ **大量缺失（> 50%）**: 需要检查 WordPress 配置

**常见问题**：
- 如果所有记录都缺少 `profileType`（或 `school_profile_type`），可能是 ACF 配置问题
- 使用报告中提供的 curl 命令验证

### 4.3 查看诊断详情

如果有字段缺失，查看 "字段缺失诊断详情"：

```
字段缺失诊断详情（前 5 条）:
  WP Post ID 123 (example-school):
    字段: profileType
      状态: 不存在
      可能原因: ACF 字段 "school_profile_type" 不存在
      验证命令: curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' ...
```

**操作**：
1. 复制 curl 命令并运行
2. 检查 API 返回的数据
3. 根据诊断建议修复问题

## ✅ 步骤 5: 解决问题（如果需要）

### 问题 1: ACF 字段缺失

**症状**: 所有记录的某个 ACF 字段都为 null

**解决方案**：
1. 检查 ACF to REST API 插件是否已安装并启用
2. 检查 ACF 字段是否设置了 `show_in_rest = true`
3. 在 WordPress 后台验证字段是否存在

**验证**：
```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.acf'
```

### 问题 2: Taxonomy 字段缺失

**症状**: taxonomy 字段（如 `country`, `location`）为 null

**解决方案**：
1. 检查 WordPress 后台，该 post 是否分配了 taxonomy terms
2. 检查 taxonomy 是否已注册到 `profile` post type
3. 验证 REST API 是否返回 taxonomy 数据

**验证**：
```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '._embedded."wp:term"'
```

### 问题 3: 认证失败

**症状**: 输出认证错误（401/403）

**解决方案**：
1. 检查 `WP_AUTH_TYPE` 配置是否正确
2. 验证用户名/密码/Token 是否正确
3. 如果使用 Application Password，确保已正确生成

### 问题 4: 连接失败

**症状**: 无法连接到 WordPress

**解决方案**：
1. 检查 `WP_BASE_URL` 是否正确
2. 验证 WordPress 站点是否运行
3. 检查防火墙/网络设置

**验证**：
```bash
curl http://localhost:3000/wp-json/wp/v2
```

## 🚀 步骤 6: 运行完整同步

当抽样测试通过且没有严重问题时，可以运行完整同步：

### 6.1 最后一次 Dry Run（可选但推荐）

```bash
npm run sync:profile-to-school -- --dry-run
```

这会同步**所有**数据，但不会修改数据库。检查输出确认一切正常。

### 6.2 正式同步

```bash
npm run sync:profile-to-school
```

**这一步会**：
- 同步所有 WordPress profile posts 到数据库
- 执行完整的 upsert 操作
- 生成详细的同步报告

**预计时间**：
- 100 条记录: 约 1-2 分钟
- 500 条记录: 约 5-10 分钟
- 1000 条记录: 约 10-20 分钟

**输出示例**：
```
[INFO] 开始拉取 WordPress posts...
[INFO] 拉取到 150 条 posts
[INFO] 开始处理 posts...
[INFO] 进度: 10/150 (6.7%)
[INFO] 进度: 20/150 (13.3%)
...
[INFO] ✅ 同步完成！请运行 npx prisma studio 验证数据
```

## ✅ 步骤 7: 验证完整同步结果

### 7.1 使用 Prisma Studio

```bash
npx prisma studio
```

**检查项**：
1. ✅ 打开 `School` 表
2. ✅ 检查记录总数（应该与 WordPress 中的 profile 数量一致）
3. ✅ 检查关键字段是否都有值
4. ✅ 检查 `wpId` 是否正确关联
5. ✅ 检查是否有重复记录

### 7.2 检查同步摘要

查看脚本输出的摘要：

```
═══════════════════════════════════════════════════════════
同步摘要 (Sync Summary)
═══════════════════════════════════════════════════════════
总共拉取: 150 条记录
成功同步: 148 条
创建新记录: 145 条
更新记录: 3 条
跳过: 0 条
错误: 2 条
缺失字段: 5 条记录
```

**评估**：
- ✅ **成功同步率 > 95%**: 很好
- ⚠️ **成功同步率 < 90%**: 需要检查错误

### 7.3 检查错误记录

如果有错误，查看 "错误详情"：

```
错误详情:
  WP Post ID 123: Database connection error
  WP Post ID 456: Invalid field value
```

**操作**：
1. 查看错误详情
2. 使用单条调试模式验证：
   ```bash
   npm run sync:profile-to-school -- --id 123
   ```

### 7.4 检查缺失字段

如果有缺失字段，查看详细信息并决定是否需要修复：

```
缺失字段详情（前 10 条）:
  WP Post ID 123 - 字段 "profileType":
    可能原因: ACF 字段未设置 show_in_rest
    验证命令: curl ...
```

## 🔄 步骤 8: 增量同步（后续使用）

同步脚本是**幂等的**，可以安全地重复运行。后续如果需要更新数据：

```bash
# 直接运行完整同步（会自动更新现有记录）
npm run sync:profile-to-school
```

脚本会：
- ✅ 使用 `wpId` 作为唯一标识
- ✅ 如果记录存在则更新，不存在则创建
- ✅ 不会创建重复记录

## 📊 步骤 9: 查看日志（可选）

如果配置了日志文件（`LOG_FILE_PATH`），可以查看：

```bash
# 查看日志
tail -f logs/sync-profile-to-school.log

# 查看审计日志（JSONL 格式）
cat logs/sync-profile-to-school.jsonl | jq '.'
```

## 🆘 故障排除

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `Prisma schema file not found` | Prisma schema 路径错误 | 检查 `PRISMA_SCHEMA_PATH` 或确保文件存在 |
| `Failed to connect to database` | 数据库连接失败 | 检查 `DATABASE_URL` |
| `WordPress REST API 连接失败` | WordPress 不可访问 | 检查 `WP_BASE_URL` 和网络连接 |
| `Profile endpoint 不存在 (404)` | Post type 未注册到 REST API | 在 WordPress 中注册 post type |
| `Authentication failed: 401` | 认证信息错误 | 检查认证配置 |

### 获取帮助

1. 查看 `README.md` 中的故障排除章节
2. 查看 `DIAGNOSIS_EXAMPLE.md` 中的诊断示例
3. 检查日志文件获取详细错误信息
4. 使用单条调试模式验证特定 post：
   ```bash
   npm run sync:profile-to-school -- --id <post-id>
   ```

## 📝 快速参考

### 常用命令

```bash
# 1. 生成 Prisma Client
npx prisma generate

# 2. 抽样测试（dry-run）
npm run sync:profile-to-school -- --sample 20 --dry-run

# 3. 抽样测试（实际同步）
npm run sync:profile-to-school -- --sample 20

# 4. 完整同步（dry-run）
npm run sync:profile-to-school -- --dry-run

# 5. 完整同步
npm run sync:profile-to-school

# 6. 单条调试
npm run sync:profile-to-school -- --id 123

# 7. 查看数据库
npx prisma studio
```

### 验证命令

```bash
# 测试 WordPress REST API
curl http://localhost:3000/wp-json/wp/v2/profile?per_page=1

# 查看单个 post
curl http://localhost:3000/wp-json/wp/v2/profile/123?_embed

# 查看 ACF 字段
curl http://localhost:3000/wp-json/wp/v2/profile/123?_embed | jq '.acf'

# 查看 Taxonomy
curl http://localhost:3000/wp-json/wp/v2/profile/123?_embed | jq '._embedded."wp:term"'
```

## ✅ 完成检查清单

- [ ] 环境变量已配置
- [ ] Prisma Client 已生成
- [ ] 抽样测试通过（dry-run）
- [ ] 抽样测试通过（实际同步）
- [ ] 已验证数据库中的抽样数据
- [ ] 已解决所有发现的问题
- [ ] 完整同步已完成
- [ ] 已验证完整同步结果
- [ ] 已查看错误和缺失字段（如果有）

---

**下一步**: 如果所有步骤都成功完成，同步脚本已准备就绪，可以用于日常数据同步！

