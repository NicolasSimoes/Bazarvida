import { checkPassword, getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!checkPassword(req)) return res.status(401).json({ error: 'senha inválida' });

  const filename = String(req.query.filename || '').trim();
  if (!/^[\w-]+\.jpg$/i.test(filename)) {
    return res.status(400).json({ error: 'nome de arquivo inválido, esperado <id>.jpg' });
  }
  const id = filename.replace(/\.jpg$/i, '');

  const buffer = await readRawBody(req);
  if (buffer.length === 0) return res.status(400).json({ error: 'arquivo vazio' });
  if (buffer.length > 4 * 1024 * 1024) {
    return res.status(413).json({ error: 'imagem maior que 4MB — algo falhou no redimensionamento' });
  }

  const supabase = getSupabaseAdmin();
  const { error: upErr } = await supabase.storage.from('pecas').upload(filename, buffer, {
    contentType: 'image/jpeg',
    upsert: true
  });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data: pub } = supabase.storage.from('pecas').getPublicUrl(filename);
  const { data: updData, error: updErr } = await supabase
    .from('pieces')
    .update({ image_url: pub.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id');

  res.status(200).json({
    ok: true,
    id,
    url: pub.publicUrl,
    vinculado: !updErr && (updData?.length ?? 0) > 0
  });
}
