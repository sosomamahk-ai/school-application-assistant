# WordPress Profile 到 School 同步脚本

这是一个稳定的同步脚本，用于从 WordPress 的 custom post type `profile` 拉取 ACF post meta 和 taxonomy terms，并同步到 Prisma 的 `school` 表。

## 特性

- ✅ **不支持 fallback**：字段缺失时记录诊断信息，不使用其他字段替代
- ✅ **详细错误分析**：当字段为 null 时，自动分析可能原因并提供排查建议
- ✅ **多种认证方式**：支持无认证、Basic Auth、Bearer Token、WordPress Application Password
- ✅ **完整的日志和审计**：支持控制台和文件日志，输出 JSONL 格式的审计日志
- ✅ **幂等操作**：使用 upsert 确保可重复运行
- ✅ **重试机制**：网络错误时自动重试（指数退避）
- ✅ **Dry Run 模式**：测试模式下不修改数据库，只输出将要执行的操作

## 🎲 抽样同步模式（推荐）

在同步全部数据之前，强烈建议先使用抽样模式进行测试：

```bash
# 抽样 20 条记录，不修改数据库（推荐首次运行）
npm run sync:profile-to-school -- --sample 20 --dry-run
```

抽样模式会：
- 随机抽取指定数量的 WordPress posts
- 执行完整的同步流程（字段提取、taxonomy、诊断、upsert）
- 生成详细的诊断报告
- 如果失败率超过阈值（默认 10%），会输出警告

抽样模式的好处：
- 快速验证脚本逻辑是否正确
- 检查 ACF 字段是否能正确获取
- 验证 taxonomy 解析是否正常
- 确认 API 认证是否有效
- 在同步大量数据前发现潜在问题

