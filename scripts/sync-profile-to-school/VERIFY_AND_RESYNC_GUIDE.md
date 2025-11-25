# 验证和重新同步指南

## 问题说明

如果发现数据库中的字段（如 `school_profile_type`、`profileType` 等）为 `null`，可能是因为：

1. **旧数据**：在修复字段映射逻辑之前同步的记录
2. **字段缺失**：WordPress 中该字段确实为空
3. **映射冲突**：之前的代码将 ACF 和 Taxonomy 都映射到同一个字段

## 解决方案

### 1. 验证同步状态

查看整体同步统计：

```bash
npm run sync:profile-to-school:verify
```

这会显示：
- 总记录数
- 有 wpId 的记录数
- `school_profile_type` (ACF 字段) 的填充情况
- `profileType` (Taxonomy 字段) 的填充情况
- `nameEnglish` (ACF 字段) 的填充情况

### 2. 验证单条记录

验证特定记录的同步情况，并比较数据库和 WordPress 数据：

```bash
npm run sync:profile-to-school:verify -- --wp-id <wpId>
```

例如：
```bash
npm run sync:profile-to-school:verify -- --wp-id 35899
```

这会显示：
- 数据库中的当前值
- WordPress 原始数据
- 提取的字段值
- 数据是否匹配

### 3. 重新同步缺失字段的记录

如果发现字段为 `null` 但 WordPress 中有数据，可以重新同步：

#### 重新同步单条记录

```bash
npm run sync:profile-to-school:resync -- --wp-id <wpId>
```

#### 重新同步多条记录（限制数量）

```bash
npm run sync:profile-to-school:resync -- --limit 100
```

这会：
- 查找 `school_profile_type`、`profileType` 或 `nameEnglish` 为 `null` 的记录
- 从 WordPress 重新获取数据
- 更新数据库中的字段

#### Dry Run 模式（测试模式）

```bash
npm run sync:profile-to-school:resync -- --limit 10 --dry-run
```

## 字段说明

### 数据库字段

| 数据库字段 | 来源 | 说明 |
|-----------|------|------|
| `school_profile_type` | ACF 字段 `acf.school_profile_type` | ACF 自定义字段，通常是单个字符（如 "D"） |
| `profileType` | Taxonomy `taxonomy.profile_type` | WordPress 分类术语的 slug（如 "hk-kg-template"） |
| `nameEnglish` | ACF 字段 `acf.name_english` | 英文名称 |
| `nameShort` | ACF 字段 `acf.name_short` | 简称 |

### 为什么需要两个字段？

- **ACF 字段** (`school_profile_type`)：可能是单个字符代码，表示学校类型
- **Taxonomy 字段** (`profileType`)：是 WordPress 的分类术语，可能包含更多信息（如模板类型）

这两个字段包含不同的信息，应该分开存储。

## 批量重新同步

如果需要重新同步所有缺失字段的记录，可以分批进行：

```bash
# 第 1 批：100 条
npm run sync:profile-to-school:resync -- --limit 100

# 第 2 批：100 条
npm run sync:profile-to-school:resync -- --limit 100

# ... 依此类推
```

或者在 Prisma Studio 中：
1. 打开 Prisma Studio: `npx prisma studio`
2. 选择 `School` 表
3. 使用过滤器：
   - `wpId` is not null
   - `school_profile_type` is null
4. 查看需要更新的记录

## 验证脚本输出示例

```
📊 同步状态统计
═══════════════════════════════════════════════════════════

总记录数: 6788
有 wpId 的记录数: 6784 (99.9%)

school_profile_type (ACF 字段):
  总数: 6784
  已填充: 108 (1.6%)
  为空: 6676 (98.4%)

profileType (Taxonomy 字段):
  总数: 6784
  已填充: 0 (0.0%)
  为空: 6784 (100.0%)
```

## 单条记录验证示例

```
验证记录: wpId=35899
═══════════════════════════════════════════════════════════
数据库记录:
  school_profile_type (ACF): D
  profileType (Taxonomy): hk-kg-template
  nameEnglish: 611 TREE OF LIFE KINDERGARTEN

WordPress 原始数据:
  ACF school_profile_type: D
  Taxonomy profile_type: 香港幼稚园

比较结果:
  ✅ 数据同步正确
```

## 常见问题

### Q: 为什么有些记录的字段是 null？

A: 可能的原因：
1. WordPress 中该字段确实为空
2. 记录是在修复映射逻辑之前同步的（需要重新同步）
3. ACF 字段未正确配置或未关联到 post type

### Q: 如何查找特定 wpId 的记录？

A: 在 Prisma Studio 中：
1. 打开 `School` 表
2. 在搜索框输入 `wpId:35899`
3. 或使用过滤器：`wpId` equals `35899`

### Q: 重新同步会影响其他字段吗？

A: 不会。重新同步只会更新缺失的字段（`school_profile_type`、`profileType`、`nameEnglish`），其他字段保持不变。

### Q: 如何查看某个 wpId 是否已经同步？

A: 使用验证脚本：
```bash
npm run sync:profile-to-school:verify -- --wp-id <wpId>
```

