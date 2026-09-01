// 小学生作业本 · 轻量后端：公开共享本 + 图片存盘
// 仅用 Node 内置模块，零第三方依赖。运行：node server.js  (默认端口 8080)
// 环境变量：PORT 监听端口（部署平台会自动注入）
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const IMG_DIR = path.join(ROOT, 'data', 'images');
const BOARD_DIR = path.join(ROOT, 'data', 'boards');
fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(BOARD_DIR, { recursive: true });

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
const EXT_BY_MIME = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' };

function sendJSON(res, code, obj, extra) {
  res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }, extra || {}));
  res.end(JSON.stringify(obj));
}
// 只允许字母数字，杜绝路径穿越
function sanitizeId(id) { return (id || '').toString().replace(/[^a-zA-Z0-9]/g, '').slice(0, 40); }

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(u.pathname);

  // 1) 读取已上传图片（保留扩展名并校验格式，防穿越）
  if (req.method === 'GET' && pathname.startsWith('/i/')) {
    const base = path.basename(pathname);
    if (!/^[a-zA-Z0-9]+\.(png|jpe?g|gif|webp)$/.test(base)) { res.writeHead(400); res.end('bad name'); return; }
    const fp = path.join(IMG_DIR, base);
    if (fp.startsWith(IMG_DIR) && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      const ext = path.extname(fp).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000' });
      fs.createReadStream(fp).pipe(res);
    } else { res.writeHead(404); res.end('not found'); }
    return;
  }

  // 2) 健康检查（公开，供部署平台探活）
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJSON(res, 200, { ok: true, public: true });
  }

  // 3) 读取共享本
  if (req.method === 'GET' && pathname.startsWith('/api/board/')) {
    const id = sanitizeId(pathname.slice('/api/board/'.length));
    if (!id) return sendJSON(res, 400, { error: 'bad id' });
    const fp = path.join(BOARD_DIR, id + '.json');
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      fs.createReadStream(fp).pipe(res);
    } else {
      sendJSON(res, 200, {}); // 不存在即空白本，避免前端无谓的 404
    }
    return;
  }

  // 4) 保存共享本（公开，任何人持链接即可写；靠不可猜测的 ID 保护）
  if (req.method === 'POST' && pathname.startsWith('/api/board/')) {
    const id = sanitizeId(pathname.slice('/api/board/'.length));
    if (!id) return sendJSON(res, 400, { error: 'bad id' });
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 2 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      try {
        const obj = JSON.parse(body);
        if (!obj || typeof obj !== 'object') return sendJSON(res, 400, { error: '格式不对' });
        fs.writeFileSync(path.join(BOARD_DIR, id + '.json'), JSON.stringify(obj));
        sendJSON(res, 200, { ok: true, id: id });
      } catch (e) { sendJSON(res, 400, { error: '解析失败' }); }
    });
    return;
  }

  // 5) 上传图片（公开）
  if (req.method === 'POST' && pathname === '/api/upload') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 10 * 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const m = /^data:(image\/\w+);base64,(.+)$/.exec(data && data.image ? data.image : '');
        if (!m) return sendJSON(res, 400, { error: '图片格式不对' });
        const mime = m[1]; const b64 = m[2];
        if (b64.length > 7 * 1024 * 1024) return sendJSON(res, 413, { error: '图片太大（建议 < 5MB）' });
        const ext = EXT_BY_MIME[mime] || '.png';
        const fid = crypto.randomBytes(9).toString('hex') + ext;
        fs.writeFileSync(path.join(IMG_DIR, fid), Buffer.from(b64, 'base64'));
        sendJSON(res, 200, { url: '/i/' + fid, id: fid });
      } catch (e) { sendJSON(res, 400, { error: '解析失败' }); }
    });
    return;
  }

  // 6) 页面 / 静态文件：公开返回
  let rel = pathname === '/' ? '/index.html' : pathname;
  const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
  const fp = path.join(ROOT, safe);
  if (fp.startsWith(ROOT) && fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const ext = path.extname(fp).toLowerCase();
    const CT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
    res.writeHead(200, { 'Content-Type': CT[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(fp).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log('🌟 作业本服务已启动（公开共享本）: http://localhost:' + PORT);
});
