# Chrome 扩展使用指南

## 📦 安装步骤

### 1. 开发模式安装

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目目录：`src/modules/autofill/chrome-extension/`
6. 扩展安装完成！

### 2. 生产模式打包（可选）

```bash
# 使用 Chrome 的打包功能
# 1. 访问 chrome://extensions/
# 2. 点击"打包扩展程序"
# 3. 选择扩展目录
# 4. 生成 .crx 文件
```

## 🔧 配置

### 1. 设置 API 地址

在 `background.js` 中修改 `API_BASE_URL`：

```javascript
const API_BASE_URL = 'https://your-api-domain.com'; // 生产环境
// 或
const API_BASE_URL = 'http://localhost:3000'; // 开发环境
```

### 2. 登录认证

1. 点击扩展图标，打开 Popup
2. 点击"登录"按钮
3. 在打开的页面中登录你的账户
4. 登录成功后，扩展会自动获取并缓存你的 Token

**注意**：Token 存储在 Chrome 的本地存储中，不会上传到第三方服务器。

## 🚀 使用方法

### 方法一：右键菜单（推荐）

1. **绑定字段**：
   - 在表单字段上右键点击
   - 选择"绑定字段到..." → 选择对应的字段类型
   - 例如：`first name` → `名字 (First Name)`

2. **扫描表单**：
   - 在页面上右键点击
   - 选择"扫描表单字段"
   - 扩展会自动识别页面上的所有表单字段

3. **自动填充**：
   - 在页面上右键点击
   - 选择"自动填充表单"
   - 扩展会根据已保存的映射规则自动填充

### 方法二：Popup 界面

1. **打开 Popup**：
   - 点击浏览器工具栏上的扩展图标

2. **扫描表单**：
   - 点击"🔍 扫描表单"按钮
   - 查看检测到的字段列表

3. **自动填充**：
   - 点击"✨ 自动填充"按钮
   - 扩展会自动填充所有已映射的字段

4. **查看映射**：
   - 在 Popup 中查看"已保存的映射"列表
   - 可以删除不需要的映射

## 📋 支持的字段类型

### 基本信息
- `given_name` - 名字 (First Name)
- `family_name` - 姓 (Last Name)
- `fullName` - 全名 (Full Name)
- `email` - 邮箱 (Email)
- `phone` - 电话 (Phone)
- `dob` / `birthday` - 出生日期 (Date of Birth)
- `nationality` - 国籍 (Nationality)

### 地址信息
- `address` - 地址 (Address)
- `city` - 城市 (City)
- `country` - 国家 (Country)

### 教育背景
- `school_name` - 学校名称 (School Name)
- `degree` - 学位 (Degree)
- `major` - 专业 (Major)
- `gpa` - 成绩 (GPA)

### 文书
- `personal_statement` - 个人陈述 (Personal Statement)
- `statement_of_purpose` - 目的陈述 (Statement of Purpose)
- `essay` - 短文 (Essay)
- `motivation_letter` - 动机信 (Motivation Letter)

### 其他
- `resume` - 简历 (Resume)
- `recommendation` - 推荐信 (Recommendation)

## 🎯 工作流程示例

### 第一次使用（新网站）

1. **访问学校申请网站**
   - 例如：`https://apply.stanford.edu`

2. **扫描表单**
   - 右键 → "扫描表单字段"
   - 或点击扩展图标 → "扫描表单"

3. **查看匹配结果**
   - 扩展会自动匹配字段
   - 在 Popup 中查看匹配的置信度

4. **手动绑定字段**（如果需要）
   - 右键点击未匹配的字段
   - 选择对应的字段类型
   - 扩展会保存映射规则

5. **自动填充**
   - 右键 → "自动填充表单"
   - 或点击扩展图标 → "自动填充"

### 再次使用（已保存映射）

1. **访问相同的网站**
   - 扩展会自动读取保存的映射规则

