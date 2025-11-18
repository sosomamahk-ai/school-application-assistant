# Chrome 插件配置指南

## 🔧 API URL 配置

插件默认使用生产环境 URL：`https://school-application-assistant.vercel.app`

### 如何修改 API URL

#### 方法 1: 通过代码修改（永久）

如果你想永久更改默认 URL，编辑以下文件：

1. **`src/modules/autofill/chrome-extension/popup.js`**
   - 找到 `getApiBaseUrl()` 函数
   - 修改默认返回值

2. **`src/modules/autofill/chrome-extension/background.js`**
   - 找到 `getApiBaseUrl()` 函数
   - 修改默认返回值

#### 方法 2: 通过浏览器存储配置（临时，推荐）

插件支持通过 Chrome Storage 配置 API URL，这样可以在不修改代码的情况下切换环境。

**在浏览器控制台中运行**：

```javascript
// 设置为生产环境
chrome.storage.local.set({
  autofill_api_url: 'https://school-application-assistant.vercel.app'
});

// 设置为开发环境
chrome.storage.local.set({
  autofill_api_url: 'http://localhost:3000'
});

// 清除配置（恢复默认）
chrome.storage.local.remove('autofill_api_url');
```

**或者通过插件 Popup**：

1. 打开插件 Popup
2. 按 `F12` 打开开发者工具
3. 在 Console 中运行上面的代码

## 📝 当前配置

- **生产环境 URL**: `https://school-application-assistant.vercel.app`
- **开发环境 URL**: `http://localhost:3000`（需要手动配置）

## 🔄 登录链接

登录链接会自动使用配置的 API URL，格式为：`{API_URL}/auth/login`

例如：
- 生产环境：`https://school-application-assistant.vercel.app/auth/login`
- 开发环境：`http://localhost:3000/auth/login`

## ✅ 验证配置

1. **检查当前配置**：
   ```javascript
   chrome.storage.local.get('autofill_api_url', (result) => {
     console.log('当前 API URL:', result.autofill_api_url || '使用默认值');
   });
   ```

2. **测试登录**：
   - 点击插件 Popup 中的"登录"按钮
   - 应该跳转到配置的登录页面

3. **测试 API 连接**：
   - 在插件中执行任何需要 API 的操作
   - 检查浏览器控制台是否有连接错误

## 🛠️ 开发环境切换

如果你需要在开发和生产环境之间切换：

### 快速切换脚本

创建一个书签或使用浏览器控制台：

```javascript
// 切换到开发环境
(function() {
  chrome.storage.local.set({
    autofill_api_url: 'http://localhost:3000'
  }, () => {
    console.log('✅ 已切换到开发环境');
    alert('已切换到开发环境：http://localhost:3000');
  });
})();

// 切换到生产环境
(function() {
  chrome.storage.local.set({
    autofill_api_url: 'https://school-application-assistant.vercel.app'
  }, () => {
    console.log('✅ 已切换到生产环境');
    alert('已切换到生产环境：https://school-application-assistant.vercel.app');
  });
})();
```

## 📋 配置文件位置

所有配置存储在 Chrome 的 Local Storage 中，键名：`autofill_api_url`

可以通过以下方式查看：
- Chrome 扩展管理页面 → 开发者模式 → 查看扩展详情 → Storage

