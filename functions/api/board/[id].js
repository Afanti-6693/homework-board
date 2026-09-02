// Cloudflare Pages Function: 读取/保存共享本
// GET  /api/board/:id  -> 返回整本 JSON（不存在则返回 {} 或种子本）
// POST /api/board/:id  -> 保存整本 JSON
// 数据存于 Cloudflare KV（binding 名称必须为 BOARDS）

// 开箱即用的种子本：首次访问 haohao0901 时自动写入 KV
const SEED = {
  haohao0901: {
    title: "学霸小雨点的作业本",
    tasks: [
      { id: "tmtiioo4txdn1q", text: "练习 P1-2", subject: "数学", type: "homework", done: true },
      { id: "tmtiioo4tlux6s", text: "制作长方体、正方体，沿边剪开展开图（明天带来）", subject: "数学", type: "homework", done: true },
      { id: "mtiir8zhmpii", text: "预习第2课 + 解词2个（不理解）", subject: "语文", time: "", done: true, type: "homework" },
      { id: "mtiisgvmussd", text: "明天检查预习", subject: "其他", time: "", done: true, type: "notice" },
      { id: "mtiit99f46t1", text: "明天上午科学课带两张A4彩色卡纸 彩笔", subject: "其他", time: "", done: false, type: "notice" },
      { id: "mtij0uro3zby", text: "造句：向….向…向….", subject: "语文", time: "", done: true, type: "homework" }
    ],
    _v: 25
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function safeId(id) {
  return (id || '').toString().replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
}

export async function onRequestGet({ env, params }) {
  const id = safeId(params.id);
  if (!id) return json({ error: 'bad id' }, 400);
  // 未绑定 KV 时降级：直接返回内置种子，保证页面能打开
  if (!env.BOARDS) return json(SEED[id] || {});
  let v = await env.BOARDS.get('board:' + id);
  if (v === null) {
    if (SEED[id]) {
      v = JSON.stringify(SEED[id]);
      await env.BOARDS.put('board:' + id, v); // 固化种子
    } else {
      return json({});
    }
  }
  return new Response(v, {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export async function onRequestPost({ env, params, request }) {
  const id = safeId(params.id);
  if (!id) return json({ error: 'bad id' }, 400);
  if (!env.BOARDS) return json({ error: '尚未配置 KV 存储，保存失败' }, 500);
  let body;
  try { body = await request.text(); } catch (e) { return json({ error: '读取失败' }, 400); }
  let obj;
  try { obj = JSON.parse(body); } catch (e) { return json({ error: '解析失败' }, 400); }
  if (!obj || typeof obj !== 'object') return json({ error: '格式不对' }, 400);
  await env.BOARDS.put('board:' + id, JSON.stringify(obj));
  return json({ ok: true, id });
}
