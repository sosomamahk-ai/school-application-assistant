# 自动申请功能文档索引

## 文档概览

本目录包含自动申请功能的完整文档：

### 📚 文档列表

1. **[快速开始指南](./AUTO_APPLY_QUICK_START.md)**
   - 快速操作示例
   - 常见场景处理
   - 调试技巧
   - 适合快速上手

2. **[完整使用指南](./自动申请功能使用指南.md)** (中文)
   - 详细的操作步骤
   - 完整的使用示例
   - 常见问题解决方案
   - 适合中文用户

3. **[脚本开发指南](./AUTO_APPLY_SCRIPT_GUIDE.md)**
   - 系统架构说明
   - 详细的开发指南
   - 最佳实践
   - 适合开发者深入理解

## 快速导航

### 我想...

- **为新学校添加自动申请功能**
  → 查看 [快速开始指南](./AUTO_APPLY_QUICK_START.md) 或 [中文使用指南](./自动申请功能使用指南.md)

- **了解系统架构和原理**
  → 查看 [脚本开发指南](./AUTO_APPLY_SCRIPT_GUIDE.md)

- **创建新脚本文件**
  → 使用脚本生成工具：
  ```bash
  node scripts/create-school-script.js <school-id> [school-name] [apply-url]
  ```

- **调试脚本问题**
  → 查看 [快速开始指南 - 调试技巧](./AUTO_APPLY_QUICK_START.md#调试技巧)

- **处理特殊场景**
  → 查看 [中文使用指南 - 常见问题处理](./自动申请功能使用指南.md#常见问题处理)

## 系统架构

```
前端 (SchoolTable.tsx)
  ↓
API (/api/auto-apply)
  ↓
控制器 (autoApplyController.ts)
  ↓
服务层 (autoApplyService.ts)
  ↓
学校脚本 (schools/*.ts)
  ↓
Playwright 浏览器自动化
```

## 核心概念

### 1. 学校脚本 (School Script)

每个学校需要一个独立的脚本文件，定义该学校的自动化流程。

**位置**: `src/modules/auto-apply/schools/`

**示例**: `example-school.ts`

### 2. 脚本注册

所有脚本必须在 `autoApplyService.ts` 中注册才能使用。

### 3. 字段匹配

系统会自动匹配模板字段和页面字段，如果自动匹配失败，可以使用字段映射。

### 4. 错误处理

脚本执行失败时会自动截图和保存HTML，方便调试。

## 快速开始

### 1. 创建脚本

```bash
node scripts/create-school-script.js shanghai-international-school "上海国际学校" "https://shanghai-school.edu/apply"
```

### 2. 编辑脚本

根据实际页面调整脚本内容。

### 3. 注册脚本

在 `autoApplyService.ts` 中导入并注册。

### 4. 测试

设置 `PLAYWRIGHT_HEADLESS=false` 并运行测试。

## 相关文件

- **前端组件**: `src/components/schools/SchoolTable.tsx`
- **API端点**: `src/pages/api/auto-apply.ts`
- **控制器**: `src/modules/auto-apply/autoApplyController.ts`
- **服务层**: `src/modules/auto-apply/autoApplyService.ts`
- **示例脚本**: `src/modules/auto-apply/schools/example-school.ts`
- **脚本生成工具**: `scripts/create-school-script.js`

## 支持

如有问题，请：

1. 查看相关文档
2. 检查服务器日志
3. 查看错误截图（`tmp/auto-apply/` 目录）
4. 参考示例脚本

