# name_short 修复总结

## 问题诊断

经过验证，发现以下问题：

1. **WordPress REST API 返回的 ACF 数据为空**
   - WordPress unified endpoint (`/wp-json/schools/v1/list`) 返回的 `acf` 是空数组 `[]`
   - WordPress 标准 REST API (`/wp-json/wp/v2/profile/{id}`) 返回的 `acf` 是空对象 `{}`
   - 即使使用了 `acf_format=standard` 参数，ACF 数据仍然为空

2. **数据库中的 nameShort 字段为 null**
   - 所有模板的 School 记录中 `nameShort` 字段都是 `null`
   - `permalink` 字段已正确同步（从 `link` 字段获取）

## 已完成的修复

### 1. 数据库架构更新 ✅
- 在 `School` 模型中添加了 `nameShort` 和 `permalink` 字段
- 在 `SchoolFormTemplate` 模型中添加了 `applicationStartDate` 和 `applicationEndDate` 字段
- 已运行数据库迁移

### 2. API 更新 ✅
- 所有 GET schools / GET templates API 已更新，包含 `nameShort` 和 `permalink`
- WordPress fetcher 已更新，尝试从多个来源提取 `nameShort`
- WP-to-DB merge logic 已更新，保存 `nameShort` 和 `permalink`

### 3. 前端更新 ✅
- `/schools` 页面：学校名称可点击，跳转到 `permalink`，显示 `nameShort`（如果存在）
- `/admin/templates-v2` 页面：显示 `nameShort`（如果存在）
- `/admin/templates/edit/[id]` 页面：可编辑 `applicationStartDate` 和 `applicationEndDate`

### 4. 验证脚本 ✅
创建了以下验证和修复脚本：
- `npm run verify:name-short` - 验证和修复 name_short 数据
- `npm run fix:name-short` - 完整修复 name_short 数据
- `npm run check:wordpress-name-short` - 检查 WordPress API 返回的 name_short 数据
- `npm run test:wordpress-unified` - 测试 WordPress unified endpoint
- `npm run test:wordpress-acf` - 测试 WordPress ACF 数据获取
- `npm run check:acf-config` - **检查 ACF 配置（新增）** - 检查插件、字段名和 REST API 可见性

## 待解决的问题

### WordPress 端配置问题

WordPress REST API 没有返回 ACF 数据，需要检查以下配置：

1. **ACF to REST API 插件**
   - 确保安装了 "ACF to REST API" 或 "ACF to REST API (ACF 5)" 插件
   - 确保插件已激活并配置为在 REST API 中返回 ACF 字段

2. **ACF 字段配置**
   - 检查 ACF 字段名是否为 `name_short`（不是 `nameShort` 或其他）
   - 确保 ACF 字段已设置为在 REST API 中可见

3. **WordPress REST API 权限**
   - 检查是否有权限访问 ACF 字段
   - 某些 ACF 字段可能需要认证才能访问

## 临时解决方案

如果 WordPress 端暂时无法修复，可以：

1. **手动在数据库中设置 nameShort**
   ```sql
   UPDATE "School" SET "nameShort" = '简称' WHERE "templateId" = 'template-id';
   ```

2. **通过管理界面手动编辑**
   - 访问 `/admin/templates-v2` 页面
   - 查看学校信息，手动添加 `name_short`

3. **使用脚本批量导入**
   - 如果有其他数据源（如 CSV），可以创建导入脚本

## 验证步骤

运行以下命令验证修复：

```bash
# 1. 检查 ACF 配置（推荐首先运行）
npm run check:acf-config

# 2. 验证数据库架构
npm run prisma:studio

# 3. 验证 WordPress API
npm run test:wordpress-acf

# 4. 验证和修复数据
npm run fix:name-short

# 5. 验证构建
npm run build
```

**注意**：如果 `check:acf-config` 检查失败，请先按照 [ACF 配置检查指南](./docs/ACF_CONFIG_CHECK_GUIDE.md) 修复 WordPress 端配置。

## 代码变更总结

### 数据库变更
- `School.nameShort: String?` - 新增
- `School.permalink: String?` - 新增
- `SchoolFormTemplate.applicationStartDate: DateTime?` - 新增
- `SchoolFormTemplate.applicationEndDate: DateTime?` - 新增

### API 变更
- `/api/templates` - 返回 `nameShort` 和 `permalink`
- `/api/schools` - 返回 `nameShort` 和 `permalink`
- `/api/schools/list` - 返回 `nameShort` 和 `permalink`
- `/api/admin/templates/[id]` - 支持更新 `applicationStartDate` 和 `applicationEndDate`

### 前端变更
- `/schools` - 显示 `nameShort`，学校名称链接到 `permalink`
- `/admin/templates-v2` - 显示 `nameShort`
- `/admin/templates/edit/[id]` - 可编辑日期字段

## 下一步

1. **运行 ACF 配置检查**：`npm run check:acf-config` 或使用 WordPress 管理界面工具
2. **根据检查结果修复配置**：
   - 安装并激活 ACF to REST API 插件
   - 确保 ACF 字段名为 `name_short`
   - 启用字段组的 REST API 可见性
3. **验证修复**：重新运行 `npm run check:acf-config`
4. **同步数据**：运行 `npm run fix:name-short` 同步数据

详细修复指南请参考：[ACF 配置检查指南](./docs/ACF_CONFIG_CHECK_GUIDE.md)

