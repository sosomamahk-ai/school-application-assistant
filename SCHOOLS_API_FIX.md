# 学校管理页面 500 错误修复

## 问题描述

学校申请管理页面 (`/admin/schools`) 显示错误：
- "学校数据加载失败500"
- "加载失败：Proxy API responded with 500"

## 修复内容

### 1. API 路由错误处理改进

**文件**: `src/pages/api/admin/schools/index.ts`

**问题**: GET 方法缺少 try-catch 错误处理，数据库查询失败时会直接抛出未捕获的异常，导致 500 错误。

**修复**:
- ✅ 为 GET 方法添加了完整的 try-catch 错误处理
- ✅ 为 DELETE 方法添加了错误处理
- ✅ 为整个 handler 函数添加了外层错误处理
- ✅ 改进了错误日志记录，包含详细的错误信息

**修改前**:
```typescript
if (req.method === 'GET') {
  const schools = await prisma.school.findMany({...});
  return res.status(200).json({ success: true, schools });
}
```

**修改后**:
```typescript
if (req.method === 'GET') {
  try {
    const schools = await prisma.school.findMany({...});
    return res.status(200).json({ success: true, schools });
  } catch (error) {
    console.error('Failed to fetch schools:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch schools',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

### 2. 前端错误处理改进

**文件**: `src/pages/admin/schools.tsx`

**问题**: 
- 前端代码在 API 返回错误时没有正确处理和显示错误信息
- 错误信息没有展示给用户

**修复**:
- ✅ 添加了 `fetchError` 状态来跟踪错误
- ✅ 改进了 `fetchSchools` 函数的错误处理
- ✅ 添加了错误信息显示 UI
- ✅ 添加了重试按钮

**主要改进**:
1. 检查 HTTP 状态码，非 200 时显示错误
2. 尝试解析错误响应 JSON，显示具体错误信息
3. 在页面上显示错误提示框，包含重试按钮
4. 改进了错误日志记录

### 3. 诊断工具

**文件**: `scripts/diagnose-schools-api.js`

创建了自动诊断工具，可以检测：
- ✅ 环境变量配置（DATABASE_URL, JWT_SECRET）
- ✅ Prisma Schema 完整性
- ✅ 数据库连接状态
- ✅ API 端点可访问性
- ✅ 数据库表结构

**使用方法**:
```bash
npm run diagnose:schools
```

## 可能的原因

根据修复内容，500 错误可能由以下原因引起：

1. **数据库连接问题**
   - DATABASE_URL 配置错误
   - 数据库服务器不可访问
   - 数据库连接池耗尽

2. **数据库查询问题**
   - School 表不存在或结构不匹配
   - SchoolFormTemplate 表关联问题
   - 数据格式问题

3. **认证问题**
   - JWT_SECRET 未配置
   - Token 验证失败

4. **部署相关问题**
   - 环境变量未正确设置
   - Prisma Client 未正确生成
   - 数据库迁移未执行

## 验证修复

### 1. 运行诊断工具

```bash
npm run diagnose:schools
```

### 2. 检查构建

```bash
npm run build
```

### 3. 测试 API 端点

在浏览器中访问：
- 开发环境: `http://localhost:3000/api/admin/schools`
- 生产环境: `https://your-domain.vercel.app/api/admin/schools`

### 4. 检查浏览器控制台

打开浏览器开发者工具，查看：
- Network 标签：检查 API 请求的状态码和响应
- Console 标签：查看详细的错误信息

## 后续步骤

如果问题仍然存在：

1. **检查 Vercel 部署日志**
   - 登录 Vercel Dashboard
   - 查看最近的部署日志
   - 查找错误堆栈信息

2. **验证环境变量**
   ```bash
   npm run check:env
   ```

3. **检查数据库连接**
   ```bash
   npm run test:db
   ```

4. **运行数据库迁移**
   ```bash
   npx prisma migrate deploy
   ```

5. **重新生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

## 相关文件

- `src/pages/api/admin/schools/index.ts` - API 路由
- `src/pages/admin/schools.tsx` - 前端页面
- `scripts/diagnose-schools-api.js` - 诊断工具
- `src/lib/prisma.ts` - Prisma 客户端配置
- `src/utils/auth.ts` - 认证工具

## 更新日期

2025-01-XX

