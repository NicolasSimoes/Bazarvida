import { checkPassword } from '../_lib/supabaseAdmin.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  if (!checkPassword(req)) return res.status(401).json({ error: 'senha inválida' });
  res.status(200).json({ ok: true });
}
