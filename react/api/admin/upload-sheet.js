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

function parseStatus(raw) {
  const s = String(raw ?? '').trim().toLowerCase();
  return s.startsWith('indispon') ? 'indisponivel' : 'disponivel';
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
      status: parseStatus(r.status),
      updated_at: new Date().toISOString()
    });
  });

  if (parsed.length === 0) return res.status(400).json({ error: 'nenhuma linha válida', erros });

  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingErr } = await supabase
    .from('pieces')
    .select('id')
    .in('id', parsed.map((r) => r.id));
  if (existingErr) return res.status(500).json({ error: existingErr.message });
  const existingIds = new Set((existing ?? []).map((r) => r.id));

  // peças novas usam o status da planilha; peças já cadastradas mantêm o status
  // atual (o campo "status" só é ajustado pela tabela "Peças cadastradas").
  const newRows = parsed.filter((r) => !existingIds.has(r.id));
  const updateRows = parsed
    .filter((r) => existingIds.has(r.id))
    .map(({ status, ...rest }) => rest);

  let salvos = 0;

  if (newRows.length > 0) {
    const { data, error } = await supabase.from('pieces').insert(newRows).select('id');
    if (error) return res.status(500).json({ error: error.message });
    salvos += data.length;
  }

  if (updateRows.length > 0) {
    const { data, error } = await supabase.from('pieces').upsert(updateRows, { onConflict: 'id' }).select('id');
    if (error) return res.status(500).json({ error: error.message });
    salvos += data.length;
  }

  res.status(200).json({ ok: true, salvos, erros });
}
