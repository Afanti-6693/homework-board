#!/usr/bin/env node
// 把识别好的作业条，安全合并写入某个共享本（不覆盖已有内容）
// 用法: node fill_board.js <boardId> <tasks.json> [--base https://...]
// tasks.json 形如: [{"text":"练习册P10","subject":"数学","type":"homework"}, ...]
const https = require('https');
const http = require('http');

const boardId = process.argv[2];
const tasksFile = process.argv[3];
let BASE = 'https://a6f2807e0e2ba221e.app.workbuddy.link';
for (let i = 4; i < process.argv.length; i++) {
  if (process.argv[i] === '--base') BASE = process.argv[++i];
}
if (!boardId || !tasksFile) {
  console.error('用法: node fill_board.js <boardId> <tasks.json> [--base URL]');
  process.exit(1);
}

const newTasks = JSON.parse(require('fs').readFileSync(tasksFile, 'utf8'));

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const mod = url.protocol === 'https:' ? https : http;
    const r = mod.request(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function normId() { return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

(async () => {
  const cur = await req('GET', '/api/board/' + boardId);
  let board = {};
  try { board = JSON.parse(cur.body); } catch (e) { board = {}; }
  board.title = board.title || '我的作业本';
  board.tasks = Array.isArray(board.tasks) ? board.tasks : [];
  board.notes = Array.isArray(board.notes) ? board.notes : [];

  // 去重：相同 text+subject+type 视为已存在
  const exist = new Set(board.tasks.map(t => (t.text || '') + '|' + (t.subject || '') + '|' + (t.type || '')));
  let added = 0;
  newTasks.forEach(t => {
    const key = (t.text || '') + '|' + (t.subject || '') + '|' + (t.type || '');
    if (exist.has(key)) return;
    board.tasks.push({
      id: normId(),
      text: t.text,
      subject: t.subject || '语文',
      type: t.type || 'homework',
      done: false
    });
    exist.add(key);
    added++;
  });
  board._v = (board._v || 0) + 1;

  const res = await req('POST', '/api/board/' + boardId, board);
  console.log('新增作业条:', added, '/ 本子现有:', board.tasks.length);
  console.log('写入返回:', res.status, res.body);
})().catch(e => { console.error('错误:', e.message); process.exit(1); });
