import { createClient } from '@supabase/supabase-js';
import { PIECES } from '../src/pieces.js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const rows = PIECES.map(({ id, brand, name, cat, size, condition, price }) => ({
  id,
  brand,
  name,
  cat,
  size,
  condition,
  price: Number(String(price).replace(/[^\d,]/g, '').replace(',', '.'))
}));

const { error, data } = await supabase.from('pieces').upsert(rows, { onConflict: 'id' }).select('id');
if (error) {
  console.error(error);
  process.exit(1);
}
console.log('Seed ok:', data.length, 'peças');