详见 [抽样同步说明](#抽样同步模式详细说明)

## 快速开始

### 1. 安装依赖

确保项目已安装以下依赖：

```bash
npm install @prisma/client prisma node-fetch dotenv
```

### 2. 配置环境变量

复制 `.env.example` 到项目根目录的 `.env` 文件（如果还没有），并根据实际情况配置：

```bash
cp scripts/sync-profile-to-school/.env.example .env
```

编辑 `.env` 文件，至少配置以下必需项：

```env
WP_BASE_URL=http://localhost:3000
WP_API_PROFILE_ENDPOINT=/wp-json/wp/v2/profile
WP_AUTH_TYPE=none  # 或 basic, bearer, wp-app-password
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### 3. 生成 Prisma Client

```bash
npx prisma generate
```

### 4. 运行同步

**正常模式（会修改数据库）:**

```bash
npm run sync:profile-to-school
```

**Dry Run 模式（不修改数据库）:**

```bash
npm run sync:profile-to-school -- --dry-run
```

**单条调试模式:**

```bash
npm run sync:profile-to-school -- --id 123
```

**抽样同步模式（推荐在正式同步前使用）:**

```bash
# 抽样 20 条记录进行测试（不修改数据库）
npm run sync:profile-to-school -- --sample 20 --dry-run

# 抽样 20 条记录进行测试（会修改数据库）
npm run sync:profile-to-school -- --sample 20
```

## 配置说明

### WordPress 配置

- `WP_BASE_URL`: WordPress 站点基础 URL（例如: `http://localhost:3000`）
- `WP_API_PROFILE_ENDPOINT`: Profile post type 的 REST API 端点（默认: `/wp-json/wp/v2/profile`）

### 认证配置

支持四种认证方式，通过 `WP_AUTH_TYPE` 选择：

#### 1. 无认证（公开站点）

```env
WP_AUTH_TYPE=none
```

#### 2. Basic Auth

```env
WP_AUTH_TYPE=basic
WP_AUTH_USERNAME=your-username
WP_AUTH_PASSWORD=your-password
```

#### 3. Bearer Token

```env
WP_AUTH_TYPE=bearer
WP_AUTH_TOKEN=your-token-here
```

#### 4. WordPress Application Password

```env
WP_AUTH_TYPE=wp-app-password
WP_AUTH_USERNAME=your-wordpress-username
WP_AUTH_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

> 在 WordPress 后台：用户 → 个人资料 → 应用程序密码，可以生成 Application Password。

### 批次和性能配置

- `BATCH_SIZE`: 每次从 WP 拉取的批次大小（默认: 50）
- `MAX_CONCURRENCY`: 最大并发写入数（默认: 5）
- `REQUEST_TIMEOUT`: 请求超时时间（毫秒，默认: 30000）
- `MAX_RETRIES`: 最大重试次数（默认: 5）
- `RETRY_DELAY`: 初始重试延迟（毫秒，默认: 1000）

### 日志配置

- `LOG_LEVEL`: 日志级别（debug, info, warn, error，默认: info）
- `LOG_FILE_PATH`: 日志文件路径（可选，例如: `logs/sync.log`）

## 字段映射

### 默认字段映射

脚本默认会同步以下字段：

#### ACF Post Meta

- `acf.name_english` → `school.nameEnglish`
- `acf.name_short` → `school.nameShort`
- `acf.school_profile_type` → `school.profileType`

#### Taxonomy Terms

- `taxonomy.profile_type` → `school.profileType` (使用 term slug)
- `taxonomy.band-type` → `school.bandType` (使用 term slug)
- `taxonomy.country` → `school.country` (使用 term name)
- `taxonomy.location` → `school.location` (使用 term name)

#### Post 字段

- `post.id` → `school.wpId`
- `post.slug` → (用于标识，不存储到数据库)

### 自定义字段映射

可以在 `config.ts` 中的 `getDefaultFieldMappings()` 和 `getDefaultTaxonomyMappings()` 函数中自定义映射规则。

## 字段诊断

当字段缺失或为 null 时，脚本会自动诊断可能的原因：

### 常见问题及解决方案

#### 1. ACF 字段不存在

**症状**: 所有 profile 的 `school_profile_type` 都为 null

**可能原因**:
- ACF to REST API 插件未安装或未启用
- ACF 字段未设置 `show_in_rest = true`
- ACF 字段名称不匹配（大小写、下划线等）

**解决方案**:

1. 安装并启用 ACF to REST API 插件：
   ```bash
   # 在 WordPress 后台安装插件
   # 或在 wp-content/plugins/ 目录下载并激活
   ```

2. 检查 ACF 字段设置：
   - 进入 ACF 字段组编辑页面
   - 确保字段的 "Return Format" 已正确配置
   - 确保字段组已分配给 `profile` post type

3. 验证字段名称：
   ```bash
   curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.acf'
   ```

#### 2. Taxonomy Terms 未关联

**症状**: `country` 或 `location` 字段为 null

**可能原因**:
- Taxonomy 未注册到 `profile` post type
- Post 未分配该 taxonomy 的 term

**解决方案**:

1. 检查 taxonomy 是否已注册：
   ```bash
   curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '._embedded."wp:term"'
   ```

2. 在 WordPress 后台为 post 分配 taxonomy terms

#### 3. 多语言插件影响

**症状**: 某些字段在某些语言版本下为空

**可能原因**:
- 使用了 WPML 或 Polylang
- 当前语言的字段未填写

**解决方案**:

1. 检查主语言版本的字段是否有值
2. 或使用 REST API 时指定语言参数：
   ```bash
   curl 'http://localhost:3000/wp-json/wp/v2/profile/123?lang=zh&_embed'
   ```

#### 4. 缓存问题

**症状**: API 返回的数据不是最新的

**解决方案**:

1. 清除 WordPress 缓存
2. 在请求中添加缓存破坏参数：
   ```bash
   curl 'http://localhost:3000/wp-json/wp/v2/profile/123?cache-bust=1234567890&_embed'
   ```

## 验证步骤

### 1. 运行同步

```bash
npm run sync:profile-to-school
```

### 2. 查看同步摘要

脚本会输出同步摘要，包括：
- 总共拉取的数量
- 成功同步的数量
- 创建/更新的数量
- 错误数量
- 缺失字段数量

### 3. 使用 Prisma Studio 验证

```bash
npx prisma studio
```

在 Prisma Studio 中：
1. 打开 `School` 表
2. 检查记录数量是否与同步数量一致
3. 检查字段值是否正确填充

### 4. 检查日志

如果配置了 `LOG_FILE_PATH`，可以查看日志文件：

```bash
tail -f logs/sync-profile-to-school.log
```

查看 JSONL 格式的审计日志：

```bash
cat logs/sync-profile-to-school.jsonl | jq '.'
```

## 抽样同步模式详细说明

### 使用方式

```bash
# 抽样 20 条记录，dry-run 模式（推荐）
npm run sync:profile-to-school -- --sample 20 --dry-run

# 抽样 20 条记录，实际同步
npm run sync:profile-to-school -- --sample 20

# 抽样 50 条记录
npm run sync:profile-to-school -- --sample 50
```

### 工作原理

1. **获取所有 Post IDs**: 使用轻量查询（`_fields=id`）获取所有 profile post IDs
2. **随机抽样**: 使用 Fisher-Yates 算法随机选择指定数量的 IDs
3. **获取详细信息**: 对抽样的 IDs 逐条请求完整信息（包括 `_embed`）
4. **执行同步流程**: 复用所有组件（字段提取、诊断、数据库同步）
5. **生成报告**: 输出详细的抽样报告

### 抽样报告内容

抽样报告包含：

- **抽样数量**: 实际抽样的记录数
- **总可用记录数**: WordPress 中所有可用的 profile 数量
- **成功同步数量**: 成功 upsert 的记录数
- **失败数量**: 失败的记录数
- **缺失字段统计**: 每个字段缺失的记录数
- **失败率**: 失败记录占总记录的比例
- **字段缺失诊断**: 每条记录缺失字段的详细诊断
- **警告信息**: 如果失败率超过阈值（默认 10%），会显示警告

### 示例输出

```
═══════════════════════════════════════════════════════════
🎲 抽样同步模式 (Sample Sync Mode)
═══════════════════════════════════════════════════════════
抽样数量: 20
⚠️  Dry Run 模式：不会实际修改数据库
开始获取随机样本...

[INFO] 获取所有 profile post IDs...
[INFO] 总可用记录数: 150
[INFO] 随机抽取的 IDs: 23, 45, 67, 89, 123, ...

═══════════════════════════════════════════════════════════
抽样同步报告 (Sample Sync Report)
═══════════════════════════════════════════════════════════
抽样数量: 20
总可用记录数: 150
成功同步数量: 18
失败数量: 2
缺失字段记录数: 5
失败率: 10.0%

缺失字段统计:
  profileType: 3 条记录缺失
  nameEnglish: 2 条记录缺失

⚠️  警告:
  失败率 10.0% 超过阈值 10%

字段缺失诊断详情（前 5 条）:
  WP Post ID 23 (example-school):
    字段: profileType
      状态: 不存在
      可能原因: ACF 字段 "school_profile_type" 不存在
      验证命令: curl 'http://localhost:3000/wp-json/wp/v2/profile/23?_embed' ...

📋 下一步操作:
✅ Dry Run 模式：未实际修改数据库
如需继续同步全部 profile，请运行:
  npm run sync:profile-to-school
```

### 失败率阈值

默认失败率阈值为 10%。如果失败率超过阈值，脚本会：

1. 输出醒目的警告
2. 建议在同步全部数据前检查 WordPress 配置
3. 提供诊断详情和验证命令

可以通过环境变量自定义阈值：

```env
SAMPLE_FAILURE_THRESHOLD=0.15  # 15% 阈值
```

### 手动确认

抽样模式结束后，脚本**不会自动继续**同步全部数据。需要手动执行：

```bash
npm run sync:profile-to-school
```

这可以避免在发现问题时误写大量错误数据。

## 测试用例

### 测试 1: 正常同步

**前置条件**: WP 上存在 profile 且包含所有字段

**步骤**:
1. 运行 `npm run sync:profile-to-school`
2. 检查输出：应显示成功同步的数量
3. 使用 Prisma Studio 验证数据

**预期结果**: 所有字段正确同步到数据库

### 测试 2: 部分字段为空

**前置条件**: WP 上存在 profile，但部分 ACF 字段为空

**步骤**:
1. 运行 `npm run sync:profile-to-school`
2. 检查诊断报告：应显示缺失字段的分析

**预期结果**: 
- 脚本成功运行，不报错
- 诊断报告中列出缺失字段和可能原因
- 数据库中的对应字段为 null（不使用其他字段 fallback）

### 测试 3: ACF 未公开

**前置条件**: ACF to REST API 插件未安装或未启用

**步骤**:
1. 运行 `npm run sync:profile-to-school`
2. 检查诊断报告

**预期结果**:
- 脚本检测到 ACF 对象不存在
- 诊断报告中提供安装/启用 ACF to REST API 的步骤
- 提供 curl 命令用于验证

### 测试 4: 认证失败

**前置条件**: 配置了错误的认证信息

**步骤**:
1. 配置错误的 `WP_AUTH_USERNAME` 或 `WP_AUTH_PASSWORD`
2. 运行 `npm run sync:profile-to-school`

**预期结果**:
- 脚本在连接测试阶段失败
- 输出认证错误的详细信息
- 提供 curl 命令示例用于验证认证

### 测试 5: 网络不稳定

**前置条件**: 模拟网络不稳定（可以临时断开网络）

**步骤**:
1. 运行 `npm run sync:profile-to-school`
2. 观察重试行为

**预期结果**:
- 脚本自动重试失败的请求
- 使用指数退避策略（延迟逐渐增加）
- 最终成功或达到最大重试次数后报错

### 测试 6: Dry Run 模式

**步骤**:
1. 运行 `npm run sync:profile-to-school -- --dry-run`
2. 检查输出

**预期结果**:
- 脚本运行但不修改数据库
- 输出所有将要执行的变更
- 显示 "DRY RUN 模式：未实际修改数据库"

## Curl 验证示例

### 无认证

```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.'
```

### Basic Auth

```bash
curl -u 'username:password' 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.'
```

### Bearer Token

```bash
curl -H 'Authorization: Bearer your-token' 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.'
```

### WordPress Application Password

```bash
curl -u 'username:xxxx-xxxx-xxxx-xxxx' 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.'
```

### 查看 ACF 字段

```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.acf'
```

### 查看 Taxonomy Terms

```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '._embedded."wp:term"'
```

### 查看所有 Profile Posts

```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile?per_page=10&_embed' | jq '.[] | {id, slug, title: .title.rendered}'
```

## 常见错误及解决方案

### 错误: Prisma Client 验证失败

**解决方案**:
```bash
npx prisma generate
```

### 错误: WordPress REST API 连接失败

**检查清单**:
1. `WP_BASE_URL` 是否正确
2. WordPress 站点是否运行
3. REST API 是否已启用
4. 防火墙/代理是否阻止连接

### 错误: Profile endpoint 不存在 (404)

**解决方案**:
1. 检查 post type `profile` 是否已注册
2. 检查 post type 是否设置了 `show_in_rest = true`
3. 验证端点 URL 是否正确

### 错误: 认证失败 (401/403)

**解决方案**:
1. 检查认证配置是否正确
2. 验证用户名/密码/Token 是否有效
3. 检查 WordPress 用户权限
4. 如果使用 Application Password，确保已正确生成

### 错误: 字段为 null

这不是错误，但需要诊断。参考 "字段诊断" 章节。

## 日志格式

### 控制台日志

```
[2024-01-01T12:00:00.000Z] [INFO] 开始拉取 WordPress posts...
[2024-01-01T12:00:01.000Z] [INFO] 拉取到 100 条 posts
[2024-01-01T12:00:02.000Z] [WARN] Post ID 123 字段诊断: ...
```

### JSONL 审计日志

每行一个 JSON 对象，包含完整的同步记录：

```json
{
  "wpPostId": 123,
  "wpPostSlug": "example-school",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "fetchedFields": {
    "nameEnglish": {
      "value": "Example School",
      "source": "acf",
      "present": true,
      "path": ["acf", "name_english"]
    }
  },
  "dbStatus": "updated",
  "dbId": "clx123...",
  "diagnoses": []
}
```

## 扩展和自定义

### 添加新字段映射

编辑 `config.ts`:

```typescript
function getDefaultFieldMappings(): FieldMapping[] {
  return [
    // ... 现有映射
    {
      wpField: 'new_field',
      dbField: 'newField',
      type: 'acf',
      required: false,
    },
  ];
}
```

### 添加新 Taxonomy 映射

编辑 `config.ts`:

```typescript
function getDefaultTaxonomyMappings(): TaxonomyMapping[] {
  return [
    // ... 现有映射
    {
      wpTaxonomy: 'new_taxonomy',
      dbField: 'newTaxonomy',
      termResolver: 'name',
    },
  ];
}
```

### 自定义诊断逻辑

编辑 `diagnosis.ts` 中的 `diagnoseMissingField` 函数。

## 许可证

本项目使用 ISC 许可证。

## 支持

如有问题或建议，请提交 Issue 或 Pull Request。