2. **直接填充**
   - 右键 → "自动填充表单"
   - 无需再次绑定字段

## 🔍 智能识别功能

扩展支持多种识别方式：

### 1. HTML 属性识别
- `id` 属性
- `name` 属性
- `placeholder` 属性
- `aria-label` 属性

### 2. 标签文本识别
- `<label for="...">` 关联
- 父容器中的标签
- 相邻的文本节点

### 3. 上下文分析
- 表单区块标题
- 附近字段的上下文
- 字段顺序规律

### 4. 智能匹配
- 关键字匹配（支持中英文）
- 模糊匹配
- 类型检查（email, tel, date 等）

## 🛠️ 调试功能

### 查看调试信息

1. 打开 Popup
2. 展开"调试信息"部分
3. 查看详细的字段信息和匹配结果

### 清除缓存

1. 打开 Popup
2. 点击"🗑️ 清除缓存"
3. 清除所有本地缓存和映射规则

## ⚠️ 注意事项

1. **数据安全**
   - 所有数据存储在本地（Chrome Storage）
   - 映射规则会同步到后端（如果已登录）
   - 用户资料数据仅从你的后端 API 获取

2. **字段识别**
   - 某些动态加载的表单可能需要等待页面完全加载
   - 如果自动识别不准确，请使用手动绑定功能

3. **填充时机**
   - 建议在表单完全加载后再执行填充
   - 某些网站可能有防自动填充机制

4. **浏览器兼容性**
   - 目前仅支持 Chrome/Edge（Chromium 内核）
   - 需要 Manifest V3 支持

## 🐛 常见问题

### Q: 扩展无法识别字段？
A: 
- 检查页面是否完全加载
- 尝试手动扫描表单
- 某些网站可能使用了 iframe，需要特殊处理

### Q: 填充后字段没有值？
A:
- 检查用户资料是否完整
- 查看字段映射是否正确
- 某些网站可能需要触发特定事件

### Q: 如何删除映射规则？
A:
- 在 Popup 中查看"已保存的映射"
- 点击字段旁边的删除按钮

### Q: Token 过期怎么办？
A:
- 重新登录
- 扩展会自动更新 Token

## 📝 开发说明

### 文件结构

```
chrome-extension/
├── manifest.json      # 扩展配置
├── background.js      # 后台脚本（API、消息路由）
├── content.js         # 内容脚本（字段识别、填充）
├── popup.html         # Popup 界面
├── popup.js           # Popup 逻辑
├── popup.css          # Popup 样式
└── icons/             # 图标资源
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

### 消息通信

扩展使用 Chrome 消息 API 进行通信：

- `content.js` ↔ `background.js`：字段扫描、填充执行
- `popup.js` ↔ `background.js`：获取数据、触发操作
- `background.js` ↔ `后端 API`：数据同步、用户认证

### 数据存储

使用 Chrome Storage API：

- `autofill_user_token`：用户认证 Token
- `autofill_mappings`：字段映射规则（按域名组织）
- `autofill_profile`：用户资料缓存
- `autofill_settings`：扩展设置

## 🎨 图标资源

扩展需要以下尺寸的图标：
- `icon16.png` - 16x16（工具栏）
- `icon32.png` - 32x32（扩展管理页面）
- `icon48.png` - 48x48（扩展详情页）
- `icon128.png` - 128x128（Chrome Web Store）

**注意**：当前版本使用占位图标，生产环境需要替换为实际图标。

## 🔄 更新日志

### v1.0.0 (当前版本)
- ✅ 基础字段识别功能
- ✅ 智能匹配算法
- ✅ 右键菜单绑定
- ✅ Popup 调试界面
- ✅ 自动填充功能
- ✅ 本地缓存机制

## 📞 支持

如有问题或建议，请：
1. 查看 `ARCHITECTURE.md` 了解系统架构
2. 查看代码注释了解实现细节
3. 提交 Issue 或 Pull Request

