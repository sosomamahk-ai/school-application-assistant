# 🚀 Next.js 应用部署超详细指南

本指南将手把手教您如何部署 Next.js 应用，**完全零基础友好**。

---

## 📖 什么是"部署"？

**简单理解**：
- 现在应用在您的电脑上运行（`npm run dev`）
- 部署后，应用会在互联网上运行
- 任何人都可以通过网址访问您的应用

**比喻**：就像把您家的产品放到网店上，别人就能看到和购买了。

---

## 🎯 推荐方案：Vercel（最简单）

### 为什么选择 Vercel？

✅ **完全免费**（个人项目）  
✅ **无需服务器知识**  
✅ **自动 HTTPS**  
✅ **3 分钟完成部署**  
✅ **Next.js 官方推荐**

---

## 📋 部署前准备

### 检查清单

- [ ] 电脑已安装 Node.js（在命令行输入 `node --version` 检查）
- [ ] 项目代码在电脑上（`school-application-assistant` 文件夹）
- [ ] 有 GitHub 账号（如果没有，下面会教您注册）
- [ ] 有稳定的网络连接

---

## 🌟 方案一：使用 Vercel（推荐，最简单）

### 第一步：准备 GitHub 账号（5分钟）

#### 如果您已有 GitHub 账号，跳到第二步

#### 如果没有 GitHub 账号：

1. **打开浏览器，访问**：https://github.com

2. **点击右上角的 "Sign up"（注册）**

3. **填写注册信息**：
   - Email（邮箱）：输入您的邮箱
   - Password（密码）：设置密码（至少 15 个字符）
   - Username（用户名）：选择一个用户名
   
4. **验证邮箱**：
   - 打开邮箱，找到 GitHub 发来的验证邮件
   - 点击邮件中的验证链接

5. **完成！** 您现在有了 GitHub 账号

---

### 第二步：将代码上传到 GitHub（10分钟）

#### 安装 Git（如果还没安装）

**Windows 用户**：
1. 访问：https://git-scm.com/download/win
2. 下载并安装（全部选默认选项即可）
3. 安装完成后，重启命令行

**Mac 用户**：
```bash
# 在终端输入
git --version
# 如果提示安装，按照提示安装即可
```

**验证安装**：
```bash
git --version
# 应该显示版本号，例如：git version 2.40.0
```

#### 初始化 Git 仓库

1. **打开命令行**（Windows 用 PowerShell，Mac 用 Terminal）

2. **进入项目文件夹**：
   ```bash
   cd school-application-assistant
   # 注意：替换为您的实际路径
   # 例如：cd C:\Users\YourName\Documents\school-application-assistant
   ```

3. **初始化 Git**：
   ```bash
   git init
   ```
   
   应该看到：`Initialized empty Git repository...`

4. **配置 Git（首次使用）**：
   ```bash
   git config --global user.email "your-email@example.com"
   git config --global user.name "Your Name"
   ```
   
   把邮箱和名字替换成您的

5. **添加所有文件**：
   ```bash
   git add .
   ```
   
   这会添加所有项目文件（`.` 表示当前文件夹的所有内容）

6. **提交文件**：
   ```bash
   git commit -m "Initial commit"
   ```
   
   `-m` 后面是提交说明

#### 创建 GitHub 仓库

1. **登录 GitHub**：https://github.com

2. **点击右上角的 "+" 号**，选择 "New repository"（新建仓库）

3. **填写仓库信息**：
   - Repository name（仓库名）：`school-application-assistant`
   - Description（描述）：`AI-powered school application assistant`
   - 选择 **Public**（公开）
   - **不要**勾选 "Initialize this repository with a README"
   
4. **点击 "Create repository"（创建仓库）**

5. **复制仓库地址**：
   - 页面上会显示一个 URL，例如：
   - `https://github.com/your-username/school-application-assistant.git`
   - 点击旁边的复制按钮

#### 推送代码到 GitHub

1. **关联远程仓库**（在命令行中）：
   ```bash
   git remote add origin https://github.com/your-username/school-application-assistant.git
   ```
   
   把 URL 替换成您刚才复制的

2. **推送代码**：
   ```bash
   git branch -M main
   git push -u origin main
   ```

3. **输入 GitHub 密码**：
   - Windows 用户：会弹出登录窗口
   - Mac 用户：在终端输入密码
   - 或者使用 Personal Access Token（推荐）

**创建 Personal Access Token（更安全）**：

如果推送失败，需要创建 Token：

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. Note（备注）：填 `Vercel deployment`
4. Expiration（过期时间）：选 `90 days`
5. 勾选 `repo`（整个 repo 选项）
6. 点击底部的 "Generate token"
7. **复制生成的 token**（只显示一次！）
8. 在推送时，使用 token 作为密码

4. **验证成功**：
   - 刷新 GitHub 页面
   - 应该能看到您的所有代码文件

---

### 第三步：连接 Vercel（3分钟）

1. **访问 Vercel**：https://vercel.com

