# 实现说明

本文档说明了同步脚本的实现细节和架构设计。

## 架构设计

脚本采用模块化设计，各模块职责清晰：

```
index.ts (主入口)
├── config.ts (配置管理)
├── logger.ts (日志系统)
├── wordpress-client.ts (WordPress API 客户端)
├── field-extractor.ts (字段提取，不支持 fallback)
├── diagnosis.ts (字段诊断)
└── prisma-sync.ts (数据库同步)
```

## 核心特性实现

### 1. 不支持 Fallback

脚本严格遵循"不支持 fallback"的原则：

- 字段提取模块 (`field-extractor.ts`) 只从指定路径提取字段
- 如果字段不存在或为 null，直接返回 null，不使用其他字段替代
- 所有字段提取结果都包含 `present` 标志，明确指示字段是否存在于 API 响应中

### 2. 详细错误诊断

诊断模块 (`diagnosis.ts`) 会分析字段缺失的原因：

- **ACF 对象缺失**: 检查 `post.acf` 是否存在
- **字段不存在**: 检查字段路径是否正确
- **Taxonomy 未关联**: 检查 post 是否关联了 taxonomy terms
- **认证问题**: 检查 API 响应状态码

每个诊断都会提供：
- 可能的原因列表
- 建议的操作步骤
- curl 命令用于验证

### 3. 多种认证方式

WordPress 客户端支持四种认证方式：

- **无认证**: 适用于公开站点
- **Basic Auth**: 传统用户名/密码
- **Bearer Token**: JWT 或 OAuth token
- **WordPress Application Password**: WordPress 5.6+ 的应用程序密码

### 4. 重试机制

使用指数退避策略：

- 初始延迟: `RETRY_DELAY` (默认 1000ms)
- 每次重试延迟翻倍
- 最大重试次数: `MAX_RETRIES` (默认 5)
- 认证错误 (401/403) 不重试

### 5. 幂等操作

数据库同步使用 Prisma transaction 确保原子性：

- 使用 `wpId` 作为唯一标识
- 如果记录存在则更新，不存在则创建
- 使用事务确保操作原子性，失败时自动回滚

### 6. 完整的日志和审计

- **控制台日志**: 实时显示进度和错误
- **文件日志**: 可选的持久化日志文件
- **JSONL 审计日志**: 每行一个 JSON 对象，包含完整的同步记录

## 字段映射说明

### 当前映射

根据 Prisma schema 中的 `School` 模型，当前实现映射到以下字段：

| WordPress 字段 | 数据库字段 | 类型 | 说明 |
|---------------|-----------|------|------|
| `acf.name_english` | `nameEnglish` | ACF | 学校英文名 |
| `acf.name_short` | `nameShort` | ACF | 学校简称 |
| `acf.school_profile_type` | `profileType` | ACF | **注意：映射到现有字段** |
| `taxonomy.profile_type` | `profileType` | Taxonomy | 从 taxonomy 获取（如果 ACF 没有） |
| `taxonomy.band-type` | `bandType` | Taxonomy | 学校类型 |
| `taxonomy.country` | `country` | Taxonomy | 国家 |
| `taxonomy.location` | `location` | Taxonomy | 位置 |
| `post.id` | `wpId` | Post Field | WordPress Post ID |

### 关于 schoolProfileType 字段

根据用户需求，`acf.school_profile_type` 应映射到 `school.schoolProfileType`。但是，当前 Prisma schema 中没有 `schoolProfileType` 字段，只有 `profileType` 字段。

**当前实现**: 暂时映射到现有的 `profileType` 字段。

**如果需要独立的 schoolProfileType 字段**，可以：

1. 更新 Prisma schema:
   ```prisma
   model School {
     // ... 现有字段
     profileType            String?  // 从 taxonomy 获取
     schoolProfileType      String?  // 从 ACF 获取
     // ...
   }
   ```

2. 更新 `prisma-sync.ts` 中的映射:
   ```typescript
   case 'schoolProfileType':
     data.schoolProfileType = extracted.value;
     break;
   ```

3. 运行迁移:
   ```bash
   npx prisma migrate dev --name add_school_profile_type
   npx prisma generate
   ```

## 数据流

```
WordPress REST API
    ↓
wordpress-client.ts (获取 posts)
    ↓
field-extractor.ts (提取字段，不支持 fallback)
    ↓
diagnosis.ts (诊断缺失字段)
    ↓
prisma-sync.ts (转换并写入数据库)
    ↓
Prisma Database
```

## 配置系统

配置通过环境变量加载，支持：

- 从项目根目录的 `.env` 文件加载
- 命令行参数覆盖（如 `--dry-run`、`--id`）
- 类型安全的配置接口
- 配置验证（启动时检查必需配置）

## 错误处理策略

1. **配置错误**: 启动时验证，立即退出
2. **网络错误**: 自动重试（指数退避）
3. **认证错误**: 不重试，立即报告
4. **数据库错误**: 记录错误，继续处理其他记录
5. **字段缺失**: 不是错误，记录诊断信息

## 性能优化

1. **批量处理**: 支持配置批次大小
2. **并发控制**: 限制并发写入数（避免数据库连接池耗尽）
3. **分页获取**: WordPress API 支持分页，避免一次性加载所有数据
4. **连接复用**: Prisma Client 自动管理连接池

## 测试策略

脚本内置了多种测试场景（见 README.md）：

1. **正常同步**: 验证所有字段正确同步
2. **部分字段为空**: 验证诊断功能
3. **ACF 未公开**: 验证错误检测
4. **认证失败**: 验证认证错误处理
5. **网络不稳定**: 验证重试机制
6. **Dry Run**: 验证不会修改数据库

## 扩展性

脚本设计易于扩展：

- **添加新字段**: 在 `config.ts` 中添加字段映射
- **添加新认证方式**: 在 `wordpress-client.ts` 中添加认证逻辑
- **自定义诊断**: 在 `diagnosis.ts` 中添加诊断规则
- **自定义日志格式**: 在 `logger.ts` 中修改日志格式

## 安全考虑

1. **敏感信息**: 认证信息通过环境变量配置，不硬编码
2. **输入验证**: 所有配置在启动时验证
3. **SQL 注入**: 使用 Prisma ORM，自动防止 SQL 注入
4. **连接安全**: 支持 HTTPS 和认证

## 已知限制

1. **ACF 字段路径**: 目前假设 ACF 字段是扁平的或使用下划线分隔，如果使用嵌套对象结构可能需要调整
2. **多语言支持**: 如果使用多语言插件，需要手动添加语言参数
3. **缓存处理**: WordPress 端的缓存需要手动清除或使用 cache-bust 参数

## 未来改进

可能的改进方向：

1. 支持自定义字段提取器插件
2. 支持增量同步（只同步更新的记录）
3. 支持多语言自动检测
4. 支持更多认证方式（OAuth2 等）
5. 支持 Webhook 触发同步
6. 支持同步历史记录查询

