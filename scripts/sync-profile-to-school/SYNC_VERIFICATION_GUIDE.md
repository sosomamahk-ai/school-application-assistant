# 同步验证和重新同步指南

## 📋 问题说明

您发现数据库中的 `school_profile_type` 字段为 `null`，这是因为：

1. **两个字段已分开存储**：现在 ACF 字段和 Taxonomy 字段分别存储在不同的列中
   - `school_profile_type` (数据库字段) ← ACF 字段 `acf.school_profile_type`
   - `profileType` (数据库字段) ← Taxonomy `taxonomy.profile_type`

2. **旧数据需要重新同步**：之前同步的记录使用了旧的映射逻辑，需要重新同步来填充这些字段

## ✅ 当前状态

- ✅ 字段映射已修复：ACF 和 Taxonomy 分别映射到不同的数据库字段
- ✅ 字段提取逻辑正常工作
- ✅ 数据写入逻辑正常工作
- ✅ 已创建验证和重新同步工具

## 🔍 验证同步状态

### 1. 查看整体统计

```bash
npm run sync:profile-to-school:verify
```

输出示例：
```
总记录数: 6788
有 wpId 的记录数: 6784 (99.9%)

school_profile_type (ACF 字段):
  总数: 6784
  已填充: 109 (1.6%)
  为空: 6675 (98.4%)

profileType (Taxonomy 字段):
  总数: 6784
  已填充: 11 (0.2%)
  为空: 6773 (99.8%)
```

### 2. 验证单条记录

验证特定 wpId 的记录，比较数据库和 WordPress 数据：

```bash
npm run sync:profile-to-school:verify -- --wp-id <wpId>
```

例如：
```bash
npm run sync:profile-to-school:verify -- --wp-id 35899
```

这会显示：
- ✅ 数据库中的当前值
- ✅ WordPress 原始数据（ACF 和 Taxonomy）
- ✅ 提取的字段值
- ✅ 数据是否匹配

## 🔄 重新同步缺失字段

如果验证发现字段为 `null` 但 WordPress 中有数据，可以重新同步：

### 重新同步单条记录

```bash
npm run sync:profile-to-school:resync -- --wp-id <wpId>
```

### 批量重新同步（推荐）

```bash
# 重新同步前 100 条缺失字段的记录
npm run sync:profile-to-school:resync -- --limit 100
```

### 在 Prisma Studio 中查找需要同步的记录

1. 打开 Prisma Studio：
   ```bash
   npx prisma studio
   ```

2. 选择 `School` 表

3. 使用过滤器：
   - `wpId` is not null
   - AND `school_profile_type` is null
   - 或者 `profileType` is null

4. 记录下需要重新同步的 `wpId` 值

## 📊 字段说明

### 数据库字段映射

| 数据库字段 | 来源 | 说明 | 示例值 |
|-----------|------|------|--------|
| `school_profile_type` | ACF 字段 `acf.school_profile_type` | ACF 自定义字段，通常是单个字符代码 | "D", "C", "A" |
| `profileType` | Taxonomy `taxonomy.profile_type` | WordPress 分类术语的 slug | "hk-kg-template", "local-primary" |
| `nameEnglish` | ACF 字段 `acf.name_english` | 英文名称 | "Holy Cross Lutheran School" |
| `nameShort` | ACF 字段 `acf.name_short` | 简称 | "HCLS" |
| `country` | Taxonomy `taxonomy.country` | 国家/地区（术语名称） | "中国香港" |
| `location` | Taxonomy `taxonomy.location` | 位置（术语名称） | "荃湾" |
| `bandType` | Taxonomy `taxonomy.band-type` | 学校级别（术语 slug） | "974" |

### 为什么需要两个字段？

- **ACF 字段** (`school_profile_type`)：通常是字符代码，表示学校类型分类
- **Taxonomy 字段** (`profileType`)：是 WordPress 的分类术语，可能包含更详细的信息（如模板类型）

这两个字段包含不同的信息，应该分开存储。

## 🚀 批量重新同步建议

由于有 6675 条记录需要重新同步，建议分批进行：

### 方法 1: 使用脚本分批同步

```bash
# 第 1 批：100 条
npm run sync:profile-to-school:resync -- --limit 100

# 等待完成后，运行第 2 批
npm run sync:profile-to-school:resync -- --limit 100

# ... 依此类推，直到完成
```

### 方法 2: 重新同步全部记录

如果您想重新同步所有记录（包括已填充的），可以运行完整同步：

```bash
npm run sync:profile-to-school
```

这会：
- 从 WordPress 获取所有 profile posts
- 提取字段（包括 ACF 和 Taxonomy）
- 更新数据库中的记录（保留已有数据，只更新缺失字段）

## 🔧 调试单个记录

如果某个记录有问题，可以：

1. **验证记录**：
   ```bash
   npm run sync:profile-to-school:verify -- --wp-id <wpId>
   ```

2. **查看 WordPress 原始数据**：
   ```bash
   npm run sync:profile-to-school:test-post -- <wpId>
   ```

3. **查看字段提取结果**：
   ```bash
   npm run sync:profile-to-school:test-extraction -- <wpId>
   ```

4. **重新同步该记录**：
   ```bash
   npm run sync:profile-to-school:resync -- --wp-id <wpId>
   ```

## 📝 验证成功示例

```
验证记录: wpId=35899
═══════════════════════════════════════════════════════════
数据库记录:
  school_profile_type (ACF): D
  profileType (Taxonomy): hk-kg-template
  nameEnglish: 611 TREE OF LIFE KINDERGARTEN
  nameShort: 611TLK

WordPress 原始数据:
  ACF school_profile_type: D
  Taxonomy profile_type: 香港幼稚园

提取的字段:
  schoolProfileTypeFromACF: D (存在: true)
  profileTypeFromTaxonomy: hk-kg-template (存在: true)

比较结果:
  ✅ 数据同步正确
```

## ⚠️ 注意事项

1. **数据库连接**：如果遇到连接错误，脚本会自动重试
2. **并发控制**：重新同步脚本会自动限制并发，避免连接池耗尽
3. **数据安全**：重新同步只更新缺失的字段，不会覆盖已有数据
4. **性能**：批量重新同步会花费较长时间，建议分批进行

## 🎯 快速验证步骤

1. **查看整体状态**：
   ```bash
   npm run sync:profile-to-school:verify
   ```

2. **验证刚同步的记录**：
   ```bash
   npm run sync:profile-to-school:verify -- --wp-id 35899
   ```

3. **如果需要，批量重新同步**：
   ```bash
   npm run sync:profile-to-school:resync -- --limit 100
   ```

现在两个字段已经分开存储，不再冲突！✅

