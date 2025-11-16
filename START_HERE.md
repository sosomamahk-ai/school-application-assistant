# 🎯 从这里开始！（零基础用户）

**您只需要看这一个文件，跟着做就行！**

---

## ✅ 您已经完成的准备工作

- ✅ Node.js 已安装
- ✅ GitHub 账号已创建
- ✅ GitHub Desktop 已安装
- ✅ Vercel 账号已创建
- ✅ 项目文件夹在 C 盘

太棒了！您已经完成了 50%！

---

## 🚀 接下来只需 3 大步骤

```
第1步：把代码上传到 GitHub（15分钟）
    ↓
第2步：在 Vercel 部署（5分钟）
    ↓
第3步：在 WordPress 使用（5分钟）
```

---

## 📍 第1步：上传代码到 GitHub

### 问题解决：GitHub Desktop 说"不是 GitHub 仓库"

**原因**：文件夹还没有初始化为 Git 项目

**解决方案**（3个小步骤）：

---

### 1.1 初始化 Git 仓库

1. **打开 PowerShell**
   - 按 `Windows` 键
   - 输入：`powershell`
   - 按 `Enter`

2. **进入项目文件夹**
   
   假设您的项目在：`C:\school-application-assistant`
   
   输入以下命令，按 Enter：
   ```powershell
   cd C:\school-application-assistant
   ```
   
   💡 **技巧**：如果路径不同，改成您的实际路径

3. **初始化 Git**
   
   输入以下命令，按 Enter：
   ```powershell
   git init
   ```
   
   应该看到：
   ```
   Initialized empty Git repository...
   ```
   
   ✅ 完成！现在文件夹已经是 Git 仓库了

4. **配置 Git（首次使用）**
   
   输入以下命令（把邮箱和名字改成您的）：
   ```powershell
   git config --global user.email "your-email@example.com"
   git config --global user.name "Your Name"
   ```

5. **添加所有文件**
   
   输入：
   ```powershell
   git add .
   ```
   
   （注意：`git add` 后面有个空格和一个点 `.`）

6. **提交文件**
   
   输入：
   ```powershell
   git commit -m "Initial commit"
   ```
   
   应该看到类似：
   ```
   [main 1234567] Initial commit
   50 files changed...
   ```
   
   ✅ 完成！

---

### 1.2 使用 GitHub Desktop 发布

现在回到 GitHub Desktop：

1. **打开 GitHub Desktop**

2. **添加本地仓库**
   - 点击：`File` → `Add Local Repository`
   - 浏览并选择：`C:\school-application-assistant`
   - 点击 `Add Repository`
   
   ✅ 这次应该成功了！

3. **发布到 GitHub**
   - 在 GitHub Desktop 中，点击顶部的 `Publish repository` 按钮
   - 在弹出窗口中：
     - Name（名称）：`school-application-assistant`
     - Description（描述）：`AI-powered school application assistant`
     - 确保 **不勾选** "Keep this code private"（保持代码公开）
   - 点击 `Publish Repository`
   
4. **等待上传**
   - 会显示上传进度
   - 完成后，按钮会变成 "View on GitHub"
   
   ✅ 代码已经上传到 GitHub 了！

---

## 📍 第2步：在 Vercel 部署

现在代码在 GitHub 上了，可以部署了！

### 2.1 连接 Vercel 和 GitHub

1. **访问 Vercel**
   - 打开浏览器
   - 访问：https://vercel.com
   - 点击右上角 `Login`

2. **使用 GitHub 登录**
   - 点击 `Continue with GitHub`
   - 如果提示授权，点击 `Authorize Vercel`
   
   ✅ Vercel 和 GitHub 已连接！

---

### 2.2 导入项目

1. **在 Vercel 主页**
   - 点击 `Add New...` 按钮
   - 选择 `Project`

2. **导入 GitHub 仓库**
   - 在列表中找到 `school-application-assistant`
   - 点击旁边的 `Import` 按钮

3. **配置项目**（重要！）
   
   在配置页面，找到 `Environment Variables`（环境变量）部分：
   
   **暂时跳过环境变量，先部署看看！**
   
   直接点击底部的 `Deploy` 按钮

4. **等待构建**
   - 会看到构建日志滚动
   - 大约 2-3 分钟
   
   ⚠️ **可能会失败，这很正常！**
   
   失败是因为缺少环境变量。没关系，我们继续。

---

### 2.3 添加环境变量

即使部署失败，项目也已经创建了。现在添加环境变量：

1. **在 Vercel 项目页面**
   - 点击顶部的 `Settings`（设置）
   - 点击左侧的 `Environment Variables`（环境变量）

2. **添加必需的变量**
   
   逐个添加以下变量（点击 `Add` 后再添加下一个）：

---

#### 变量 1: JWT_SECRET

```
Name: JWT_SECRET
Value: (生成一个随机字符串)
```

**如何生成随机字符串？**

**方法 A**（最简单）：
- 访问：https://randomkeygen.com/
- 复制 "CodeIgniter Encryption Keys" 下面的任意一个
- 粘贴到 Value

**方法 B**（使用 PowerShell）：
```powershell
# 在 PowerShell 中运行
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**环境选择**：
- ✅ Production
- ✅ Preview  
- ✅ Development

点击 `Save`

---

#### 变量 2: NEXT_PUBLIC_APP_URL

```
Name: NEXT_PUBLIC_APP_URL
Value: https://your-project-name.vercel.app
```

**如何获取这个 URL？**
- 在 Vercel 项目页面，顶部会显示您的域名
- 类似：`school-application-assistant-abc123.vercel.app`
- 完整 URL：`https://school-application-assistant-abc123.vercel.app`

