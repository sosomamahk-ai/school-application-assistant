# 快速配置指南

## 🚀 一键配置环境变量

使用自动化脚本快速配置所有必需的环境变量：

```bash
npm run sync:profile-to-school:setup
```

## 配置过程

脚本会引导您完成以下配置：

1. **WordPress 基础 URL** - 您的 WordPress 站点地址
2. **REST API 端点** - Profile post type 的 API 端点（通常使用默认值）
3. **认证类型** - 选择认证方式（无认证/Basic/Bearer/App Password）
4. **认证信息** - 根据选择的认证类型配置相应信息
5. **可选配置** - 批次大小、日志级别等

## 示例

```bash
$ npm run sync:profile-to-school:setup

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
```

## 配置完成后

配置完成后，直接进入下一步：

```bash
# 1. 生成 Prisma Client
npx prisma generate

# 2. 运行抽样测试
npm run sync:profile-to-school -- --sample 20 --dry-run
```

## 更新配置

如果需要修改配置，再次运行配置脚本：

```bash
npm run sync:profile-to-school:setup
```

脚本会检测到现有配置，询问是否更新。

## 更多信息

- 详细使用说明: `SETUP_ENV_README.md`
- 完整步骤指南: `TEST_AND_SYNC_STEPS.md`

