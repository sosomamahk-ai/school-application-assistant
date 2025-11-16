# 🚀 部署快速参考卡片

一页纸看懂 Next.js 应用部署全流程

---

## 📌 5分钟速览版

```
您的电脑 → GitHub → Vercel → 互联网
   ↓          ↓        ↓        ↓
 开发代码   存储代码  自动部署  全球访问
```

---

## 🎯 核心概念

### 什么是 Git？
📦 **代码的"快递员"** - 把您的代码从电脑传到 GitHub

### 什么是 GitHub？
☁️ **代码的"云盘"** - 在线存储您的代码

### 什么是 Vercel？
🚀 **自动化"发布工具"** - 让代码变成可访问的网站

### 什么是部署？
🌐 **"开店"** - 让别人能访问您的应用

---

## 📋 完整流程图

```
第1步：安装工具 (5分钟)
┌─────────────────────┐
│  Git + Node.js     │
│  GitHub 账号       │
│  Vercel 账号       │
└─────────────────────┘
         ↓
         
第2步：上传代码 (10分钟)
┌─────────────────────┐
│  git init          │ ← 初始化
│  git add .         │ ← 添加文件
│  git commit        │ ← 保存快照
│  git push          │ ← 上传到 GitHub
└─────────────────────┘
         ↓
         
第3步：连接 Vercel (3分钟)
┌─────────────────────┐
│  登录 Vercel       │
│  导入 GitHub 仓库   │
│  添加环境变量      │
└─────────────────────┘
         ↓
         
第4步：部署 (2分钟)
┌─────────────────────┐
│  点击 Deploy       │
│  等待构建完成      │
│  获得 URL          │
└─────────────────────┘
         ↓
         
第5步：配置数据库 (10分钟)
┌─────────────────────┐
│  创建在线数据库     │
│  添加连接字符串     │
│  运行数据库迁移     │
└─────────────────────┘
         ↓
         
✅ 完成！
```

---

## 💻 命令速查表

### Git 基础命令

| 命令 | 作用 | 什么时候用 |
|------|------|-----------|
| `git init` | 初始化仓库 | 第一次使用 |
| `git add .` | 添加所有文件 | 保存前 |
| `git commit -m "说明"` | 提交更改 | 保存更改 |
| `git push` | 上传到 GitHub | 发布代码 |
| `git status` | 查看状态 | 检查文件 |
| `git log` | 查看历史 | 查看提交记录 |

### NPM 常用命令

| 命令 | 作用 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |

### Vercel CLI 命令

| 命令 | 作用 |
|------|------|
| `vercel login` | 登录账号 |
| `vercel` | 部署项目 |
| `vercel --prod` | 部署到生产环境 |
| `vercel logs` | 查看日志 |
| `vercel env pull` | 拉取环境变量 |

---

## 🔗 重要链接

### 工具下载

| 工具 | 下载地址 | 用途 |
|------|---------|------|
| Git | https://git-scm.com | 版本控制 |
| Node.js | https://nodejs.org | 运行环境 |
| VS Code | https://code.visualstudio.com | 代码编辑器（推荐） |
| GitHub Desktop | https://desktop.github.com | Git 图形界面（可选） |

### 在线服务

| 服务 | 网址 | 用途 |
|------|------|------|
| GitHub | https://github.com | 代码托管 |
| Vercel | https://vercel.com | 应用部署 |
| Supabase | https://supabase.com | 数据库（推荐） |
| Railway | https://railway.app | 数据库（备选） |
| OpenAI | https://platform.openai.com | AI API |

---

## 🎬 分步骤详细操作

### 步骤1：安装 Git（Windows）

```bash
1. 访问 https://git-scm.com/download/win
2. 下载安装包（64-bit Git for Windows Setup）
3. 双击运行
4. 所有选项选默认，一直点"Next"
5. 点"Install"
6. 完成后点"Finish"

验证安装：
打开 PowerShell，输入：
git --version
```

### 步骤2：上传代码到 GitHub

