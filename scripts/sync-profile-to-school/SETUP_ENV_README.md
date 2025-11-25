# 环境变量自动配置工具

## 简介

`setup-env.ts` 是一个交互式环境变量配置工具，可以自动检查和配置 WordPress Profile 同步脚本所需的环境变量。

## 使用方法

### 运行配置脚本

```bash
npm run sync:profile-to-school:setup
```

或者直接运行：

```bash
ts-node --project tsconfig.scripts.json scripts/sync-profile-to-school/setup-env.ts
```

### 配置流程

脚本会引导您完成以下步骤：

1. **检查现有配置**
   - 如果找到 `.env` 文件，会检查是否已有同步脚本配置
   - 如果已有配置，询问是否更新

2. **配置 WordPress 基础设置**
   - `WP_BASE_URL`: WordPress 站点 URL
   - `WP_API_PROFILE_ENDPOINT`: REST API 端点

3. **配置认证方式**
   - 选择认证类型（none, basic, bearer, wp-app-password）
   - 根据选择的类型，配置相应的认证信息

4. **配置可选设置**
   - 批次大小
   - 日志级别
   - 抽样失败率阈值

5. **检查数据库配置**
   - 如果缺少 `DATABASE_URL`，会询问是否配置

### 示例交互

```
═══════════════════════════════════════════════════════════
WordPress Profile 同步脚本 - 环境变量配置工具
═══════════════════════════════════════════════════════════

✅ 找到现有的 .env 文件

开始配置环境变量...

WordPress 站点基础 URL * [http://localhost:3000]: http://localhost:3000
Profile post type 的 REST API 端点 [/wp-json/wp/v2/profile]: 
认证类型 (none, basic, bearer, wp-app-password) * [none]: none
批次大小 [50]: 
日志级别 (debug, info, warn, error) [info]: 
抽样失败率阈值 (0.1 = 10%) [0.1]: 

正在保存配置...

═══════════════════════════════════════════════════════════
✅ 配置完成！
═══════════════════════════════════════════════════════════

配置文件已保存到: /path/to/.env

下一步:
  1. 检查 .env 文件确认配置正确
  2. 运行: npx prisma generate
  3. 运行抽样测试: npm run sync:profile-to-school -- --sample 20 --dry-run
```

## 配置项说明

### 必需配置

| 变量 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `WP_BASE_URL` | WordPress 站点 URL | `http://localhost:3000` | `https://example.com` |
| `WP_AUTH_TYPE` | 认证类型 | `none` | `basic`, `bearer`, `wp-app-password` |

### 可选配置

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `WP_API_PROFILE_ENDPOINT` | REST API 端点 | `/wp-json/wp/v2/profile` |
| `BATCH_SIZE` | 批次大小 | `50` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `SAMPLE_FAILURE_THRESHOLD` | 抽样失败率阈值 | `0.1` (10%) |

### 认证相关配置

根据选择的 `WP_AUTH_TYPE`，可能需要配置：

#### Basic Auth (`WP_AUTH_TYPE=basic`)
- `WP_AUTH_USERNAME`: 用户名
- `WP_AUTH_PASSWORD`: 密码

#### Bearer Token (`WP_AUTH_TYPE=bearer`)
- `WP_AUTH_TOKEN`: Bearer Token

#### WordPress Application Password (`WP_AUTH_TYPE=wp-app-password`)
- `WP_AUTH_USERNAME`: WordPress 用户名
- `WP_AUTH_APP_PASSWORD`: Application Password

## 验证配置

配置完成后，可以验证配置是否正确：

```bash
# 检查 .env 文件
cat .env | grep WP_

# 测试 WordPress 连接
curl http://localhost:3000/wp-json/wp/v2
```

## 更新配置

如果需要更新配置，再次运行配置脚本：

```bash
npm run sync:profile-to-school:setup
```

脚本会检测到现有配置，询问是否更新。

## 手动配置

如果不想使用交互式工具，也可以手动编辑 `.env` 文件。参考 `TEST_AND_SYNC_STEPS.md` 中的配置说明。

## 故障排除

### 问题: 配置文件未保存

**解决方案**:
- 检查文件权限
- 确保项目根目录可写
- 检查磁盘空间

### 问题: 配置验证失败

**解决方案**:
- 检查输入值的格式
- 确认 URL 以 `http://` 或 `https://` 开头
- 确认认证类型拼写正确

### 问题: DATABASE_URL 未配置

**解决方案**:
- 可以稍后手动添加到 `.env` 文件
- 格式: `postgresql://user:password@localhost:5432/dbname`

