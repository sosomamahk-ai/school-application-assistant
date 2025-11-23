# 修复 API 404 错误

## 问题诊断

API 返回 404 的原因是：**新创建的 API 文件还没有推送到 GitHub，所以 Vercel 还没有部署**

从 `git status` 可以看到：
- 有一些修改的文件还没有提交
- 新创建的 API 文件可能还没有添加到 Git

## 解决方案

### 步骤 1: 添加新文件到 Git

```bash
# 添加新创建的 API 文件
git add src/pages/api/cron/wordpress-sync.ts
git add src/pages/api/wordpress/school-profiles-cached.ts
git add src/services/wordpressCache.ts

# 添加更新的文件
git add vercel.json
git add prisma/schema.prisma

# 添加迁移文件
git add prisma/migrations/20251123151458_add_wordpress_profile_cache/

# 提交更改
git commit -m "Add WordPress cache sync system with Cron Jobs"
```

### 步骤 2: 推送到 GitHub

```bash
git push origin main
```

### 步骤 3: 等待 Vercel 自动部署

- Vercel 会自动检测 GitHub 推送
- 自动触发新的部署
- 等待部署完成（约 2-3 分钟）

### 步骤 4: 验证部署

部署完成后，测试 API：

```powershell
.\test-wordpress-sync.ps1 -AppUrl "https://school-application-assistant.vercel.app" -Secret "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
```

## 快速操作命令

```bash
# 一键添加和提交所有相关文件
git add src/pages/api/cron/ src/pages/api/wordpress/school-profiles-cached.ts src/services/wordpressCache.ts vercel.json prisma/schema.prisma prisma/migrations/20251123151458_add_wordpress_profile_cache/
git commit -m "Add WordPress cache sync system"
git push origin main
```

## 验证步骤

1. **检查 Git 状态**
   ```bash
   git status
   ```

2. **确认文件已添加**
   ```bash
   git ls-files | findstr "wordpress-sync\|school-profiles-cached\|wordpressCache"
   ```

3. **推送到 GitHub**
   ```bash
   git push origin main
   ```

4. **在 Vercel Dashboard 查看部署**
   - 访问：https://vercel.com/dashboard
   - 选择项目：`school-application-assistant`
   - 查看 **Deployments** 标签
   - 等待新的部署完成

5. **测试 API**
   ```powershell
   # 等待部署完成后（约 2-3 分钟）
   .\test-wordpress-sync.ps1 -AppUrl "https://school-application-assistant.vercel.app" -Secret "XCb2Tg10kclvah4jduFHJtGqZErLW58A"
   ```

## 常见问题

### 问题：Git push 失败

**原因：** 可能需要先 pull 最新代码

**解决：**
```bash
git pull origin main
git push origin main
```

### 问题：部署后还是 404

**原因：** 
- 部署可能还在进行中
- 缓存可能还没有刷新

**解决：**
1. 等待部署完全完成
2. 等待几分钟让 CDN 缓存刷新
3. 使用强制刷新：`Ctrl+F5` 或添加随机参数

### 问题：Vercel 构建失败

**原因：** 可能是构建错误

**解决：**
1. 在 Vercel Dashboard 查看构建日志
2. 确保本地 `npm run build` 成功
3. 检查环境变量配置

## 下一步

1. ✅ 添加文件到 Git
2. ✅ 提交更改
3. ✅ 推送到 GitHub
4. ✅ 等待 Vercel 自动部署
5. ✅ 测试 API

