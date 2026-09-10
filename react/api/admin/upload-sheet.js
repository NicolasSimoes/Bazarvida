import { checkPassword, getSupabaseAdmin } from '../_lib/supabaseAdmin.js';

function parsePrice(raw) {
  if (typeof raw === 'number') return raw;
  const s = String(raw ?? '').trim()
    .replace(/[Rr]\$\s?/, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!checkPassword(req)) return res.status(401).json({ error: 'senha inválida' });

  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows) return res.status(400).json({ error: 'campo "rows" ausente ou inválido' });

  const parsed = [];
  const erros = [];

  rows.forEach((r, i) => {
    const id = String(r.id ?? '').trim();
    const price = parsePrice(r.preco);
    if (!id) { erros.push({ linha: i + 2, motivo: 'id vazio' }); return; }
    if (Number.isNaN(price)) { erros.push({ linha: i + 2, id, motivo: 'preço inválido' }); return; }
    parsed.push({
      id,
      name: String(r.nome ?? '').trim(),
      brand: String(r.marca ?? '').trim(),
      cat: String(r.categoria ?? '').trim(),
      size: String(r.tamanho ?? '').trim(),
      condition: String(r.condicao ?? '').trim(),
      price,
      updated_at: new Date().toISOString()
    });
  });

  if (parsed.length === 0) return res.status(400).json({ error: 'nenhuma linha válida', erros });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('pieces').upsert(parsed, { onConflict: 'id' }).select('id');
  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ ok: true, salvos: data.length, erros });
}
