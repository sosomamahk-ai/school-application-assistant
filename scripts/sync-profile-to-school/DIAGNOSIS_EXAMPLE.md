# 诊断报告示例

本文档展示了当 `school_profile_type` 字段为 null 时，脚本生成的诊断报告示例。

## 示例场景

假设同步了 10 条 WordPress profile posts，其中 5 条的 `school_profile_type` 字段为 null。

## 控制台输出示例

```
[2024-01-01T12:00:00.000Z] [INFO] 开始拉取 WordPress posts...
[2024-01-01T12:00:00.500Z] [INFO] 拉取到 10 条 posts
[2024-01-01T12:00:01.000Z] [INFO] 开始处理 posts...
[2024-01-01T12:00:01.100Z] [WARN] Post ID 123 字段诊断:

诊断报告 - WP Post ID: 123 (example-school-1)
────────────────────────────────────────────────────────────

字段: profileType
  状态: 不存在
  预期路径: acf.school_profile_type
  可能原因:
    - ACF 对象不存在于 API 响应中
    - ACF 字段 "school_profile_type" 不存在
  建议操作:
    - 检查 ACF to REST API 插件是否已安装并启用
    - 检查 ACF 字段是否设置了 show_in_rest = true
    - 确认 REST API 端点是否支持 ACF 字段
    - 检查 ACF 字段名是否正确（注意大小写、下划线）
    - 确认该 post 在 WordPress 后台是否已填写该字段
    - 如果使用 WPML/Polylang，尝试添加 ?lang=zh 参数
    - 检查 REST API 缓存：尝试添加 ?cache-bust=1704110400000 参数
  验证命令:
    curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' -H 'Accept: application/json'

────────────────────────────────────────────────────────────
[2024-01-01T12:00:02.000Z] [INFO] 进度: 10/10 (100.0%)
[2024-01-01T12:00:03.000Z] [INFO] 开始同步到数据库...
[2024-01-01T12:00:04.000Z] [INFO] ═══════════════════════════════════════════════════════════
[2024-01-01T12:00:04.000Z] [INFO] 同步摘要 (Sync Summary)
[2024-01-01T12:00:04.000Z] [INFO] ═══════════════════════════════════════════════════════════
[2024-01-01T12:00:04.000Z] [INFO] 总共拉取: 10 条记录
[2024-01-01T12:00:04.000Z] [INFO] 成功同步: 10 条
[2024-01-01T12:00:04.000Z] [INFO] 创建新记录: 8 条
[2024-01-01T12:00:04.000Z] [INFO] 更新记录: 2 条
[2024-01-01T12:00:04.000Z] [INFO] 跳过: 0 条
[2024-01-01T12:00:04.000Z] [INFO] 错误: 0 条
[2024-01-01T12:00:04.000Z] [INFO] 缺失字段: 5 条记录

[2024-01-01T12:00:04.000Z] [WARN] 
[2024-01-01T12:00:04.000Z] [WARN] 缺失字段详情（前 10 条）:
[2024-01-01T12:00:04.000Z] [WARN]   WP Post ID 123 - 字段 "profileType":
[2024-01-01T12:00:04.000Z] [WARN]     可能原因: ACF 对象不存在于 API 响应中; ACF 字段 "school_profile_type" 不存在
[2024-01-01T12:00:04.000Z] [WARN]     验证命令: curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' -H 'Accept: application/json'
[2024-01-01T12:00:04.000Z] [WARN]   WP Post ID 124 - 字段 "profileType":
[2024-01-01T12:00:04.000Z] [WARN]     可能原因: ACF 对象不存在于 API 响应中; ACF 字段 "school_profile_type" 不存在
[2024-01-01T12:00:04.000Z] [WARN]     验证命令: curl 'http://localhost:3000/wp-json/wp/v2/profile/124?_embed' -H 'Accept: application/json'
[2024-01-01T12:00:04.000Z] [INFO] ═══════════════════════════════════════════════════════════
[2024-01-01T12:00:04.000Z] [INFO] ✅ 同步完成！请运行 npx prisma studio 验证数据
[2024-01-01T12:00:04.000Z] [INFO] 
[2024-01-01T12:00:04.000Z] [INFO] 验证步骤:
[2024-01-01T12:00:04.000Z] [INFO] 1. 运行 npx prisma studio 打开数据库查看
[2024-01-01T12:00:04.000Z] [INFO] 2. 检查 School 表中应有 10 条记录（或更多，如果之前已有记录）
[2024-01-01T12:00:04.000Z] [INFO] 3. 成功同步的记录数: 10
```

## JSONL 审计日志示例

