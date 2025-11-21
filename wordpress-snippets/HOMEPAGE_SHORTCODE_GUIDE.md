# Sosomama.com 主页 Shortcode 使用指南

## 📋 简介

这个 shortcode 可以为你的 WordPress 网站创建一个美观的主页，显示 `ranking` 和 `profile` 两种自定义文章类型的文章列表。

## 🎨 特色

- ✅ 使用 SteelBlue 色系设计
- ✅ 响应式布局，适配手机、平板、桌面
- ✅ 显示 ranking 类型的文章列表
- ✅ 按类别显示 profile 类型的文章：
  - 香港国际学校
  - 香港本地中学
  - 香港本地小学
  - 香港幼稚园
- ✅ 支持特色图片和 ACF 字段图片
- ✅ 自动检测文章类别（支持 taxonomy、meta、ACF）
- ✅ 悬停动画效果

## 📥 安装步骤

### 1. 复制代码到 WordPress

1. 登录 WordPress 后台
2. 安装并激活 **Code Snippets** 插件（如果没有安装）
3. 进入 **Snippets** → **Add New**
4. 将 `homepage-shortcode.php` 文件中的 PHP 代码复制进去
5. 设置代码片段标题：`Sosomama 主页 Shortcode`
6. 点击 **Save Changes and Activate**

### 2. 在页面中使用

#### 方法一：在 WordPress 编辑器中使用

1. 创建一个新页面（Pages → Add New）
2. 或者编辑现有主页
3. 在内容编辑器中直接输入：

```
[sosomama_homepage]
```

#### 方法二：在 Elementor 或其他页面构建器中使用

1. 在 Elementor 中添加一个 **Shortcode** 小部件
2. 在小部件中输入：`[sosomama_homepage]`

#### 方法三：在主题模板中使用

在你的主题模板文件中（如 `page-home.php` 或 `front-page.php`）添加：

```php
<?php echo do_shortcode('[sosomama_homepage]'); ?>
```

## ⚙️ 短代码参数

短代码支持以下可选参数：

| 参数 | 说明 | 默认值 | 示例 |
|------|------|--------|------|
| `ranking_posts` | 显示多少个 ranking 文章 | 10 | `[sosomama_homepage ranking_posts="5"]` |
| `profile_posts` | 每个类别显示多少个 profile 文章 | 12 | `[sosomama_homepage profile_posts="8"]` |
| `show_ranking` | 是否显示 ranking 部分（yes/no） | yes | `[sosomama_homepage show_ranking="no"]` |
| `show_profile` | 是否显示 profile 部分（yes/no） | yes | `[sosomama_homepage show_profile="no"]` |

### 使用示例

```php
// 基本使用
[sosomama_homepage]

// 只显示 ranking，显示 5 篇文章
[sosomama_homepage ranking_posts="5" show_profile="no"]

// 只显示 profile，每个类别显示 8 篇文章
[sosomama_homepage show_ranking="no" profile_posts="8"]

// 自定义数量
[sosomama_homepage ranking_posts="6" profile_posts="10"]
```

## 🎯 数据获取逻辑

### Ranking 文章

shortcode 会从 WordPress 的 `ranking` 自定义文章类型中获取已发布的文章，按发布日期倒序排列。

### Profile 文章（按类别）

shortcode 会尝试多种方式获取文章的类别：

1. **Taxonomy（推荐）**：如果注册了 `school_category` taxonomy
2. **Post Meta**：检查 `category` 或 `school_category` meta 字段
3. **ACF 字段**：如果安装了 ACF 插件，会检查 `category` 或 `school_category` ACF 字段

### 图片获取

文章图片的获取优先级：

1. **特色图片**（Featured Image）
2. **ACF Logo 字段**：如果安装了 ACF 插件，会检查 `logo` 字段

## 🔧 自定义类别

如果你的网站使用的类别名称不同，可以修改代码中的类别数组：

```php
$profile_categories = array(
    '你的类别1',
    '你的类别2',
    '你的类别3',
    '你的类别4'
);
```

在第 47 行左右找到这个数组并修改。

## 🎨 自定义样式

样式已经内嵌在代码中。如果需要修改颜色，可以搜索以下颜色代码并替换：

- `#4682B4` - SteelBlue（主色）
- `#2F4F4F` - DarkSlateGray（标题色）
- `#B0C4DE` - LightSteelBlue（边框色）

## 📱 响应式设计

短代码会自动适配不同屏幕尺寸：

- **桌面**：每行 3-4 个卡片
- **平板**：每行 2-3 个卡片
- **手机**：每行 1 个卡片

## ❓ 常见问题

### Q: 没有显示文章？

**A:** 请检查：
1. 确保有已发布的 `ranking` 或 `profile` 类型的文章
2. 确保文章状态为 "Published"（已发布）
3. 检查文章是否有正确的类别设置

### Q: 类别名称不匹配？

**A:** 确保文章的类别名称与代码中的完全一致（区分大小写）：
- 香港国际学校
- 香港本地中学
- 香港本地小学
- 香港幼稚园

### Q: 图片不显示？

**A:** 请检查：
1. 文章是否设置了特色图片
2. 如果使用 ACF，确保 `logo` 字段已正确配置
3. 图片 URL 是否可访问

### Q: 如何添加更多类别？

**A:** 修改代码中的 `$profile_categories` 数组，添加新的类别名称。

### Q: 样式冲突？

**A:** 如果与主题样式冲突，可以：
1. 在样式前添加更具体的选择器
2. 使用 `!important`（不推荐）
3. 联系主题开发者调整

## 🔗 相关文件

- `homepage-shortcode.php` - Shortcode 主文件
- 其他 WordPress 集成文件在 `wordpress-snippets/` 目录

## 📞 技术支持

如果遇到问题，请检查：
1. WordPress 版本是否兼容
2. PHP 版本是否 >= 7.4
3. 错误日志（WordPress Debug Log）

---

**版本**: 1.0.0  
**最后更新**: 2024

