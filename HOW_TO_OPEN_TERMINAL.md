# 💻 如何打开命令行（超详细图文教程）

命令行是什么？就是一个黑色（或白色）的窗口，可以输入文字命令来操作电脑。

---

## 🪟 Windows 系统

### 方法一：使用搜索（最简单，推荐）

```
步骤：
1. 按键盘上的 Windows 键 (⊞)
   （通常在键盘左下角，Ctrl 和 Alt 之间）

2. 直接输入：powershell
   （不需要点击任何地方，直接打字）

3. 看到 "Windows PowerShell" 出现
   （蓝色图标的程序）

4. 按 Enter 键，或点击鼠标

✅ PowerShell 窗口打开了！
```

**样子**：
```
┌────────────────────────────────────────┐
│ Windows PowerShell                  ×  │
├────────────────────────────────────────┤
│                                        │
│ PS C:\Users\YourName>_                 │
│                                        │
│                                        │
│                                        │
└────────────────────────────────────────┘
```

---

### 方法二：右键菜单

```
步骤：
1. 在桌面空白处，按住 Shift 键

2. 同时点击鼠标右键

3. 在菜单中选择：
   "在此处打开 PowerShell 窗口"
   或
   "在终端中打开"

✅ 命令行打开了！
```

---

### 方法三：运行窗口

```
步骤：
1. 同时按：Windows 键 + R
   （键盘上同时按这两个键）

2. 会弹出一个小窗口"运行"

3. 在框中输入：powershell

4. 按 Enter 键

✅ PowerShell 打开了！
```

**"运行"窗口样子**：
```
┌─────────────────────────────┐
│  运行                    ×  │
├─────────────────────────────┤
│  输入程序、文件夹或者...    │
│                             │
│  打开(O): [powershell   ]   │
│                             │
│     [确定]  [取消]  [浏览]  │
└─────────────────────────────┘
```

---

### 方法四：从文件夹打开（最直接）

```
步骤：
1. 打开文件资源管理器
   （就是看文件夹的那个）

2. 进入您的项目文件夹
   例如：C:\Users\YourName\Documents\school-application-assistant

3. 在地址栏（显示路径的地方）点击一下

4. 输入：powershell

5. 按 Enter

✅ 直接在项目文件夹中打开命令行！
```

**地址栏位置**：
```
文件资源管理器顶部：
┌────────────────────────────────────────────┐
│ ← → ↑  📂 C:\Users\...\school-app    🔍    │
│            ↑ 这里点击，然后输入 powershell │
└────────────────────────────────────────────┘
```

---

### ⚠️ Windows 常见问题

**问题1：找不到 PowerShell？**
- 试试搜索 "cmd" 或 "命令提示符"
- 效果是一样的

**问题2：权限不够？**
- 右键点击 PowerShell
- 选择 "以管理员身份运行"

**问题3：看到的是中文？**
- 没关系，功能完全一样
- 可以输入英文命令

---

## 🍎 Mac 系统

### 方法一：Spotlight 搜索（最简单，推荐）

```
步骤：
1. 按键盘上的：Command (⌘) + 空格键
   （同时按这两个键）

2. 会弹出搜索框

3. 输入：terminal
   （或中文：终端）

4. 按 Enter 键

✅ 终端打开了！
```

**Spotlight 搜索框样子**：
```
┌────────────────────────────────┐
│  🔍 terminal                   │
│                                │
│  🖥️ 终端.app                   │
│     应用程序                   │
└────────────────────────────────┘
```

---

### 方法二：从 Finder（访达）

```
步骤：
1. 打开 Finder（访达）
   （就是笑脸图标）

2. 点击顶部菜单：前往

3. 选择：实用工具

4. 找到并双击：终端 (Terminal)

✅ 终端打开了！
```