```json
{
  "wpPostId": 123,
  "wpPostSlug": "example-school-1",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "fetchedFields": {
    "wpId": {
      "value": "123",
      "source": "post_field",
      "rawData": 123,
      "present": true,
      "path": ["id"]
    },
    "nameEnglish": {
      "value": "Example School 1",
      "source": "acf",
      "rawData": "Example School 1",
      "present": true,
      "path": ["acf", "name", "english"]
    },
    "nameShort": {
      "value": "ES1",
      "source": "acf",
      "rawData": "ES1",
      "present": true,
      "path": ["acf", "name", "short"]
    },
    "profileType": {
      "value": null,
      "source": "acf",
      "rawData": null,
      "present": false,
      "path": ["acf", "school", "profile", "type"]
    }
  },
  "dbStatus": "created",
  "dbId": "clx123abc456def789",
  "diagnoses": [
    {
      "fieldName": "profileType",
      "present": false,
      "value": null,
      "rawPath": ["acf", "school_profile_type"],
      "possibleReasons": [
        "ACF 对象不存在于 API 响应中",
        "ACF 字段 \"school_profile_type\" 不存在"
      ],
      "suggestions": [
        "检查 ACF to REST API 插件是否已安装并启用",
        "检查 ACF 字段是否设置了 show_in_rest = true",
        "确认 REST API 端点是否支持 ACF 字段",
        "检查 ACF 字段名是否正确（注意大小写、下划线）",
        "确认该 post 在 WordPress 后台是否已填写该字段",
        "如果使用 WPML/Polylang，尝试添加 ?lang=zh 参数",
        "检查 REST API 缓存：尝试添加 ?cache-bust=1704110400000 参数"
      ],
      "curlExample": "curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' -H 'Accept: application/json'"
    }
  ]
}
```

## 诊断步骤指南

### 步骤 1: 验证 WordPress API 响应

使用诊断报告中提供的 curl 命令验证 API 响应：

```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.'
```

检查响应中是否包含 `acf` 对象：

```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.acf'
```

如果 `acf` 为 null 或不存在，说明 ACF to REST API 插件未启用或配置错误。

### 步骤 2: 检查 ACF 字段是否存在

如果 `acf` 对象存在，检查字段名：

```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.acf | keys'
```

查看实际的字段名称列表，确认 `school_profile_type` 是否存在，或是否有类似的字段名（可能是 `schoolProfileType`、`school_profileType` 等）。

### 步骤 3: 检查 WordPress 后台

1. 登录 WordPress 后台
2. 编辑该 profile post
3. 检查 ACF 字段组是否显示
4. 确认 `school_profile_type` 字段是否有值

### 步骤 4: 检查 ACF 配置

1. 进入 ACF → 字段组
2. 找到包含 `school_profile_type` 的字段组
3. 编辑该字段组
4. 检查 "位置规则" 是否包含 "Post Type" 等于 "profile"
5. 检查字段的 "字段名称"（Field Name）是否为 `school_profile_type`

### 步骤 5: 验证 ACF to REST API

1. 确认 "ACF to REST API" 插件已安装并激活
2. 或在 ACF 字段设置中，确保 "Show in REST API" 已启用

### 步骤 6: 多语言插件检查

如果使用 WPML 或 Polylang：

```bash
# 检查主语言版本
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?lang=en&_embed' | jq '.acf.school_profile_type'

# 检查中文版本
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?lang=zh&_embed' | jq '.acf.school_profile_type'
```

### 步骤 7: 清除缓存

如果怀疑是缓存问题：

```bash
curl 'http://localhost:3000/wp-json/wp/v2/profile/123?cache-bust=1704110400000&_embed' | jq '.acf.school_profile_type'
```

或在 WordPress 后台清除缓存。

## 常见情况分析

### 情况 1: 所有 profile 都缺少该字段

**可能原因**: ACF 配置问题，而非单个 post 的问题

**解决方案**: 
- 检查 ACF 字段组是否正确分配给了 `profile` post type
- 检查 ACF to REST API 插件配置

### 情况 2: 只有部分 profile 缺少该字段

**可能原因**: 
- 这些 post 在后台确实未填写该字段
- 多语言插件的语言版本问题

**解决方案**: 
- 在 WordPress 后台为这些 post 填写字段
- 检查多语言版本

### 情况 3: ACF 对象完全不存在

**可能原因**: 
- ACF to REST API 插件未安装
- REST API 端点不支持 ACF

**解决方案**: 
- 安装并启用 ACF to REST API 插件
- 或使用其他方式将 ACF 字段暴露到 REST API

## 脚本输出建议

当脚本检测到所有 profile 的 `school_profile_type` 都为 null 时，会输出类似以下的信息：

```
⚠️  警告: 检测到所有 profile 的 school_profile_type 字段都为 null

可能的原因:
1. ACF to REST API 插件未安装或未启用
2. ACF 字段未设置 show_in_rest = true
3. ACF 字段组未分配给 profile post type

建议检查步骤:
1. 验证 ACF 字段是否存在:
   curl 'http://localhost:3000/wp-json/wp/v2/profile/123?_embed' | jq '.acf'

2. 如果 acf 为 null，安装并启用 ACF to REST API 插件

3. 如果 acf 存在但没有 school_profile_type 字段，检查:
   - WordPress 后台 ACF 字段设置
   - 字段名称是否正确（注意大小写、下划线）
   - 字段组是否已分配给 profile post type
```

