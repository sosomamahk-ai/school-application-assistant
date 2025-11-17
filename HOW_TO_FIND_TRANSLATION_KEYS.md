# 如何找到和使用翻译 Key

## 📖 快速指南

### 方法 1: 查看翻译文件

所有翻译 key 都定义在 `src/lib/translations.ts` 文件中。

**格式：**
```typescript
'section.item': {
  en: 'English text',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
}
```

**示例：**
- `'common.appName'` → "School Application Assistant" / "学校申请助手" / "學校申請助手"
- `'dashboard.title'` → "Dashboard" / "控制面板" / "控制面板"
- `'settings.title'` → "Settings" / "账户设置" / "帳戶設置"

### 方法 2: 在代码中查找

如果页面已经使用了翻译系统，你可以：

1. **打开页面文件**（例如 `src/pages/settings.tsx`）
2. **查找 `t('` 或 `t("`** - 这会显示所有使用的翻译 key
3. **查看翻译文件** `src/lib/translations.ts` 找到对应的 key

**示例代码：**
```tsx
const { t } = useTranslation();
<h1>{t('settings.title')}</h1>  // ← 'settings.title' 就是 key
```

### 方法 3: 使用浏览器开发者工具

1. 打开浏览器开发者工具（F12）
2. 在 Console 中输入：
```javascript
// 查看所有可用的翻译 key
Object.keys(window.__TRANSLATIONS__ || {})
```

### 方法 4: 查看翻译管理页面

如果你是管理员，可以访问 `/admin/translations` 页面，那里会显示所有翻译 key 和对应的值。

---

## 🔍 常见翻译 Key 列表

### 通用 (common.*)
- `common.appName` - 应用名称
- `common.appNameShort` - 应用简称
- `common.loading` - "加载中..."
- `common.save` - "保存"
- `common.cancel` - "取消"
- `common.delete` - "删除"
- `common.edit` - "编辑"
- `common.submit` - "提交"

### 设置页面 (settings.*)
- `settings.title` - "账户设置"
- `settings.subtitle` - "管理您的账户信息和安全设置"
- `settings.changePassword` - "修改密码"
- `settings.changeEmail` - "修改邮箱"
- `settings.currentPassword` - "当前密码"
- `settings.newPassword` - "新密码"
- `settings.confirmPassword` - "确认新密码"
- `settings.currentEmail` - "当前邮箱"
- `settings.newEmail` - "新邮箱"

### 用户管理 (admin.users.*)
- `admin.users.title` - "用户管理"
- `admin.users.subtitle` - "查看、搜索并管理系统中的所有用户账号"
- `admin.users.totalUsers` - "用户总数"
- `admin.users.admins` - "管理员"
- `admin.users.normalUsers` - "普通用户"
- `admin.users.search` - "搜索"
- `admin.users.roleFilter` - "角色筛选"
- `admin.users.name` - "姓名"
- `admin.users.email` - "邮箱"
- `admin.users.role` - "角色"
- `admin.users.registeredAt` - "注册时间"
- `admin.users.actions` - "操作"

---

## 🛠️ 如何添加新的翻译 Key

### 步骤 1: 在代码中使用 `t('your.new.key')`

```tsx
import { useTranslation } from '@/contexts/TranslationContext';

export default function MyPage() {
  const { t } = useTranslation();
  
  return (
    <h1>{t('myPage.title')}</h1>  // ← 使用新的 key
  );
}
```

### 步骤 2: 在 `src/lib/translations.ts` 中添加翻译

```typescript
'myPage.title': {
  en: 'My Page Title',
  'zh-CN': '我的页面标题',
  'zh-TW': '我的頁面標題',
},
```

### 步骤 3: 保存并重新加载

翻译会立即生效！

---

## 📝 命名规范

翻译 key 使用 **扁平化结构**，格式为：`section.item`

**好的例子：**
- ✅ `dashboard.title`
- ✅ `settings.changePassword`
- ✅ `admin.users.search`
- ✅ `auth.login.button`

**不好的例子：**
- ❌ `dashboardTitle` (缺少点号分隔)
- ❌ `settings.change.password` (嵌套太深)
- ❌ `Dashboard Title` (包含空格)

---

## 🔧 如果找不到 Key 怎么办？

1. **检查页面是否使用了翻译系统**
   - 查看文件顶部是否有 `import { useTranslation } from '@/contexts/TranslationContext';`
   - 查看是否有 `const { t } = useTranslation();`

2. **如果页面还没有使用翻译系统**
   - 需要先更新页面代码，将硬编码的中文替换为 `t('key')`
   - 然后在 `src/lib/translations.ts` 中添加对应的 key

3. **查看其他类似页面**
   - 参考已经使用翻译的页面（如 `dashboard.tsx`, `profile/index.tsx`）
   - 复制类似的 key 命名模式

---

## 💡 提示

- **Key 名称应该描述性强**：`settings.changePassword` 比 `settings.cp` 更好
- **保持一致性**：如果已经有 `settings.title`，新的设置相关 key 应该以 `settings.` 开头
- **使用管理页面**：访问 `/admin/translations` 可以可视化地查看和编辑所有翻译