**菜单位置**：
```
Mac 顶部菜单栏：
┌────────────────────────────────────┐
│   前往  窗口  帮助               │
│   └─ 应用程序                    │
│      实用工具  ← 点这里           │
│      电脑                         │
└────────────────────────────────────┘
```

---

### 方法三：从项目文件夹（直接定位）

```
步骤：
1. 打开 Finder，进入项目文件夹

2. 右键点击文件夹空白处

3. 按住 Option (⌥) 键
   （菜单会变化）

4. 选择："在终端中打开"
   或 "New Terminal at Folder"

✅ 直接在项目文件夹打开终端！
```

---

### 方法四：Dock（程序坞）

```
步骤：
1. 打开 Finder（访达）

2. 前往 → 实用工具

3. 找到 "终端"

4. 拖动 "终端" 到屏幕底部的 Dock（程序坞）

✅ 以后点击 Dock 中的终端图标就能打开！
```

---

### ⚠️ Mac 常见问题

**问题1：终端是什么样子的？**
- 图标是黑色的方块，上面有 >_
- 名称是 "终端" 或 "Terminal"

**问题2：打开后看到什么？**
```
┌────────────────────────────────────┐
│ Terminal                        ×  │
├────────────────────────────────────┤
│ Last login: ...                    │
│ YourName@MacBook ~ %_              │
│                                    │
└────────────────────────────────────┘
```

**问题3：如何进入项目文件夹？**
- 输入：cd 
- 然后把项目文件夹拖到终端窗口
- 按 Enter

---

## 🐧 Linux 系统

### 方法一：快捷键（最快）

```
步骤：
同时按：Ctrl + Alt + T

✅ 终端立即打开！
```

---

### 方法二：应用程序菜单

```
步骤：
1. 点击左上角的 "活动" 或 "应用程序"

2. 搜索：terminal
   （或中文：终端）

3. 点击打开

✅ 终端打开了！
```

---

### 方法三：右键菜单

```
步骤（Ubuntu）：
1. 在桌面或文件夹中右键

2. 选择："在终端中打开"
   或 "Open in Terminal"

✅ 终端打开了！
```

---

## 📍 如何进入项目文件夹

打开命令行后，需要进入项目所在的文件夹。

### Windows PowerShell：

```powershell
# 例如项目在 D 盘
cd D:\Projects\school-application-assistant

# 或者在 Documents 文件夹
cd C:\Users\您的用户名\Documents\school-application-assistant

# 如果路径有空格，用引号：
cd "C:\Users\Your Name\Documents\school-application-assistant"
```

### Mac/Linux 终端：

```bash
# 例如项目在 Documents
cd ~/Documents/school-application-assistant

# 或者在桌面
cd ~/Desktop/school-application-assistant

# 如果路径有空格，用引号：
cd "~/Documents/My Projects/school-application-assistant"
```

---

## 💡 快速技巧

### 技巧1：自动补全

```
输入文件夹名的前几个字母
然后按 Tab 键
系统会自动补全！

例如：
cd Doc [按 Tab] → cd Documents/
```

### 技巧2：拖拽文件夹

```
Windows & Mac 都支持：

1. 在命令行输入：cd 
   （注意后面有个空格）

2. 把项目文件夹直接拖到命令行窗口

3. 按 Enter

✅ 自动进入文件夹！
```

### 技巧3：查看当前位置

```
Windows PowerShell:
pwd

Mac/Linux:
pwd

会显示您当前在哪个文件夹
```

### 技巧4：列出文件

```
Windows PowerShell:
dir

Mac/Linux:
ls

会显示当前文件夹的所有文件
```

---

## 🎯 验证命令行可用

打开命令行后，试试这些命令：

### 测试1：查看 Node.js

```bash
node --version
```

**应该显示**：
```
v18.17.0
（或其他版本号）
```

如果显示 "找不到命令"，说明还没安装 Node.js

---

### 测试2：查看 Git

```bash
git --version
```

**应该显示**：
```
git version 2.40.0
（或其他版本号）
```

