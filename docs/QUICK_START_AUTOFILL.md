# School Application Assistant × Chrome 插件快速用例

## 1. 核心概念

- **School Application Assistant（网站）**：用于创建/管理学校模板、收集申请数据。每个模板由唯一的 `schoolId` 标识。
- **Chrome 插件**：通过 URL 映射识别目标学校页面，调用网站 API 获取申请数据或字段映射，实现自动填表。

## 2. 基本流程

1. **在网站创建/维护模板**
   - 后台新建或编辑模板，统一使用小写加下划线的 `schoolId`，例如 `singapore_international_school`。
   - 在申请页面填写内容并点击“保存进度”，站点会将数据保存到 `/api/applicationData/{schoolId}/{userId}`。

2. **配置学校 URL 映射（插件）**
   - 打开插件 → “学校URL映射” → 通过“选择学校模版”下拉框选中目标学校（自动带出准确的 `schoolId`）。
   - 输入该学校常用的域名或正则，保存后插件即可在对应页面识别到该 `schoolId`。

3. **自动填充**
   - 在学校官网打开申请页面并刷新。
   - 在插件弹窗或浮动面板中确认识别到的学校，点击“自动填充”。
   - 插件会根据 `schoolId` 拉取 `/api/applicationData`，按模板字段填入页面；若无数据则回退到“字段映射+个人档案”模式。

## 3. 辅助功能

- **上传模板字段**：在目标站点扫描表单后，通过浮动面板的“上传模板”将新字段追加到后台模板（按字段 `key` 合并，不会清除既有字段）。
- **导出未映射字段**：浮动面板提供“导出未映射字段（JSON）”，便于离线补充模板或备份。
- **调试工具**：
  - `checkApplicationData.js` 可直接检测 `/api/applicationData/{schoolId}/{userId}` 是否有数据。
  - `chrome://extensions → 详情 → 检查视图（Service Worker）` 可查看插件日志、错误信息。

## 4. 易错点

| 问题表现                                 | 排查方向                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| 自动填出 “sosomama”等默认值              | `/api/applicationData` 是否 404；模板/映射/保存时 `schoolId` 是否一致     |
| 自动填充报 “Receiving end does not exist” | 页面未刷新或在 iframe 中，内容脚本未注入；可刷新页面或让后台强制注入脚本 |
| 上传字段后模板被清空                     | 新逻辑已改为合并；若仍异常，检查字段 `key` 是否重复或为空                 |
| 浮动面板学校列表不对                     | 扩展脚本未更新或 API 请求失败；重新加载扩展并刷新页面                     |

## 5. 推荐资料

- `README_AUTOFILL_SYSTEM.md`：系统架构与数据流。
- `SCHOOL_DETECTION_GUIDE.md`：`schoolId` 命名与 URL 映射策略。
- `CHROME_EXTENSION_GUIDE.md`（若存在）：插件安装、配置、调试指南。

按照上述步骤即可完成“建模 → 保存 → 映射 → 自动填充”的全流程。如需更详细的示例，请参考上述文档或联系开发者协助。 


