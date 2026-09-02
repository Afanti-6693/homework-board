# 小学生电子记作业本（可分享到 QQ · 公开共享本）

一个给小学生用的「电子记作业本 / 每日任务」网页：家长或老师做好清单 → 分享链接发到 QQ → 孩子点开就能看到当天任务并逐项勾选完成。**不用密码，谁拿到链接谁就能打开，家人和孩子看到的是同一本，约 20 秒同步。**

## 功能
- **作业清单**：可粘贴微信群作业，自动按换行/序号/标点拆成多条；科目、时间自动归类
- **课堂笔记**（语文/数学/英语）：支持文字 + 图片，图片可上传或粘贴微信图片
- **老师通知 / 家长任务**两类标签：记录提醒、明日要带的东西、家长需帮忙的事
- **公开共享本（无密码）**：作业存在云端，链接即钥匙（`?b=随机ID`），家人父子共用同一本、实时同步
- **17:30 自动提醒**：页面常开到点弹提醒 + 一键分享到 QQ

## 本地运行（完全脱离云端，数据存自己电脑）
```bash
node server.js          # 默认 http://localhost:8080
```
浏览器打开 `http://localhost:8080`，首页会自动生成一本（链接带 `?b=xxxx`），直接开始用，无需密码。
本仓库已预置一本示例：`http://localhost:8080/?b=haohao0901`（标题「学霸小雨点的作业本」）。

> 图片上传需在服务器地址下运行（直接双击 `index.html` 打开 file:// 无法上传）。

## 部署到公网（Cloudflare Pages，免绑卡、国内可访问 · 推荐）

纯前端 + Cloudflare Pages Functions + KV，不需要信用卡、不需要服务器，国内浏览器大部分时间能直接打开。

### 第 1 步：用 GitHub 登录 Cloudflare
1. 打开 [cloudflare.com](https://cloudflare.com) → **Log In** → 选 **Continue with GitHub**（用你现有的 GitHub 账号即可，无需新注册）
2. 左侧菜单进 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 授权后选中你的 `homework-board` 仓库 → **Begin setup**

### 第 2 步：构建设置
- **Framework preset**：选 `None`
- **Build command**：留空
- **Build output directory**：填 `.`（点号，表示仓库根目录）
- 点 **Save and Deploy**（约 1–3 分钟）

### 第 3 步：创建并绑定 KV 存储（关键，否则不能保存）
1. 在 Cloudflare 控制台左侧 **Workers & Pages** → **KV** → **Create a namespace**，名字随便（如 `homework-kv`），记下它。
2. 回到你的 Pages 项目 → **Settings** → **Functions** → **KV namespace bindings** → **Add binding**
3. **Variable name** 必须填 **`BOARDS`**（代码里就认这个名字），选刚才建的 namespace → **Save**
4. 回到 **Deployments** 重新 **Retry / Redeploy** 一次让绑定生效

### 第 4 步：拿到链接
部署完成后会得到形如 `https://homework-board-xxxx.pages.dev` 的地址，后面加 `?b=haohao0901` 就是作业本：
```
https://homework-board-xxxx.pages.dev/?b=haohao0901
```
电脑、手机、QQ 里点开都能用；**家人共用同一个 `?b=haohao0901` 链接即可同步看同一本**。

> 说明：Cloudflare 免费版足够日常使用；`*.pages.dev` 在国内偶有波动，若长期要稳定可再绑自己的域名（可选）。未绑定 KV 时页面也能打开（显示示例本），只是无法保存编辑。

## 其他平台部署（Node 服务版）
代码同时兼容「常驻 Node 服务」模式，只需运行 `node server.js` 并暴露 `PORT`：
- **任意支持 Node 的 PaaS**（Render / Railway / Zeabur / Fly.io 等）：推到 GitHub 后按平台指引部署，根目录 `Dockerfile` 与 `package.json` 已就绪。
- 本地：`node server.js` → `http://localhost:8080`。

## 文件结构
- `index.html` —— 前端单文件应用（共享本读写、笔记、分享等）
- `server.js` —— 零依赖 Node 后端（用于本地/常驻服务部署）：静态托管 + 共享本读写 + 图片上传
- `functions/api/board/[id].js` —— Cloudflare 读取/保存共享本
- `functions/api/upload.js` —— Cloudflare 图片上传
- `functions/i/[file].js` —— Cloudflare 图片读取
- `wrangler.toml` —— Cloudflare Pages 配置（含 KV 绑定说明）
- `render.yaml` —— Render 部署配置（备用）
- `Dockerfile` —— 容器部署配置（备用）

## 两点说明
- **共享本无密码**：任何拿到链接的人都能看/改这本作业（家庭场景通常无所谓）。链接里的随机 ID 极难被外人猜中；若担心泄露，可改用带访问密码的版本。
- **纯前端无法真正自动发 QQ 消息**：17:30 提醒为「页面常开时弹窗 + 一键转发」，非后台自动推送。