```bash
# 1. 进入项目目录
cd path/to/school-application-assistant

# 2. 初始化 Git
git init

# 3. 配置用户信息（首次使用）
git config --global user.email "your.email@example.com"
git config --global user.name "Your Name"

# 4. 添加所有文件
git add .

# 5. 提交
git commit -m "Initial commit"

# 6. 在 GitHub 创建仓库后，关联远程仓库
git remote add origin https://github.com/yourusername/school-application-assistant.git

# 7. 推送代码
git branch -M main
git push -u origin main
```

**如果推送失败，创建 Personal Access Token：**

```
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 备注填：Deployment
4. 过期时间选：90 days
5. 勾选 "repo"
6. 点击 "Generate token"
7. 复制生成的 token（只显示一次！）
8. 推送时使用 token 作为密码
```

### 步骤3：在 Vercel 部署

```
1. 访问 https://vercel.com
2. 点击 "Sign Up"
3. 选择 "Continue with GitHub"
4. 授权 Vercel
5. 点击 "Add New..." → "Project"
6. 找到您的仓库，点击 "Import"
7. 添加环境变量（见下表）
8. 点击 "Deploy"
9. 等待 2-3 分钟
10. 完成！复制 URL
```

### 步骤4：环境变量配置

在 Vercel 添加以下环境变量：

| 变量名 | 获取方式 | 示例值 |
|--------|---------|--------|
| `DATABASE_URL` | Supabase 或 Railway | `postgresql://user:pass@host/db` |
| `OPENAI_API_KEY` | OpenAI Platform | `sk-proj-abc123...` |
| `JWT_SECRET` | 运行 `openssl rand -base64 32` | `XyZ123AbC456...` |
| `NEXT_PUBLIC_APP_URL` | 部署后的 Vercel URL | `https://your-app.vercel.app` |

---

## ⚠️ 常见错误速查

### 错误类型快速识别

| 错误信息包含 | 问题类型 | 解决方案 |
|-------------|---------|---------|
| `Authentication failed` | Git 认证 | 使用 Personal Access Token |
| `Build failed` | 构建错误 | 检查代码和环境变量 |
| `Can't reach database` | 数据库连接 | 检查 DATABASE_URL |
| `Invalid API key` | OpenAI | 检查 OPENAI_API_KEY |
| `Module not found` | 依赖缺失 | 运行 `npm install` |
| `Port already in use` | 端口占用 | 更换端口或关闭进程 |

### 解决方案速查

**问题：Git 推送失败**
```bash
# 方案1：使用 GitHub Desktop（最简单）
下载 https://desktop.github.com

# 方案2：使用 SSH
ssh-keygen -t ed25519 -C "your@email.com"
cat ~/.ssh/id_ed25519.pub
# 复制内容，添加到 GitHub → Settings → SSH keys

# 方案3：使用 Personal Access Token（见上面）
```

**问题：Vercel 构建失败**
```bash
# 1. 检查环境变量是否完整
# 2. 查看构建日志中的具体错误
# 3. 在本地运行 npm run build 测试
# 4. 确保 package.json 中的依赖版本正确
```

**问题：数据库连接失败**
```bash
# 1. 检查 DATABASE_URL 格式
postgresql://username:password@host:port/database

# 2. 确保数据库在线且可访问
# 3. 运行数据库迁移
npx prisma migrate deploy

# 4. 检查 IP 白名单设置（如果有）
```

---

## 📊 部署状态检查

### 快速检查清单

用浏览器访问这些 URL：

```
1. 应用首页
   https://your-app.vercel.app
   ✓ 应该看到首页

2. API 健康检查
   https://your-app.vercel.app/api/templates
   ✓ 应该返回 JSON 数据

3. 登录页面
   https://your-app.vercel.app/auth/login
   ✓ 应该看到登录表单

4. 注册测试
   - 尝试注册一个账户
   - 检查能否成功登录
```

### 使用浏览器开发者工具

```
1. 按 F12 打开开发者工具
2. 切换到 "Console" 标签
3. 刷新页面
4. 查看是否有红色错误
5. 切换到 "Network" 标签
6. 查看 API 请求是否成功
```

---

## 🎓 专业术语解释

