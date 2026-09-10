import { checkPassword, getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!checkPassword(req)) return res.status(401).json({ error: 'senha inválida' });

  const { imageId } = req.body || {};
  if (!imageId) return res.status(400).json({ error: 'imageId ausente' });

  const supabase = getSupabaseAdmin();

  const { data: row } = await supabase.from('piece_images').select('storage_path').eq('id', imageId).maybeSingle();
  if (!row) return res.status(404).json({ error: 'imagem não encontrada' });

  await supabase.storage.from('pecas').remove([row.storage_path]);
  await supabase.from('piece_images').delete().eq('id', imageId);

  res.status(200).json({ ok: true });
}
