import { randomUUID } from 'node:crypto';
import { checkPassword, getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { readRawBody } from '../_lib/readRawBody.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!checkPassword(req)) return res.status(401).json({ error: 'senha inválida' });

  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'id da peça ausente' });

  const supabase = getSupabaseAdmin();

  const { data: piece } = await supabase.from('pieces').select('id').eq('id', id).maybeSingle();
  if (!piece) return res.status(404).json({ error: 'peça não encontrada' });

  const buffer = await readRawBody(req);
  if (buffer.length === 0) return res.status(400).json({ error: 'arquivo vazio' });
  if (buffer.length > 4 * 1024 * 1024) {
    return res.status(413).json({ error: 'imagem maior que 4MB — algo falhou no redimensionamento' });
  }

  const path = id + '/' + randomUUID() + '.jpg';
  const { error: upErr } = await supabase.storage.from('pecas').upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: false,
    cacheControl: '31536000'
  });
  if (upErr) return res.status(500).json({ error: upErr.message });

  const { data: pub } = supabase.storage.from('pecas').getPublicUrl(path);

  const { data: last } = await supabase
    .from('piece_images')
    .select('position')
    .eq('piece_id', id)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = last ? last.position + 1 : 0;

  const { data: image, error: insErr } = await supabase
    .from('piece_images')
    .insert({ piece_id: id, storage_path: path, url: pub.publicUrl, position: nextPosition })
    .select()
    .single();

  if (insErr) {
    await supabase.storage.from('pecas').remove([path]).catch(() => {});
    return res.status(500).json({ error: insErr.message });
  }

  res.status(200).json({ ok: true, image });
}
