import { checkPassword, getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!checkPassword(req)) return res.status(401).json({ error: 'senha inválida' });

  const { imageId, direction } = req.body || {};
  if (!imageId || (direction !== 'left' && direction !== 'right')) {
    return res.status(400).json({ error: 'parâmetros inválidos' });
  }

  const supabase = getSupabaseAdmin();

  const { data: current } = await supabase.from('piece_images').select('id, piece_id, position').eq('id', imageId).maybeSingle();
  if (!current) return res.status(404).json({ error: 'imagem não encontrada' });

  const { data: siblings, error: sibErr } = await supabase
    .from('piece_images')
    .select('id, position')
    .eq('piece_id', current.piece_id)
    .order('position');
  if (sibErr) return res.status(500).json({ error: sibErr.message });

  const index = siblings.findIndex((s) => s.id === current.id);
  const swapIndex = direction === 'left' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) {
    return res.status(200).json({ ok: true });
  }

  const other = siblings[swapIndex];
  const { error: err1 } = await supabase.from('piece_images').update({ position: other.position }).eq('id', current.id);
  if (err1) return res.status(500).json({ error: err1.message });
  const { error: err2 } = await supabase.from('piece_images').update({ position: current.position }).eq('id', other.id);
  if (err2) return res.status(500).json({ error: err2.message });

  res.status(200).json({ ok: true });
}