2. **注册/登录**：
   - 点击右上角的 "Sign Up"（注册）
   - 选择 "Continue with GitHub"（使用 GitHub 登录）
   - 授权 Vercel 访问您的 GitHub

3. **完成！** Vercel 账号创建成功

---

### 第四步：部署应用（2分钟）

1. **在 Vercel 控制台**，点击 "Add New..." → "Project"

2. **导入 GitHub 仓库**：
   - 找到 `school-application-assistant`
   - 点击 "Import"（导入）

3. **配置项目**：
   
   **重要！添加环境变量**：
   
   - 点击 "Environment Variables"（环境变量）
   - 添加以下变量：
   
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | 您的 PostgreSQL 连接字符串 |
   | `OPENAI_API_KEY` | 您的 OpenAI API Key |
   | `JWT_SECRET` | 随机生成的密钥 |
   | `NEXT_PUBLIC_APP_URL` | 先留空，部署后填写 |

   **获取 DATABASE_URL**：
   - 如果您还没有在线数据库，往下看"第五步"
   - 或者暂时先不填，稍后添加

4. **点击 "Deploy"（部署）**

5. **等待构建**（约 2-3 分钟）：
   - 您会看到构建日志滚动
   - 等待显示 "✓ Build successful"

6. **部署成功！**
   - 页面会显示 "Congratulations!"
   - 您会看到您的应用 URL，例如：
   - `https://school-application-assistant-abc123.vercel.app`

7. **复制 URL**，这就是您的应用地址！

---

### 第五步：配置在线数据库（10分钟）

部署后的应用需要一个在线数据库。

#### 选项 A：使用 Vercel Postgres（推荐，免费）

1. **在 Vercel 项目页面**，点击 "Storage"（存储）

2. **点击 "Create Database"**

3. **选择 "Postgres"**

4. **选择区域**：
   - 选择离您最近的区域（例如：Hong Kong）

5. **点击 "Create"**

6. **自动连接**：
   - Vercel 会自动添加 `DATABASE_URL` 环境变量
   - 您不需要手动配置

7. **运行数据库迁移**：
   
   在本地命令行：
   ```bash
   # 安装 Vercel CLI
   npm install -g vercel
   
   # 登录
   vercel login
   
   # 链接到项目
   vercel link
   
   # 拉取环境变量
   vercel env pull
   
   # 运行迁移
   npx prisma migrate deploy
   
   # 添加示例数据
   npx prisma db seed
   ```

#### 选项 B：使用 Railway（也很简单）

1. **访问 Railway**：https://railway.app

2. **使用 GitHub 登录**

3. **创建新项目**：
   - 点击 "New Project"
   - 选择 "Provision PostgreSQL"

4. **获取连接字符串**：
   - 点击 PostgreSQL 数据库
   - 找到 "Connect" 选项卡
   - 复制 "PostgreSQL Connection URL"

5. **添加到 Vercel**：
   - 回到 Vercel 项目
   - Settings → Environment Variables
   - 添加 `DATABASE_URL`，粘贴刚才复制的 URL

6. **重新部署**：
   - 在 Vercel 项目页面
   - 点击 "Deployments"
   - 点击最新部署旁边的三个点
   - 选择 "Redeploy"

#### 选项 C：使用 Supabase（功能最全）

1. **访问 Supabase**：https://supabase.com

2. **注册账号**（使用 GitHub 登录）

3. **创建新项目**：
   - 点击 "New project"
   - Organization：选择您的组织
   - Name：`school-app-db`
   - Database Password：生成强密码（保存好！）
   - Region：选择 Hong Kong 或 Singapore

4. **等待数据库创建**（约 2 分钟）

5. **获取连接字符串**：
   - 点击 "Settings" → "Database"
   - 找到 "Connection string"
   - 选择 "URI"
   - 复制连接字符串
   - 将 `[YOUR-PASSWORD]` 替换为您刚才设置的密码

6. **添加到 Vercel**（同上）

---

### 第六步：验证部署（2分钟）

1. **访问您的应用 URL**：
   - 例如：`https://your-app.vercel.app`

2. **测试功能**：
   - 首页能正常显示 ✓
   - 点击注册按钮 ✓
   - 尝试注册一个账户 ✓
   - 登录成功 ✓

3. **如果有错误**：
   - 在 Vercel 项目页面，点击 "Logs"
   - 查看错误信息
   - 常见问题见下方

---

### 第七步：更新 WordPress 配置（1分钟）

现在您有了部署的 URL，可以在 WordPress 中使用了：

1. **打开 WordPress 后台**

2. **进入 Code Snippets**

3. **编辑您的代码片段**，修改：
   ```php
   define('SCHOOL_APP_URL', 'https://your-actual-url.vercel.app');
   ```
   
   替换成您的 Vercel URL

4. **保存**

5. **测试 WordPress 页面**，应该能看到嵌入的应用了！

---

## 🔄 后续更新流程

当您修改代码后，如何重新部署？

### 简单方式（使用 Vercel 自动部署）

1. **修改代码**

2. **提交到 Git**：
   ```bash
   git add .
   git commit -m "更新说明"
   git push
   ```

