// Cloudflare Pages Function: 读取已上传图片
// GET /i/xxxx.png  -> 从 KV 读取二进制图片
const CT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' };

export async function onRequestGet({ env, params }) {
  const file = params.file;
  if (!/^[a-zA-Z0-9]+\.(png|jpe?g|gif|webp)$/.test(file)) {
    return new Response('bad name', { status: 400 });
  }
  if (!env.BOARDS) return new Response('not found', { status: 404 });
  const v = await env.BOARDS.get('img:' + file, { type: 'arrayBuffer' });
  if (v === null) return new Response('not found', { status: 404 });
  const ext = file.split('.').pop().toLowerCase();
  return new Response(v, {
    headers: { 'Content-Type': CT[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000' }
  });
}
