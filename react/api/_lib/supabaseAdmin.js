import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export function checkPassword(req) {
  const header = req.headers['x-admin-password'];
  return Boolean(header) && Boolean(process.env.ADMIN_PASSWORD) && header === process.env.ADMIN_PASSWORD;
}