**环境选择**：全选

点击 `Save`

---

#### 变量 3 和 4：暂时可选

⚠️ **DATABASE_URL** 和 **OPENAI_API_KEY** 暂时不加

为什么？因为：
- 应用可以先部署起来看看
- 数据库和 AI 功能稍后再配置
- 这样更简单！

---

### 2.4 重新部署

添加环境变量后：

1. **点击顶部的 `Deployments`**
2. **点击最新部署旁边的三个点 `...`**
3. **选择 `Redeploy`**
4. **点击确认**

等待 2-3 分钟...

✅ **应该成功了！**

---

### 2.5 访问您的应用

1. **在 Vercel 项目页面**
   - 会看到 `Visit` 按钮
   - 点击它

2. **应该看到您的应用首页！**
   - 有 "School Application Assistant" 标题
   - 有 "Get Started" 按钮

🎉 **恭喜！应用已经部署成功了！**

---

## 📍 第3步：在 WordPress 中使用

现在应用已经在线了，可以嵌入到 WordPress 了！

### 3.1 复制应用 URL

从 Vercel 复制您的应用 URL，例如：
```
https://school-application-assistant-abc123.vercel.app
```

---

### 3.2 在 WordPress 添加代码

1. **登录 WordPress 后台**

2. **进入 Code Snippets**
   - 左侧菜单 → `Snippets` → `Add New`

3. **创建新代码片段**
   - Title（标题）：`School Application Assistant`

4. **复制以下代码**（完整复制）：

```php
<?php
// School Application Assistant - iframe 嵌入

// 修改这里为您的实际 URL
define('SCHOOL_APP_URL', 'https://your-app.vercel.app');

function school_application_assistant_shortcode($atts) {
    $atts = shortcode_atts(array(
        'page' => 'dashboard',
        'height' => '800px'
    ), $atts);
    
    $page = esc_attr($atts['page']);
    $height = esc_attr($atts['height']);
    
    $app_url = SCHOOL_APP_URL . '/' . $page;
    
    $html = sprintf(
        '<div class="school-app-wrapper">
            <iframe 
                src="%s" 
                width="100%%" 
                height="%s" 
                frameborder="0"
                style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
            ></iframe>
        </div>',
        esc_url($app_url),
        $height
    );
    
    return $html;
}
add_shortcode('school_app', 'school_application_assistant_shortcode');
?>
```

5. **重要：修改第 4 行**
   
   把这行：
   ```php
   define('SCHOOL_APP_URL', 'https://your-app.vercel.app');
   ```
   
   改成您的实际 URL：
   ```php
   define('SCHOOL_APP_URL', 'https://school-application-assistant-abc123.vercel.app');
   ```

6. **保存并激活**
   - 点击 `Save Changes and Activate`

✅ 代码片段已激活！

---

### 3.3 在 Elementor 中使用

1. **创建或编辑页面**
   - 用 Elementor 打开任意页面

2. **添加短代码小部件**
   - 搜索并拖入 `Shortcode` 小部件

3. **输入短代码**
   
   在短代码框中输入：
   ```
   [school_app]
   ```

4. **发布页面**

5. **查看效果**
   - 在前台查看页面
   - 应该能看到嵌入的应用！

🎉 **完成！您的 WordPress 网站现在有了 AI 申请助手！**

---

## 🎊 恭喜您！

您已经完成了整个部署流程！

**您现在有了**：
- ✅ 一个在线运行的 Next.js 应用
- ✅ 代码托管在 GitHub
- ✅ 自动部署（每次更新代码会自动部署）
- ✅ WordPress 集成完成

---

## ⚠️ 功能限制（暂时）

因为我们还没有配置：
- ❌ 数据库（无法注册/登录）
- ❌ OpenAI API（AI 功能不可用）

**但是**：
- ✅ 前端界面完全正常
- ✅ 可以看到所有页面
- ✅ 可以展示给别人看

---

## 🔜 下一步（可选）

如果您想要完整功能，需要：

### 步骤 A：配置数据库（20分钟）

1. 访问 https://supabase.com
2. 用 GitHub 账号登录
3. 创建新项目
4. 获取数据库连接字符串
5. 添加到 Vercel 环境变量

**详细步骤**：看 `DEPLOYMENT_GUIDE_DETAILED.md` 的"第五步"

---

### 步骤 B：配置 OpenAI API（5分钟）

1. 访问 https://platform.openai.com
2. 创建 API Key
3. 添加到 Vercel 环境变量

---

## 💡 常见问题

### Q: 我在哪一步卡住了？

**答**：告诉我具体在哪一步，我会详细帮您！

### Q: Vercel 部署失败怎么办？

**答**：
1. 点击失败的部署
2. 查看错误信息
3. 截图发给我
4. 我会告诉您如何解决

### Q: WordPress 中看不到应用？

**答**：
1. 检查代码片段是否激活
2. 检查 URL 是否正确
3. 按 F12 打开浏览器控制台，看是否有错误

### Q: 想要完整功能怎么办？

**答**：按照上面的"下一步"配置数据库和 API

---

## 📞 需要帮助？

**告诉我**：
1. 您在第几步
2. 看到什么错误信息
3. 截图（如果方便的话）

我会立即帮您解决！

---

## 🎯 记住

- 🐢 慢慢来，不要着急
- ✅ 一步一步做，不要跳步
- 💪 遇到错误很正常，可以解决
- 📝 可以随时问我

**您一定能成功的！** 🚀

