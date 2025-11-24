# Name_short为Null问题修复

## 问题描述

同步后，除了已创建模板的学校，其他学校的`name_short`都显示为null。

## 根本原因

1. **wordpressSchoolService可能没有正确提取ACF数据**
   - 统一端点可能返回空的ACF数组
   - ACF数据可能在不同的位置

2. **同步函数依赖wordpressSchoolService的数据**
   - 如果wordpressSchoolService没有提取到name_short，同步时就是null

## 修复方案

### 已实施的修复

1. **直接从WordPress REST API获取ACF数据**
   - 同步函数现在会直接从WordPress REST API获取ACF数据
   - 使用`acf_format=standard`参数确保获取标准格式的ACF数据
   - 支持分页获取所有学校（1962所）

2. **改进name_short提取逻辑**
   - 优先使用直接从WordPress API获取的ACF数据
   - 回退到wordpressSchoolService的数据
   - 支持多种字段名：`name_short`, `nameShort`

3. **添加调试日志**
   - 对于前10个没有name_short的学校，会输出调试信息
   - 显示实际的数据结构，帮助诊断问题

## 如何验证修复

### 步骤1：重新运行同步

```powershell
.\scripts\sync-schools-with-retry.ps1
```

### 步骤2：查看服务器日志

在运行`npm run dev`的终端中，查找：
- `[syncAllWPSchools] Fetched X profiles with ACF data`
- `[syncAllWPSchools] School X has no name_short:` (调试信息)

### 步骤3：检查数据库

```powershell
npx prisma studio
```

1. 打开School表
2. 查看`nameShort`列
3. 应该看到大部分学校都有`name_short`值

### 步骤4：如果仍然为null

如果重新同步后仍然有很多null：

1. **查看调试日志**：
   - 在服务器日志中查找 `[syncAllWPSchools] School X has no name_short:`
   - 这会显示实际的数据结构

2. **检查WordPress ACF配置**：
   - 确认WordPress中所有学校都有`name_short`字段
   - 检查ACF字段名是否正确（应该是`name_short`）

3. **手动测试一个学校**：
   ```bash
   # 替换YOUR_WP_URL和SCHOOL_ID
   curl "YOUR_WP_URL/wp-json/wp/v2/profile/SCHOOL_ID?acf_format=standard"
   ```
   查看返回的JSON中是否有`acf.name_short`字段

## 代码变更

### src/services/syncWPSchools.ts

**新增功能**：
- 直接从WordPress REST API获取ACF数据（支持分页）
- 优先使用直接获取的ACF数据
- 改进name_short提取逻辑
- 添加调试日志

**关键改进**：
```typescript
// 1. 直接从WordPress API获取ACF数据
const directWPData = directWPSchools.get(wpId);

// 2. 优先使用直接获取的数据
if (directWPData?.acf) {
  nameShort = directWPData.acf.name_short || directWPData.acf.nameShort || null;
}

// 3. 回退到wordpressSchoolService数据
if (!nameShort) {
  nameShort = wpSchool.nameShort || wpSchool.acf?.name_short || wpSchool.acf?.nameShort || null;
}
```

## 预期结果

重新同步后：
- ✅ 所有有`name_short`的WordPress学校都应该在数据库中有值
- ✅ 如果WordPress中确实没有`name_short`，数据库中是null是正常的
- ✅ 调试日志会显示哪些学校没有`name_short`以及原因

## 如果问题持续

如果重新同步后仍然有很多null：

1. **检查WordPress数据**：
   - 确认WordPress中确实有`name_short`字段
   - 检查字段名是否正确

2. **查看调试日志**：
   - 服务器日志会显示实际的数据结构
   - 帮助确定问题所在

3. **手动验证**：
   - 选择一个学校，直接从WordPress API获取数据
   - 检查ACF数据是否正确返回

## 下一步

1. **重新运行同步**：
   ```powershell
   .\scripts\sync-schools-with-retry.ps1
   ```

2. **查看服务器日志**，确认：
   - 是否成功获取了ACF数据
   - 有多少学校没有name_short（以及原因）

3. **验证结果**：
   ```powershell
   npx prisma studio
   ```
   检查School表的nameShort列

