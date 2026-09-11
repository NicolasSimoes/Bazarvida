import { checkPassword, getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!checkPassword(req)) return res.status(401).json({ error: 'senha inválida' });

  const { id, price, status, name, brand, cat, size, condition } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id ausente' });

  const patch = { updated_at: new Date().toISOString() };

  if (price !== undefined) {
    const n = Number(price);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: 'preço inválido' });
    patch.price = n;
  }

  if (status !== undefined) {
    if (status !== 'disponivel' && status !== 'indisponivel') {
      return res.status(400).json({ error: 'status inválido, esperado "disponivel" ou "indisponivel"' });
    }
    patch.status = status;
  }

  const textFields = { name, brand, cat, size, condition };
  for (const [field, value] of Object.entries(textFields)) {
    if (value === undefined) continue;
    const trimmed = String(value).trim();
    if (field !== 'condition' && !trimmed) {
      return res.status(400).json({ error: field + ' não pode ficar vazio' });
    }
    patch[field] = trimmed;
  }

  if (Object.keys(patch).length === 1) {
    return res.status(400).json({ error: 'nada para atualizar' });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('pieces').update(patch).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ ok: true, piece: data });
}
