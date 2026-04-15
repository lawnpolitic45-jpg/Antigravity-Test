# 👾 Pixel Quiz Quest

这是一个采用 `React` + `Vite` 构建的 2000 年代复古像素风格网页闯关问答游戏。题目与玩家分数资料采用免费的 `Google Sheets` 与 `Google Apps Script (GAS)` 作为后端，并通过 API 对接 `DiceBear` 动态汇入自动生成的像素随机头目（Boss）头像。

---

## 🛠️ 环境与安装需求
请确认你的电脑已安装 [Node.js](https://nodejs.org/en) (建议 v18 以上)。

1. **安装依赖包**：
   在项目根目录下开启终端，输入以下命令：
   ```bash
   npm install
   ```
2. **启动本地开发服务器**：
   ```bash
   npm run dev
   ```
   默认会运行在 `http://localhost:5173/`。

---

## 📊 Google Sheets 与 GAS 后端建置步骤

我们利用 Google Sheets 当作免费的小型数据库，通过 Apps Script 提供给前端调用。

### Step 1: 准备 Google Sheets
1. 新建一份 Google 电子表格。
2. 建立两个工作表，必须准确命名为（请勿有空格）：
   - `题目`
   - `回答`
3. 将 **第一行 (Row 1)** 填上专属的表头：
   - 在 `题目` 工作表的第一行依次填入（A~G 列）：`题号`, `题目`, `A`, `B`, `C`, `D`, `解答`
   - 在 `回答` 工作表的第一行依次填入（A~G 列）：`ID`, `闯关次数`, `总分`, `最高分`, `第一次通关分数`, `花了几次通关`, `最近游玩时间`
4. 电子表格的其余部分你现在可以填写你的选择题数据（答案请填写确切的大写 `A`、`B`、`C`、`D`）。

### Step 2: 建立 Google Apps Script (GAS)
1. 在同一份电子表格内，点击上方菜单的 **扩展程序** -> **Apps Script**。
2. 将里面默认的 `myFunction` 清空，并贴上提供给你的后端的 `Code.gs` 内容。
3. 点击上方磁盘图标 **保存项目**。

### Step 3: 部署与获取链接
1. 点击右上角的 **部署** -> **新建部署**。
2. 在左侧齿轮设定"选择类型"，选择 **Web 应用 (Web App)**。
3. 设定细节：
   - 描述：自定义（例如 `Pixel Quiz V1`）
   - **执行身份**：选择 **我**。
   - **谁可以访问**：选择 **所有人**（非常重要，否则前端会发生访问权限拦截 CORS 错误）。
4. 部署完成后，复制窗口显示的 **Web 应用网址 (Web App URL)**。

---

## 🔗 设置环境变量 (.env)

在 Vite 项目根目录下寻找（或新建） `.env` 文件，把刚才拿到的网址填进去：

```env
VITE_GOOGLE_APP_SCRIPT_URL="在这里贴上你刚刚拿到的 Apps Script URL"
VITE_PASS_THRESHOLD=3
VITE_QUESTION_COUNT=5
```

- `VITE_GOOGLE_APP_SCRIPT_URL`：GAS 的接口，前端通过收集游玩数据将其发送至此接口。
- `VITE_PASS_THRESHOLD`：过关门槛（答对特定题数才算通关）。
- `VITE_QUESTION_COUNT`：本场游戏随机抽出的题数。

配置一切完成后，再重新执行 `npm run dev`，游戏就能顺利连接你的专属 Google Sheet 题库了！享受你的开发体验！

---

## 🚀 自动部署到 GitHub Pages

此项目包含自动部署到 GitHub Pages 的 GitHub Actions 工作流（位于 `.github/workflows/deploy.yml`）。
要在推送到 `main` 分支时自动部署到 GitHub，你需要先配置相关的仓库级密钥（Secrets）。

### 部署配置步骤

1. **前往仓库设置**：
   打开你的 GitHub 仓库，点击上方标签页的 **Settings**。

2. **启用 GitHub Pages**：
   在左侧边栏找到 **Pages**，将 **Build and deployment** 下的 **Source** 设置为 **GitHub Actions**。

3. **添加环境变量为安全密钥**：
   在左侧边栏找到 **Secrets and variables** -> **Actions**。

4. **新建 Repository secrets**：
   点击绿色的 **New repository secret** 按钮，依次添加 `.env.example` 中对应的参数：
   - `VITE_GOOGLE_APP_SCRIPT_URL`：填上刚才拿到的 GAS 链接（必备）
   - `VITE_PASS_THRESHOLD`：过关门槛（如 `3`）
   - `VITE_QUESTION_COUNT`：题数（如 `5`）

5. **部署生效**：
   现在当你将代码推送到 `main` 分支时（或是进入仓库 Actions 手动触发 `Deploy to GitHub Pages` 工作流），GitHub Actions 就会自动读取你所设置的 Secrets，构建项目并发布到免费的 GitHub Pages 服务上！

> **注意：** 若你的 GitHub Pages 不是个人的根目录展示页（例如部署在 `https://<用户名>.github.io/<仓库名>/`），在推送前请记得前往 `vite.config.ts/js` 将 `base` 路径设定对应为你的仓库名称，例如：`base: '/你的仓库名称/'`。