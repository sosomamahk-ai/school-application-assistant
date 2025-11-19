# ⚡ 快速检查 Supabase 连接选项

## 🎯 立即执行

请在 Supabase Dashboard 中检查以下内容：

### 1. 查看所有连接模式

**路径**：Settings → Database → Connection string

**检查以下选项**：
- [ ] Session mode
- [ ] Session pooler
- [ ] Transaction mode ⭐ **尝试这个**
- [ ] Transaction pooler ⭐ **尝试这个**
- [ ] Direct connection（如果有）

### 2. 尝试 Transaction Mode

1. 选择 **Transaction mode**
2. 复制连接字符串
3. 更新 `.env` 文件：
   ```env
   DATABASE_URL="[Transaction mode 的连接字符串]"
   DIRECT_URL="[Transaction mode 的连接字符串]"
   ```
4. 运行测试：
   ```bash
   npm run test:supabase
   ```

### 3. 检查 IP 限制

**路径**：Settings → Database → Connection pooling

**检查**：
- [ ] 是否有 IP 限制？
- [ ] 是否有防火墙规则？
- [ ] 如果有，添加你的 IP 地址

### 4. 查看连接信息

**路径**：Settings → Database → Connection info

**查看**：
- 所有可用的连接选项
- 主机地址
- 端口信息

## 📝 报告结果

请告诉我：
1. Supabase Dashboard 中显示了哪些连接模式？
2. Transaction mode 的连接字符串格式是什么？
3. 是否有 IP 限制？
4. 尝试 Transaction mode 后的测试结果？

这样我可以提供更精确的解决方案。

