# WordPress 缓存同步 - 配置验证清单

## ✅ 已完成的步骤

### 1. CRON_SECRET 环境变量配置 ✅

- [x] ✅ 已在 Vercel Dashboard 配置 `CRON_SECRET`
- [x] ✅ 值：`XCb2Tg10kclvah4jduFHJtGqZErLW58A`
- [x] ✅ 环境范围：Production, Preview, Development

**下一步：** 重新部署应用使环境变量生效

---

## ⚠️ 需要完成的步骤

### 步骤 1: 重新部署应用（使环境变量生效）⚠️

**原因：** 添加环境变量后需要重新部署应用才能生效

**操作步骤：**

1. 访问 Vercel Dashboard
   - 前往：https://vercel.com/dashboard
   - 选择项目：`school-application-assistant`

2. 重新部署应用
   - 前往 **Deployments** 标签
   - 点击最新部署右侧的 **...** > **Redeploy**
   - 或点击 **Deployments** 页面的 **Redeploy** 按钮
   - 等待部署完成（约 2-3 分钟）

3. 确认部署成功
   - 等待部署状态变为 **Ready**
   - 查看部署日志确认无错误

**预计时间：** 2-3 分钟

---

### 步骤 2: 运行数据库迁移（必需）⚠️

**原因：** 需要创建 `WordPressProfileCache` 表

**操作步骤：**

在本地运行：

```bash
npx prisma migrate deploy
```

**验证迁移是否成功：**

```bash
# 方法 1: 使用 Prisma Studio
npx prisma studio
# 然后在浏览器中查看 WordPressProfileCache 表

# 方法 2: 使用 psql（如果有）
psql $DATABASE_URL -c "SELECT * FROM \"WordPressProfileCache\";"
```

**预计时间：** 1-2 分钟

---

### 步骤 3: 测试 WordPress 同步 API ⚠️

**方法 A: 使用测试脚本**

```powershell
.\test-wordpress-sync.ps1 -AppUrl "https://school-application-assistant.vercel.app" -Secret "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
```

**方法 B: 使用 PowerShell 命令**

```powershell
$appUrl = "https://school-application-assistant.vercel.app"
$secret = "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
$url = "$appUrl/api/cron/wordpress-sync?secret=$secret"
Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 10
```

**方法 C: 使用浏览器**

直接访问：
```
https://school-application-assistant.vercel.app/api/cron/wordpress-sync?secret=XCb2Tg10kclvah4jduFHJtGqZErLW58A
```

**预期响应（成功）：**

```json
{
  "success": true,
  "message": "WordPress data synced successfully",
  "stats": {
    "profilesCount": 150,
    "universitiesCount": 20,
    "totalCount": 170
  },
  "cache": {
    "savedTo": ["postgres", "json"],
    "errors": [],
    "backendsCount": 2
  },
  "duration": "2345ms",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**预计时间：** 5 分钟

---

## 📋 验证清单

### 配置验证

- [x] ✅ CRON_SECRET 环境变量已配置
- [ ] ⚠️ **重新部署应用（使环境变量生效）**
- [ ] ⚠️ **运行数据库迁移：`npx prisma migrate deploy`**
- [ ] ⚠️ **测试同步 API**

### 功能验证

- [ ] ⚠️ API 端点可访问（返回 200 或 401，不是 404）
- [ ] ⚠️ 使用正确的 secret 能成功调用 API
- [ ] ⚠️ 数据成功同步到缓存后端
- [ ] ⚠️ 缓存读取 API 可正常工作

---

## 🔍 故障排除

### 问题 1: 401 Unauthorized

**原因：**
- CRON_SECRET 环境变量还未生效
- Secret 值不匹配
- 应用未重新部署

**解决：**
1. 确认在 Vercel Dashboard 中已添加 `CRON_SECRET`
2. 确认值正确：`XCb2Tg10kclvah4jduFHJtGqZErLW58A`
3. **重新部署应用**（重要！）
4. 等待部署完成后再次测试

### 问题 2: 404 Not Found

**原因：**
- API 路由未部署
- URL 不正确
- 代码未推送到 GitHub

**解决：**
1. 确认代码已推送到 GitHub
2. 检查 Vercel 部署日志
3. 确认 `src/pages/api/cron/wordpress-sync.ts` 文件存在
4. 重新部署应用

### 问题 3: 500 Internal Server Error

**原因：**
- 数据库迁移未运行
- WordPress API 连接失败
- 环境变量配置错误

**解决：**
1. **运行数据库迁移**：`npx prisma migrate deploy`
2. 检查 WordPress URL 配置（`WORDPRESS_BASE_URL` 或 `NEXT_PUBLIC_WORDPRESS_BASE_URL`）
3. 查看 Vercel Dashboard > Functions > `/api/cron/wordpress-sync` > Logs 获取详细错误信息

---

## 🎯 下一步操作顺序

1. ✅ **已完成：** 配置 CRON_SECRET 环境变量
2. ⚠️ **下一步：** 重新部署应用（使环境变量生效）
3. ⚠️ **下一步：** 运行数据库迁移：`npx prisma migrate deploy`
4. ⚠️ **下一步：** 测试同步 API
5. ⚠️ **可选：** 配置 Vercel KV / Redis（提升性能）

---

## 📚 相关文档

- 📖 [完整配置指南](docs/WORDPRESS_CACHE_SYNC.md)
- 🚀 [快速开始](docs/WORDPRESS_CACHE_QUICKSTART.md)
- 🔧 [故障排除](FIX_SYNC_TEST.md)
- 📝 [测试指南](docs/TEST_WORDPRESS_SYNC.md)
- 📋 [自动设置报告](AUTO_SETUP_SUMMARY.md)

---

**最后更新：** 2025-11-23  
**应用 URL：** https://school-application-assistant.vercel.app  
**Secret：** XCb2Tg10kclvah4jduFHJtGqZErLW58A

