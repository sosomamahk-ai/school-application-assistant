# Supabase Direct Connection 连接失败修复指南

## 🚨 问题

使用 Supabase Direct Connection，已经更换多次密码，仍然连接失败，错误：`FATAL: Tenant or user not found`

## 🔍 问题分析

如果多次更换密码仍然失败，问题通常不在密码本身，而是：

1. **连接字符串格式不正确**
2. **Supabase 项目配置问题**
3. **项目引用（Project Reference）格式错误**
4. **区域或主机地址不正确**

## ✅ 解决方案

### 步骤 1: 确认 Supabase 项目状态

1. **登录 Supabase Dashboard**
   - 访问 https://app.supabase.com
   - 选择你的项目

2. **检查项目状态**
   - 确保项目未暂停
   - 检查项目是否正常运行
   - 查看项目设置中的区域（Region）

3. **获取项目引用（Project Reference）**
   - 在项目设置中，找到项目引用（通常是类似 `[PROJECT-REF]` 的字符串）
   - 这个引用在连接字符串中很重要

### 步骤 2: 获取正确的连接字符串

在 Supabase Dashboard 中：

1. **Settings → Database**
2. **Connection string** 部分
3. **选择 "Session mode"**（不是 Transaction mode）
4. **复制连接字符串**

Supabase 可能提供两种格式：

#### 格式 A: 标准格式
```
postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

#### 格式 B: 项目引用格式
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**重要**: 对于 Direct Connection，应该使用端口 **5432**，不是 6543。

### 步骤 3: 配置 .env 文件

根据你从 Supabase Dashboard 复制的连接字符串，配置 `.env` 文件：

#### 如果 Supabase 提供的是标准格式：

```env
# Direct Connection (直接连接)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# 也设置 DIRECT_URL（用于迁移）
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

#### 如果 Supabase 提供的是项目引用格式：

```env
# Direct Connection (直接连接)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# 也设置 DIRECT_URL（用于迁移）
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

**关键点**：
- ✅ 使用端口 **5432**（Direct Connection）
- ✅ 不要使用 `pgbouncer=true` 参数（这是连接池参数）
- ✅ 确保用户名格式与 Supabase Dashboard 中显示的一致

### 步骤 4: 测试连接

运行诊断工具：

```bash
npm run test:supabase
```

这个工具会：
- 检查连接字符串格式
- 测试数据库连接
- 提供详细的错误分析

### 步骤 5: 如果仍然失败 - 尝试替代方案

#### 方案 A: 使用不同的主机地址

Supabase 可能提供多个主机地址。尝试：

1. 在 Supabase Dashboard 中查看是否有其他连接选项
2. 检查是否有 "Direct connection" 和 "Connection pool" 的不同地址
3. 尝试使用不同的主机地址

#### 方案 B: 检查区域设置

确保连接字符串中的区域与你的项目区域匹配：

- 如果项目在 `ap-south-1`，主机应该是 `aws-1-ap-south-1.pooler.supabase.com`
- 如果项目在其他区域，主机地址会不同

#### 方案 C: 使用 Supabase SQL Editor 验证

1. 在 Supabase Dashboard 中打开 **SQL Editor**
2. 运行简单查询：
   ```sql
   SELECT version();
   ```
3. 如果查询成功，说明数据库本身正常，问题在连接字符串配置

#### 方案 D: 检查网络和防火墙

- 确保网络连接正常
- 检查防火墙是否阻止了数据库连接
- 尝试从不同网络环境连接

### 步骤 6: 联系 Supabase 支持

如果以上方法都不行：

1. **检查 Supabase 状态**
   - https://status.supabase.com/
   - 确认服务正常运行

2. **联系 Supabase 支持**
   - 在 Dashboard 中提交支持请求
   - 提供：
     - 项目引用（Project Reference）
     - 错误信息
     - 连接字符串格式（隐藏密码）

## 📋 完整的 .env 配置示例

```env
# Database - Supabase Direct Connection
# 从 Supabase Dashboard 复制的 Session mode 连接字符串
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# JWT Secret
JWT_SECRET="[YOUR-JWT-SECRET]"

# OpenAI API
OPENAI_API_KEY="[YOUR-OPENAI-API-KEY]"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🔑 关键要点

1. **Direct Connection 使用端口 5432**，不是 6543
2. **不要使用 `pgbouncer=true` 参数**（这是连接池参数）
3. **用户名格式必须与 Supabase Dashboard 中显示的一致**
4. **确保从 Supabase Dashboard 复制的是 Session mode 连接字符串**

## ✅ 验证清单

- [ ] Supabase 项目状态正常（未暂停）
- [ ] 从 Dashboard 复制了 Session mode 连接字符串
- [ ] 使用端口 5432（不是 6543）
- [ ] 移除了 `pgbouncer=true` 参数
- [ ] 用户名格式正确（postgres 或 postgres.[PROJECT-REF]）
- [ ] 密码已正确替换
- [ ] 运行了 `npm run test:supabase` 测试

## 🆘 仍然无法解决？

如果按照以上步骤仍然无法连接，请提供：

1. Supabase Dashboard 中显示的连接字符串格式（隐藏密码）
2. 你的项目引用（Project Reference）
3. 运行 `npm run test:supabase` 的完整输出
4. Supabase 项目的区域设置

这样我可以提供更具体的帮助。

