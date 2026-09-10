# Bazar da Rebeca — landing page (React + Vite + Supabase)

## Rodar localmente

O site tem duas partes: a página pública (Vite puro) e as rotas de admin em `/api`
(Vercel Serverless Functions). Para rodar as duas juntas localmente, use a CLI da Vercel:

```bash
npm install
npx vercel dev
```

`npm run dev` (Vite puro) só serve a página pública — as rotas `/api/admin/*` não
funcionam sem `vercel dev` ou um deploy real.

## Variáveis de ambiente

Criar um Supabase project (tabela `pieces` + bucket público `pecas`, ver seção abaixo)
e configurar as variáveis abaixo, tanto no dashboard da Vercel (Project Settings →
Environment Variables) quanto localmente em `react/.env` (não versionado):

| Variável | Onde pegar | Segredo? |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API | não |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon/publishable key) | não |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role/secret key) | **sim** |
| `ADMIN_PASSWORD` | escolhida por você | **sim** |
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string (URI) | **sim** — só usada pelo script de migração, não sobe pra Vercel |

`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` podem ficar públicas: a anon key só tem
permissão de leitura (RLS bloqueia insert/update/delete). `SUPABASE_SERVICE_ROLE_KEY`,
`ADMIN_PASSWORD` e `DATABASE_URL` nunca devem ter o prefixo `VITE_` (senão vazam no
bundle do site).

Depois de configurar no dashboard da Vercel, dá pra puxar pro `.env` local com:

```bash
vercel link
vercel env pull .env
```

## Configurar o Supabase

1. Criar o projeto em [supabase.com](https://supabase.com).
2. Copiar `DATABASE_URL` (Project Settings → Database → Connection string → URI,
   com a senha do banco já preenchida no lugar de `[YOUR-PASSWORD]`, sem colchetes)
   pro `react/.env`.
3. Rodar a migração (cria as tabelas `pieces` e `piece_images`, com as policies de
   leitura pública — é idempotente, pode rodar de novo sem problema):

```bash
node --env-file=.env scripts/migrate.mjs
```

4. Em Storage, criar um bucket público chamado **`pecas`**.

Opcional: popular a tabela com os 12 itens de exemplo de `src/pieces.js`:

```bash
node --env-file=.env scripts/seed.mjs
```

## Onde editar

- **Número do WhatsApp / endereço / dias / marcas**: `src/config.js`
- **Peças do portfólio**: vivem no Supabase (tabela `pieces`), gerenciadas pela
  página `/admin` — não edite mais `src/pieces.js` diretamente (esse arquivo só serve
  de dado de exemplo pro script de seed).
- **Mensagem enviada ao clicar em "Finalizar"**: `src/whatsapp.js` (`reservaMultiplaLink`)
- **Estilos**: `src/styles.css` (cores no `:root`) e `src/admin/admin.css` (só admin)

Os filtros de categoria são gerados automaticamente a partir do campo `cat` das peças.

## Página `/admin`

Acesse `/admin`, entre com a senha (`ADMIN_PASSWORD`) e:

1. **Planilha**: envie um `.xlsx` (recomendado) ou `.csv` com colunas
   `id, nome (ou produtos), marca, categoria, preço, tamanho` e, opcionalmente,
   `condição` e `status`. O `id` precisa ser único — é ele que aparece na mensagem
   do WhatsApp e que liga a peça à sua foto. Reenviar a planilha atualiza as peças
   existentes (mesmo `id`) em vez de duplicar, e **não mexe no status** de
   disponibilidade de peças já cadastradas — a coluna `status` (aceita
   "Disponível"/"Indisponível") só define o status inicial de peças **novas**;
   linhas totalmente vazias (comuns em planilhas exportadas do Excel) são ignoradas.
2. **Peças cadastradas**: tabela com todas as peças já no banco. Dá pra editar o
   **preço** (clique no campo, mude o valor, saia do campo pra salvar), alternar
   **Disponível ↔ Indisponível** num clique, e clicar em **Fotos (N)** pra abrir o
   gerenciador de fotos daquela peça: envie quantas imagens quiser (qualquer formato,
   convertido pra JPEG automaticamente no navegador antes do envio) e apague fotos
   enviadas por engano. Fotos de iPhone em `.heic` podem não converter em todos os
   navegadores — configure a câmera em Ajustes → Câmera → Formatos → "Mais compatível",
   ou converta antes de subir. Peças com mais de uma foto mostram um carrossel
   deslizável na página pública.

## Status "Indisponível"

Peças marcadas como indisponíveis continuam aparecendo na grade pública (com o card
apagado e um selo "Indisponível"), mas não podem ser selecionadas pro WhatsApp.

## Seleção múltipla

Na página pública, cada peça disponível tem um checkbox de seleção. Ao marcar 1 ou
mais peças, aparece um botão flutuante "Finalizar (N)" que abre o WhatsApp com uma
única mensagem listando todas as peças escolhidas (id, marca, nome, preço) e o total.
