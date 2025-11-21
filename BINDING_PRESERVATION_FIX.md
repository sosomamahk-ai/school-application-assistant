# 绑定信息保留修复

## 问题描述

每次进入学校管理页面时，原本绑定好的 WordPress 学校就不见了。这是因为：

1. 绑定信息依赖于 WordPress 数据的匹配结果
2. 如果 WordPress 数据还没加载完，绑定信息就会丢失
3. 每次进入页面都会重新搜索匹配，即使学校已经绑定好

## 根本原因

绑定信息实际上存储在 `SchoolFormTemplate.schoolId` 中（格式：`wp-profile-123` 或 `profile-123`），但之前的代码：

1. 依赖 `templateWordPressMap` 来获取绑定信息
2. `templateWordPressMap` 是基于 `templates` 计算的
3. `templates` 又依赖 `wordpressSchools` 的匹配结果
4. 如果匹配失败或数据未加载，绑定就会丢失

## 修复方案

### 1. 直接从 schoolId 解析绑定信息 ✅

**文件**: `src/pages/admin/schools.tsx`

修改 `mapApiSchool` 函数，优先从 `template.schoolId` 解析 WordPress 绑定信息：

```typescript
// 策略 1: 优先从 templateWordPressMap 获取（如果模板已经匹配过）
matched = templateWordPressMap.get(school.templateId) ?? null;

// 策略 2: 如果 map 中没有，从 template.schoolId 解析绑定信息
if (!matched && school.template?.schoolId) {
  const parsed = parseWordPressId(school.template.schoolId);
  if (parsed) {
    // 先保存绑定信息（即使找不到 WordPress 对象，也要保留 ID）
    wordpressSchoolId = parsed.id;
    wordpressSchoolType = parsed.type;
    
    // 然后尝试从已加载的数据中查找对象
    matched = wpSchoolIndex.get(`${parsed.type}-${parsed.id}`) ?? null;
  }
}
```

### 2. 保留绑定信息，即使 WordPress 对象未找到 ✅

关键改进：即使找不到 WordPress 学校对象，也要保留 `wordpressSchoolId` 和 `wordpressSchoolType`。

这样：
- 绑定信息不会丢失
- 即使 WordPress 数据还没加载完，也能显示绑定状态
- 等 WordPress 数据加载完成后，会自动关联到对应的对象

### 3. 避免不必要的搜索 ✅

- **已绑定的学校**：直接从 `schoolId` 解析，不进行名称匹配
- **未绑定的学校**：只在 `templates` 的 useMemo 中进行名称匹配（用于显示模板选项）
- **进入页面时**：不进行搜索，只解析已有的绑定信息

## 工作流程

### 进入页面时

1. **加载学校数据** (`fetchSchools`)
   - 从 API 获取学校列表
   - 包含 `template.schoolId` 信息

2. **解析绑定信息** (`mapApiSchool`)
   - 从 `template.schoolId` 解析 WordPress ID
   - 如果解析成功，直接使用，不进行搜索
   - 保留绑定信息，即使 WordPress 对象未找到

3. **加载 WordPress 数据** (`useWordPressSchools`)
   - 使用缓存（30 分钟）
   - 如果缓存有效，不发送请求

4. **关联 WordPress 对象**
   - 当 WordPress 数据加载完成后
   - 通过 ID 关联到对应的 WordPress 学校对象

### 绑定新学校时

1. 用户选择 WordPress 学校
2. 更新 `template.schoolId` 为 `wp-profile-123` 格式
3. 保存到数据库
4. 下次进入页面时，直接从 `schoolId` 解析，不需要搜索

## 性能优化

### 优化前
- 每次进入页面：重新搜索所有学校
- 已绑定学校：也要重新搜索匹配
- 服务器压力：频繁的搜索请求

### 优化后
- 进入页面：只解析绑定信息，不搜索
- 已绑定学校：直接从 `schoolId` 解析（O(1)）
- 未绑定学校：只在必要时搜索（显示模板选项时）
- 服务器压力：大幅降低

## 验证方法

### 1. 测试绑定保留

1. 绑定一个 WordPress 学校
2. 刷新页面
3. **应该看到**：绑定信息仍然存在，即使 WordPress 数据还在加载

### 2. 测试不搜索

1. 打开浏览器开发者工具 → Network 标签
2. 进入学校管理页面
3. **应该看到**：
   - 第一次：可能看到 WordPress API 请求（如果缓存过期）
   - 刷新页面：**不应该**看到新的 WordPress API 请求（使用缓存）
   - **不应该**看到额外的搜索请求

### 3. 检查控制台

打开浏览器控制台，应该看到：
- 没有重复的搜索日志
- 绑定信息正确解析
- WordPress 对象正确关联

## 相关文件

- `src/pages/admin/schools.tsx` - 学校管理页面
- `src/services/wordpressSchoolService.ts` - WordPress 数据服务（缓存）
- `src/hooks/useWordPressSchools.ts` - WordPress 数据 Hook

## 关键改进点

1. ✅ **绑定信息持久化**：从 `schoolId` 解析，不依赖匹配结果
2. ✅ **避免重复搜索**：已绑定学校不搜索，只解析
3. ✅ **缓存优化**：30 分钟缓存 + localStorage 持久化
4. ✅ **性能提升**：O(1) 查找，减少服务器压力

---

**修复完成日期**: 2025-01-XX

现在绑定好的学校不会丢失，也不会重复搜索了！

