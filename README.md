# 学霸小雨点的作业本（纯静态版）

一个给小学生用的「电子记作业本」网页：按科目标签分组作业、勾选圆圈打卡、粘贴微信群作业自动拆分、课堂笔记带图。

**纯前端实现**：不需要任何后端服务器、数据库或付费账号。

- 作业数据存在**本机浏览器**（同一个浏览器/设备刷新不丢）
- 点「复制链接」会把**整本作业打包进链接**发给家人，对方打开即看到一模一样的内容
- 对方可以继续勾选/添加，再点「复制链接」回传，如此往复同步

## 部署（Cloudflare Pages，免绑卡、国内可打开）

仓库已是纯静态站点（只有 `index.html` 一个核心文件）。

1. 打开 [dash.cloudflare.com](https://dash.cloudflare.com) → **Log In** → 选 **Continue with GitHub**
2. 左侧 **`</>` Workers & Pages** → **Create application** → 弹窗选 **Pages** → **Connect to Git**
3. 找到 `homework-board` 仓库 → **Begin setup**
4. 配置（关键三步）：
   - **Framework preset**：选 `None`
   - **Build command**：**留空**
   - **Build output directory**：填 `.`（一个英文点）
5. 点 **Save and Deploy**，约 1–3 分钟出现 ✅ Success
6. 拿到地址，形如 `https://homework-board-xxxx.pages.dev/?b=haohao0901`

> 因为是纯静态，**不需要**绑定 KV、不需要填 `wrangler.toml`、不需要后端。直接在浏览器里就能用。

## 本地预览

```bash
cd 本目录
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/?b=haohao0901
```

## 使用说明

- **标题**：点顶部标题即可改成自家孩子的名字
- **加作业**：选科目标签（如📖语文）→ 写一条或粘贴微信群作业（自动拆分多条）
- **打卡**：点圆圈勾选，全部完成有庆祝动画
- **分享**：点「🔗 复制链接」把整本打包发 QQ / 微信，家人打开即同步
- **笔记**：可写课堂重点、粘贴/上传板书照片（图片存在链接里，超大图片链接会较长，属正常）

种子本 `?b=haohao0901` 首次打开即带一份示例作业，方便直接照着改。
