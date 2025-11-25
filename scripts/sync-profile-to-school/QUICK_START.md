# 快速开始指南

## 5 分钟快速开始

### 1. 配置环境变量

在项目根目录的 `.env` 文件中添加以下配置（如果还没有）：

```env
# WordPress 配置
WP_BASE_URL=http://localhost:3000
WP_API_PROFILE_ENDPOINT=/wp-json/wp/v2/profile

# 认证配置（选择一种）
WP_AUTH_TYPE=none  # 公开站点无需认证

# 数据库连接（已有）
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# 可选配置
BATCH_SIZE=50
DRY_RUN=false
LOG_LEVEL=info
```

### 2. 生成 Prisma Client

```bash
npx prisma generate
```

### 3. 运行抽样同步（推荐，快速验证）

```bash
# 抽样 20 条记录进行测试（不修改数据库）
npm run sync:profile-to-school -- --sample 20 --dry-run
```

### 4. 如果抽样结果正常，运行真实同步

```bash
npm run sync:profile-to-school
```

### 5. 验证结果

```bash
npx prisma studio
```

在 Prisma Studio 中打开 `School` 表，检查数据是否正确同步。

## 常用命令

```bash
# 抽样同步（推荐：快速验证，不修改数据库）
npm run sync:profile-to-school -- --sample 20 --dry-run

# 抽样同步（实际同步到数据库）
npm run sync:profile-to-school -- --sample 20

# Dry Run 模式（测试全部数据，不修改数据库）
npm run sync:profile-to-school -- --dry-run

# 正常同步（同步全部数据）
npm run sync:profile-to-school

# 同步单个 post（调试用）
npm run sync:profile-to-school -- --id 123
```

# 查看日志（如果配置了日志文件）
tail -f logs/sync-profile-to-school.log
```

## 故障排除

### 问题：Prisma Client 错误

```bash
# 解决：重新生成 Prisma Client
npx prisma generate
```

### 问题：WordPress 连接失败

1. 检查 `WP_BASE_URL` 是否正确
2. 检查 WordPress 站点是否运行
3. 测试 API 端点：
   ```bash
   curl http://localhost:3000/wp-json/wp/v2/profile
   ```

### 问题：字段为 null

这不是错误，但需要诊断。查看脚本输出的诊断报告，或参考 `DIAGNOSIS_EXAMPLE.md`。

## 下一步

- 阅读完整的 `README.md` 了解详细配置
- 查看 `DIAGNOSIS_EXAMPLE.md` 了解字段诊断
- 自定义字段映射（编辑 `config.ts`）