| 术语 | 简单解释 | 比喻 |
|------|---------|------|
| Repository（仓库） | 存放代码的地方 | 代码的文件夹 |
| Commit（提交） | 保存代码快照 | 游戏存档点 |
| Push（推送） | 上传代码 | 发送文件 |
| Pull（拉取） | 下载代码 | 接收文件 |
| Branch（分支） | 代码的版本线 | 平行世界 |
| Merge（合并） | 合并不同版本 | 合并文档 |
| Deploy（部署） | 发布应用 | 开店营业 |
| Build（构建） | 编译代码 | 打包产品 |
| Environment Variable | 配置信息 | 设置参数 |
| Database | 数据库 | 电子表格 |

---

## 💰 费用说明

### 免费额度

| 服务 | 免费额度 | 付费起点 |
|------|---------|---------|
| **Vercel** | 无限项目<br>100GB 带宽/月 | $20/月 |
| **GitHub** | 无限公开仓库<br>500MB 私有 | $4/月 |
| **Supabase** | 500MB 数据库<br>2GB 传输 | $25/月 |
| **Railway** | $5 免费额度/月 | 按需付费 |
| **OpenAI** | $5 新用户额度 | 按使用量 |

### 预计月费用

**小型项目**（100 用户以内）：
- Vercel: $0（免费）
- Database: $0-10
- OpenAI: $5-20
- **总计**: $5-30/月

**中型项目**（1000 用户）：
- Vercel: $20
- Database: $25
- OpenAI: $50-100
- **总计**: $95-145/月

---

## 🔄 日常维护流程

### 更新代码

```bash
# 1. 修改代码
# 2. 提交更改
git add .
git commit -m "添加新功能"
git push

# 3. Vercel 自动部署（2-3分钟）
# 4. 完成！
```

### 查看日志

```bash
# 在 Vercel 网站
Project → Logs → Real-time

# 或使用 CLI
vercel logs
```

### 回滚版本

```bash
# 在 Vercel 网站
Deployments → 选择旧版本 → Promote to Production
```

---

## 📱 移动端使用

### iOS Safari 测试

```
1. 打开 Safari
2. 访问您的应用 URL
3. 点击分享按钮
4. 选择"添加到主屏幕"
5. 像 App 一样使用
```

### Android Chrome 测试

```
1. 打开 Chrome
2. 访问您的应用 URL
3. 点击菜单（三个点）
4. 选择"添加到主屏幕"
5. 创建快捷方式
```

---

## 🎯 下一步建议

### 部署成功后：

- [ ] 测试所有功能
- [ ] 在 WordPress 中集成
- [ ] 邀请测试用户
- [ ] 设置自定义域名
- [ ] 配置分析工具
- [ ] 设置错误监控

### 学习资源：

| 资源 | 链接 | 说明 |
|------|------|------|
| Next.js 文档 | https://nextjs.org/docs | 官方教程 |
| Vercel 指南 | https://vercel.com/docs | 部署文档 |
| Git 教程 | https://git-scm.com/book/zh/v2 | 中文版 |
| YouTube 教程 | 搜索"Next.js 部署" | 视频教程 |

---

## 📞 获取帮助

### 官方支持

- **Vercel**: https://vercel.com/support
- **GitHub**: https://support.github.com
- **Next.js**: https://github.com/vercel/next.js/discussions

### 社区资源

- **Stack Overflow**: 搜索您的错误信息
- **GitHub Issues**: 在项目仓库提问
- **Discord 社区**: Vercel、Next.js 官方 Discord

### 问题模板

```
遇到问题时，提供以下信息：

1. 操作系统: Windows/Mac/Linux
2. Node.js 版本: node --version
3. 错误信息: 完整的错误日志
4. 复现步骤: 1. xxx 2. xxx 3. xxx
5. 期望结果: 应该发生什么
6. 实际结果: 实际发生了什么
```

---

**记住：第一次部署可能会遇到问题，这很正常！**

**慢慢来，一步一步解决，您一定可以成功的！** 💪

---

## 🎉 成功标志

当您看到以下内容，说明部署成功：

✅ Vercel 显示绿色的 "Ready"  
✅ 访问 URL 能看到您的应用  
✅ 能够注册和登录  
✅ Dashboard 正常显示  
✅ WordPress 集成正常工作  

**恭喜您！🎊**

---

**需要帮助？** 随时问我，我会详细解答每一个步骤！ 💬

