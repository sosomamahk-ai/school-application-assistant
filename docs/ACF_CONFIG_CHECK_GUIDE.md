# ACF 配置检查和修复指南

本指南帮助您检查并修复 WordPress ACF (Advanced Custom Fields) 相关配置问题。

## 问题概述

需要检查以下三个关键配置：

1. **ACF to REST API 插件是否安装并激活**
2. **ACF 字段名是否为 `name_short`**
3. **ACF 字段是否设置为在 REST API 中可见**

## 方法一：使用 Node.js 脚本检查（推荐）

### 运行检查

```bash
npm run check:acf-config
```

### 脚本功能

此脚本会：

1. **检查 ACF to REST API 插件**
   - 测试 `/wp-json/acf/v3/` 端点是否可用
   - 测试 `/wp-json/acf/v2/` 端点（旧版本）
   - 检查标准 REST API 是否返回 ACF 数据

2. **检查 ACF 字段名**
   - 从 WordPress REST API 获取 profile 数据
   - 检查是否存在 `name_short` 字段
   - 查找类似的字段名（如 `nameShort`, `name-short` 等）

3. **检查 ACF 字段在 REST API 中可见**
   - 验证标准 REST API 返回的 ACF 数据
   - 统计有多少 profile 包含 ACF 数据
   - 检查 ACF REST API 端点是否可用

### 输出示例

```
🔍 开始检查 ACF 配置...

WordPress URL: https://your-wordpress-site.com

============================================================

🔍 检查 1: ACF to REST API 插件是否安装并激活...
✅ ACF to REST API 插件已安装并激活

🔍 检查 2: ACF 字段名是否为 name_short...
✅ 找到 name_short 字段

🔍 检查 3: ACF 字段是否在 REST API 中可见...
✅ 所有 profile 的 ACF 数据在 REST API 中可见 (10/10)

============================================================
📊 检查结果总结

✅ 通过: 3 | ⚠️  警告: 0 | ❌ 失败: 0
============================================================
```

## 方法二：使用 WordPress 管理界面检查

### 安装检查工具

1. 将 `wordpress-snippets/check-acf-config.php` 文件内容复制到 WordPress
2. 可以通过以下方式之一添加：
   - **Code Snippets 插件**：创建新代码片段并启用
   - **functions.php**：添加到主题的 `functions.php` 文件
   - **自定义插件**：创建独立插件

### 使用检查工具

1. 登录 WordPress 后台
2. 进入 **工具** → **ACF 配置检查**
3. 点击 **运行检查** 按钮
4. 查看检查结果和修复建议

### 检查结果说明

- ✅ **通过**：配置正确，无需操作
- ⚠️ **警告**：配置可能有问题，建议检查
- ❌ **失败**：配置有问题，需要修复

## 修复指南

### 问题 1: ACF to REST API 插件未安装

#### 症状
- 检查结果显示插件未安装或未激活
- WordPress REST API 返回的 `acf` 字段为空

#### 解决方案

1. **安装插件**
   - 进入 WordPress 后台 → **插件** → **安装插件**
   - 搜索 "ACF to REST API"
   - 点击 **立即安装**，然后 **激活**

2. **或手动安装**
   - 从 https://wordpress.org/plugins/acf-to-rest-api/ 下载
   - 上传到 `/wp-content/plugins/` 目录
   - 在 WordPress 后台激活插件

3. **验证安装**
   - 访问 `https://your-site.com/wp-json/acf/v3/profile/1`
   - 应该返回 ACF 数据（即使为空对象）

### 问题 2: ACF 字段名不是 `name_short`

#### 症状
- 检查结果显示未找到 `name_short` 字段
- 但可能找到了类似的字段（如 `nameShort`, `school_short_name` 等）

#### 解决方案

**选项 A：重命名字段（推荐）**

1. 进入 WordPress 后台 → **自定义字段** → **字段组**
2. 找到包含相关字段的字段组
3. 编辑字段，将字段名改为 `name_short`
4. 保存字段组

**选项 B：更新代码以使用现有字段名**

如果无法重命名字段，可以更新代码以使用找到的字段名：

1. 查看检查结果中显示的字段名
2. 更新 `src/services/wordpressSchoolService.ts` 中的字段提取逻辑
3. 添加对新字段名的支持

### 问题 3: ACF 字段在 REST API 中不可见

#### 症状
- WordPress REST API 返回的 `acf` 字段为空对象 `{}` 或空数组 `[]`
- 即使字段存在，REST API 也无法访问

#### 解决方案

1. **启用字段组的 REST API 可见性**

   - 进入 WordPress 后台 → **自定义字段** → **字段组**
   - 编辑包含 `name_short` 字段的字段组
   - 在字段组设置中，找到 **Show in REST API** 选项
   - 启用该选项
   - 保存字段组

2. **检查字段组位置规则**

   - 确保字段组的 **Location Rules** 应用到正确的 post type
   - 对于学校 profile，应该应用到 `profile` post type

3. **ACF Pro 用户**

   - 如果使用 ACF Pro，检查 **REST API** 设置
   - 确保字段组和字段都启用了 REST API 支持

4. **验证修复**

   ```bash
   # 运行检查脚本
   npm run check:acf-config
   
   # 或直接测试 API
   curl "https://your-site.com/wp-json/wp/v2/profile/1?_embed&acf_format=standard"
   ```

   应该能在响应中看到 `acf.name_short` 字段。

## 手动验证

### 测试 WordPress REST API

```bash
# 测试标准 REST API
curl "https://your-site.com/wp-json/wp/v2/profile/1?_embed&acf_format=standard"

# 测试 ACF REST API（如果安装了插件）
curl "https://your-site.com/wp-json/acf/v3/profile/1"
```

### 检查响应

正确的响应应该包含：

```json
{
  "id": 1,
  "title": {...},
  "acf": {
    "name_short": "学校简称",
    ...
  }
}
```

## 常见问题

### Q: 检查脚本显示插件已安装，但 API 仍返回空数据

**A:** 可能的原因：
1. 插件已安装但未正确激活
2. 字段组未设置为在 REST API 中可见
3. 缓存问题，尝试清除 WordPress 缓存

### Q: 字段名检查找到了 `nameShort` 而不是 `name_short`

**A:** 有两个选择：
1. **重命名字段**：在 ACF 中将字段名改为 `name_short`（推荐）
2. **更新代码**：修改代码以同时支持 `nameShort` 和 `name_short`

### Q: 部分 profile 有 ACF 数据，部分没有

**A:** 可能的原因：
1. 字段组的位置规则未应用到所有 profile
2. 某些 profile 使用了不同的字段组
3. 检查字段组的 **Location Rules** 设置

## 相关脚本

- `npm run check:acf-config` - 运行完整的 ACF 配置检查
- `npm run test:wordpress-acf` - 测试 WordPress ACF 数据获取
- `npm run check:wordpress-name-short` - 检查 WordPress API 返回的 name_short 数据

## 相关文档

- [NAME_SHORT_FIX_SUMMARY.md](../NAME_SHORT_FIX_SUMMARY.md) - name_short 修复总结
- [WORDPRESS_API_TROUBLESHOOTING_GUIDE.md](../WORDPRESS_API_TROUBLESHOOTING_GUIDE.md) - WordPress API 故障排除指南