---

### 测试3：查看当前文件夹

```bash
# Windows
pwd

# Mac/Linux
pwd
```

**应该显示**：当前所在的文件夹路径

---

## 🚀 实战演练

### 完整流程示例（Windows）：

```
1. 按 Windows 键，输入 powershell，按 Enter
   
   看到：
   PS C:\Users\YourName>

2. 进入项目文件夹：
   PS C:\Users\YourName> cd Documents\school-application-assistant
   
   看到：
   PS C:\Users\YourName\Documents\school-application-assistant>

3. 验证位置正确：
   PS ...> dir
   
   应该看到项目文件：
   package.json
   src/
   prisma/
   ...

4. 运行命令（例如安装依赖）：
   PS ...> npm install
   
   开始安装...

✅ 成功！
```

---

### 完整流程示例（Mac）：

```
1. 按 Command + 空格，输入 terminal，按 Enter
   
   看到：
   YourName@MacBook ~ %

2. 进入项目文件夹：
   % cd Documents/school-application-assistant
   
   看到：
   YourName@MacBook school-application-assistant %

3. 验证位置正确：
   % ls
   
   应该看到项目文件：
   package.json
   src
   prisma
   ...

4. 运行命令：
   % npm install
   
   开始安装...

✅ 成功！
```

---

## ❓ 常见问题解答

### Q1: 命令行是黑色的还是白色的？

**答**：都可能！
- Windows PowerShell 通常是蓝色背景
- Mac 终端通常是白色背景
- Linux 通常是紫色或黑色背景
- 可以自己改颜色

### Q2: 我打错了怎么办？

**答**：
- 按 Backspace 删除
- 按 Ctrl + C 取消当前命令
- 按 ↑ ↓ 方向键可以看历史命令

### Q3: 怎么复制粘贴？

**答**：
- **Windows PowerShell**: 
  - 复制：选中文字 + Ctrl + C
  - 粘贴：Ctrl + V 或右键
- **Mac 终端**: 
  - 复制：Command + C
  - 粘贴：Command + V
- **Linux**: 
  - 复制：Ctrl + Shift + C
  - 粘贴：Ctrl + Shift + V

### Q4: 命令行卡住了怎么办？

**答**：
- 按 Ctrl + C 强制停止
- 或者直接关闭窗口重新打开

### Q5: 怎么清空屏幕？

**答**：
- 输入 `clear` 然后按 Enter
- 或者按 Ctrl + L

---

## 🎓 命令行基础术语

| 术语 | 意思 | 例子 |
|------|------|------|
| 命令 | 您输入的指令 | `npm install` |
| 路径 | 文件夹位置 | `C:\Users\Name\Documents` |
| 当前目录 | 现在所在的文件夹 | `pwd` 查看 |
| 参数 | 命令的选项 | `git add .` 中的 `.` |
| 回车/Enter | 执行命令 | 输入命令后按 Enter |

---

## 🎬 下一步

现在您已经知道如何打开命令行了！

可以继续：
1. 查看 [DEPLOYMENT_GUIDE_DETAILED.md](./DEPLOYMENT_GUIDE_DETAILED.md)
2. 跟着步骤操作
3. 遇到问题随时问我

---

## 💡 小贴士

1. **不要害怕命令行**
   - 它只是另一种操作电脑的方式
   - 输错了最多不起作用，不会损坏电脑

2. **多练习**
   - 打开和关闭几次
   - 试试 `cd` 命令进入不同文件夹
   - 试试 `dir` (Windows) 或 `ls` (Mac/Linux) 看文件

3. **保存常用命令**
   - 可以把常用的命令记在记事本里
   - 需要时复制粘贴

4. **使用 Tab 补全**
   - 输入一半，按 Tab 键
   - 会自动补全文件名和路径

---

**您现在可以开始部署了！** 🚀

遇到任何问题，告诉我命令行显示的内容，我会帮您解决！