3. **Vercel 自动部署**：
   - Vercel 会自动检测到代码变化
   - 自动重新构建和部署
   - 通常 2-3 分钟完成

4. **完成！** 刷新网页即可看到更新

---

## ❌ 常见错误和解决方案

### 错误 1：Git 推送失败

**错误信息**：
```
fatal: Authentication failed
```

**解决方案**：
1. 使用 Personal Access Token 而不是密码
2. 或者使用 GitHub Desktop（图形界面工具）

**使用 GitHub Desktop**：
1. 下载：https://desktop.github.com/
2. 登录 GitHub 账号
3. File → Add Local Repository
4. 选择您的项目文件夹
5. 点击 "Publish repository"
6. 更简单！

---

### 错误 2：Vercel 构建失败

**错误信息**：
```
Error: Build failed
```

**解决方案**：

1. **检查环境变量**：
   - Settings → Environment Variables
   - 确保所有必需的变量都已添加

2. **查看构建日志**：
   - 点击失败的部署
   - 查看具体错误信息

3. **常见原因**：
   - 缺少环境变量
   - 代码中有语法错误
   - 依赖包版本冲突

---

### 错误 3：数据库连接失败

**错误信息**：
```
Can't reach database server
```

**解决方案**：

1. **检查 DATABASE_URL**：
   - 确保格式正确
   - 确保密码没有特殊字符问题
   - 如果有特殊字符，需要 URL 编码

2. **运行迁移**：
   ```bash
   # 确保数据库已初始化
   npx prisma migrate deploy
   ```

3. **检查数据库状态**：
   - 确认数据库服务正在运行
   - 检查防火墙设置

---

### 错误 4：OpenAI API 失败

**错误信息**：
```
Invalid API key
```

**解决方案**：

1. **验证 API Key**：
   - 访问：https://platform.openai.com/api-keys
   - 检查 Key 是否有效
   - 重新生成并更新

2. **检查账户余额**：
   - https://platform.openai.com/account/billing
   - 确保有足够余额

---

## 🎨 方案二：使用 Netlify（备选）

如果 Vercel 有问题，可以使用 Netlify：

1. **访问**：https://netlify.com

2. **使用 GitHub 登录**

3. **点击 "Add new site" → "Import an existing project"**

4. **连接 GitHub**，选择您的仓库

5. **配置构建设置**：
   - Build command: `npm run build`
   - Publish directory: `.next`

6. **添加环境变量**（同 Vercel）

7. **部署**

---

## 💻 方案三：本地测试（不部署到互联网）

如果您只想在本地网络使用：

1. **获取本地 IP 地址**：
   
   **Windows**：
   ```bash
   ipconfig
   # 找到 IPv4 地址，例如：192.168.1.100
   ```
   
   **Mac**：
   ```bash
   ifconfig | grep inet
   # 找到类似 192.168.1.100 的地址
   ```

2. **启动应用**：
   ```bash
   npm run dev -- -H 0.0.0.0
   ```

3. **在 WordPress 中使用**：
   ```php
   define('SCHOOL_APP_URL', 'http://192.168.1.100:3000');
   ```

**注意**：
- 只能在同一网络内访问
- 重启后 IP 可能变化
- 不适合生产环境

---

## 📊 部署后的检查清单

- [ ] 应用 URL 可以访问
- [ ] 首页正常显示
- [ ] 用户可以注册
- [ ] 用户可以登录
- [ ] Dashboard 正常显示
- [ ] AI 功能可用（测试生成内容）
- [ ] 数据能正确保存
- [ ] WordPress 集成正常工作
- [ ] 移动端显示正常

---

## 🎉 完成！

恭喜您成功部署了 Next.js 应用！

### 您获得了：
✅ 一个可以在互联网访问的应用  
✅ 自动 HTTPS 加密  
✅ 自动备份和版本控制  
✅ 每次推送代码自动部署  

### 下一步：
1. 在 WordPress 中集成应用
2. 自定义样式和功能
3. 添加更多学校模板
4. 邀请用户测试

---

## 📞 需要帮助？

如果遇到问题：

1. **查看 Vercel 日志**：
   - Project → Logs
   - 查看错误详情

2. **检查环境变量**：
   - Settings → Environment Variables
   - 确保所有变量都正确

3. **查看构建日志**：
   - Deployments → 点击失败的部署
   - 查看完整错误信息

4. **联系支持**：
   - Vercel Discord: https://vercel.com/discord
   - GitHub Issues: 在您的仓库中提问

---

## 💡 小贴士

1. **使用 Vercel CLI 更方便**：
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **设置自定义域名**：
   - Vercel 项目 → Settings → Domains
   - 添加您自己的域名

3. **查看分析数据**：
   - Vercel 项目 → Analytics
   - 查看访问量、性能等数据

4. **设置环境变量技巧**：
   - 可以为不同环境设置不同的值
   - Development（开发）、Preview（预览）、Production（生产）

---

**祝您部署顺利！** 🚀

有任何问题随时问我，我会帮您解决！

