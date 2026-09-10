import pg from 'pg';

const { Client } = pg;

const SQL = `
create table if not exists public.pieces (
  id          text primary key,
  brand       text not null,
  name        text not null,
  cat         text not null,
  size        text not null,
  condition   text not null,
  price       numeric(10,2) not null,
  image_url   text,
  status      text not null default 'disponivel',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.pieces add column if not exists status text not null default 'disponivel';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pieces_status_check'
  ) then
    alter table public.pieces
      add constraint pieces_status_check check (status in ('disponivel', 'indisponivel'));
  end if;
end $$;

alter table public.pieces enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'pieces' and policyname = 'pieces_public_read'
  ) then
    create policy "pieces_public_read" on public.pieces for select using (true);
  end if;
end $$;
`;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
try {
  await client.query(SQL);
  console.log('Migração ok: tabela "pieces" pronta (com coluna status).');
} finally {
  await client.end();
}
