# 模板管理页面重构迁移指南

## 📋 概述

本次重构将模板管理页面从基于数据库模板列表改为基于 WordPress `school_profile` (post type) 的列表视图，并按 `profile_type` taxonomy 分类展示。

## 🎯 重构目标

- ✅ 基于 WordPress `school_profile` post type 显示学校列表
- ✅ 按 `profile_type` taxonomy 分类，使用 Tab 标签页展示
- ✅ 建立 profile ↔ template 的数据映射
- ✅ 支持所有模板操作（创建、编辑、删除、启用/禁用、预览、导出）

## 📁 文件结构

### 新增文件

```
src/
├── pages/
│   ├── admin/
│   │   └── templates-v2.tsx          # 新的模板管理页面（基于 WordPress）
│   └── api/
│       ├── wordpress/
│       │   └── school-profiles.ts     # 获取 WordPress profiles 并建立模板映射
│       └── admin/
│           └── templates/
│               └── create-from-profile.ts  # 从 WordPress profile 创建模板
└── api/
    └── admin/
        └── templates/
            └── [id].ts                # 更新：支持 PATCH 方法更新模板状态
```

### 修改的文件

- `src/pages/api/admin/templates/[id].ts` - 添加了 PATCH 方法支持更新模板状态

## 🔧 WordPress 数据要求

### Post Type

- **Post Type**: `school_profile`
- **REST API 端点**: `/wp-json/wp/v2/school_profile?per_page=100`

### Taxonomy

- **Taxonomy**: `profile_type`
- **支持的分类**:
  - 国际学校
  - 本地中学
  - 本地小学
  - 幼稚园

### ACF 字段

- **name_short**: 学校简称（可选）

## 📡 API 端点说明

### 1. 获取学校档案列表（带模板映射）

**端点**: `GET /api/wordpress/school-profiles`

**响应格式**:
```json
{
  "success": true,
  "profiles": {
    "国际学校": [...],
    "本地中学": [...],
    "本地小学": [...],
    "幼稚园": [...]
  },
  "stats": {
    "total": 100,
    "withTemplate": 50,
    "withoutTemplate": 50,
    "byType": {
      "国际学校": 30,
      "本地中学": 25,
      "本地小学": 25,
      "幼稚园": 20
    }
  }
}
```

### 2. 从 WordPress Profile 创建模板

**端点**: `POST /api/admin/templates/create-from-profile`

**请求体**:
```json
{
  "profileId": 123,
  "profileType": "profile",
  "baseTemplateId": "optional-base-template-id"
}
```

### 3. 更新模板状态

**端点**: `PATCH /api/admin/templates/[id]`

**请求体**:
```json
{
  "isActive": true
}
```

## 🎨 UI 功能说明

### Tab 标签页

页面顶部显示四个 Tab：
- 国际学校
- 本地中学
- 本地小学
- 幼稚园

每个 Tab 显示对应分类的学校数量。

### 表格列

每行显示以下信息：

1. **学校名称** - WordPress post title
2. **简称 (name_short)** - ACF 字段 `name_short`
3. **学校类别** - `profile_type` taxonomy
4. **模版 ID** - 如果已创建模板，显示模板 ID
5. **字段数** - 模板中的字段数量
6. **模版状态** - "待创建" 或 "已创建"
7. **操作按钮** - 根据状态显示不同操作

### 操作按钮

#### 待创建状态（无模板）

- **创建模板** - 基于此 WordPress profile 创建模板

#### 已创建状态（有模板）

- **启用/禁用** - Toggle switch，实时更新模板启用状态
- **预览** - 预览模板
- **编辑** - 编辑模板
- **导出为 JSON** - 导出模板数据
- **删除** - 删除模板（垃圾箱 icon）

## 🔄 数据映射逻辑

### Profile → Template 映射

模板的 `schoolId` 字段使用以下格式：
```
wp-{type}-{id}
```

例如：
- `wp-profile-123` - WordPress profile ID 123
- `wp-university-456` - WordPress university ID 456

### 映射建立过程

1. 从 WordPress REST API 获取所有 `school_profile` posts
2. 从数据库获取所有模板
3. 解析每个模板的 `schoolId`，提取 WordPress ID
4. 建立映射关系：`profile-{id}` → template

## 🚀 使用步骤

### 1. 访问新页面

访问 `/admin/templates-v2` 查看新的模板管理页面。

### 2. 查看分类

点击顶部的 Tab 标签页，查看不同类别的学校列表。

### 3. 创建模板

对于"待创建"状态的学校，点击"创建模板"按钮。

### 4. 管理模板

对于"已创建"状态的学校，可以使用各种操作按钮进行管理。

## ⚠️ 注意事项

### WordPress API 配置

确保以下环境变量已配置：
- `WORDPRESS_BASE_URL` 或 `NEXT_PUBLIC_WORDPRESS_BASE_URL`

### Taxonomy 数据

确保 WordPress 中的 `profile_type` taxonomy 正确分类：
- 如果 taxonomy 值不匹配，会默认归类到"国际学校"
- 支持以下别名映射：
  - `香港国际学校` → `国际学校`
  - `香港本地中学` → `本地中学`
  - `香港本地小学` → `本地小学`
  - `香港幼稚园` → `幼稚园`

### 模板创建

- 创建模板时会自动使用 WordPress profile 的标题和 ACF 字段
- 如果提供了 `baseTemplateId`，会复制基础模板的字段结构
- 模板的 `schoolId` 会自动设置为 `wp-profile-{id}` 格式

## 🔍 故障排查

### 问题：无法加载学校列表

1. 检查 WordPress API 是否可访问
2. 检查环境变量 `WORDPRESS_BASE_URL` 是否正确配置
3. 检查 WordPress REST API 端点 `/wp-json/wp/v2/school_profile` 是否返回数据

### 问题：分类不正确

1. 检查 WordPress 中的 `profile_type` taxonomy 值
2. 检查 ACF 字段 `profile_type` 是否存在
3. 查看浏览器控制台的错误信息

### 问题：模板映射失败

1. 检查模板的 `schoolId` 格式是否正确（应为 `wp-profile-{id}`）
2. 检查 WordPress profile ID 是否匹配
3. 查看服务器日志中的错误信息

## 📝 后续优化建议

1. **搜索功能** - 添加搜索框，支持按学校名称搜索
2. **批量操作** - 支持批量创建、删除模板
3. **导入/导出** - 支持批量导入/导出模板
4. **统计图表** - 添加模板创建率、使用率等统计图表
5. **同步功能** - 定期同步 WordPress 数据，确保数据一致性

## 🔗 相关文档

- [WordPress REST API 文档](https://developer.wordpress.org/rest-api/)
- [ACF 字段文档](https://www.advancedcustomfields.com/resources/)
- [原模板管理页面](./TEMPLATE_AUTO_GENERATION_FEATURE.md)

