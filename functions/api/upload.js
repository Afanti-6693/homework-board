// Cloudflare Pages Function: 图片上传（base64 -> 存 KV）
// POST /api/upload  body: { image: "data:image/png;base64,...." }
// 返回: { url: "/i/xxxx.png", id: "xxxx.png" }
const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' };

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequestPost({ env, request }) {
  if (!env.BOARDS) return json({ error: '尚未配置 KV 存储，上传失败' }, 500);
  let data;
  try { data = await request.json(); } catch (e) { return json({ error: '解析失败' }, 400); }
  const m = /^data:(image\/\w+);base64,(.+)$/.exec(data && data.image ? data.image : '');
  if (!m) return json({ error: '图片格式不对' }, 400);
  const mime = m[1];
  const b64 = m[2];
  if (b64.length > 7 * 1024 * 1024) return json({ error: '图片太大（建议 < 5MB）' }, 413);
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(9)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const fid = rand + (EXT[mime] || '.png');
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  await env.BOARDS.put('img:' + fid, bin, { metadata: { contentType: mime } });
  return json({ url: '/i/' + fid, id: fid });
}
