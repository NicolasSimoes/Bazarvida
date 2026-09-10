import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient.js';
import './admin.css';

const SESSION_KEY = 'adminPassword';

const HEADER_MAP = {
  id: ['id'],
  nome: ['nome', 'name', 'produtos', 'produto'],
  marca: ['marca', 'brand'],
  categoria: ['categoria', 'cat'],
  preco: ['preço', 'preco', 'price'],
  tamanho: ['tamanho', 'size'],
  condicao: ['condição', 'condicao', 'condition'],
  status: ['status']
};

const COMBINING_MARKS = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']',
  'g'
);

function stripAccents(s) {
  return s.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().trim();
}

function normalizeRow(raw) {
  const out = {};
  const keysByStrip = Object.fromEntries(Object.keys(raw).map((k) => [stripAccents(k), raw[k]]));
  for (const [canon, variants] of Object.entries(HEADER_MAP)) {
    const found = variants.map(stripAccents).find((v) => v in keysByStrip);
    out[canon] = found ? keysByStrip[found] : '';
  }
  return out;
}

function isBlankRow(row) {
  return Object.values(row).every((v) => String(v ?? '').trim() === '');
}

async function resizeToJpeg(file, maxWidth = 1400, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: limit }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

export default function AdminPage() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [rows, setRows] = useState([]);
  const [sheetError, setSheetError] = useState(null);
  const [sheetResult, setSheetResult] = useState(null);
  const [sendingSheet, setSendingSheet] = useState(false);

  const [imageStatuses, setImageStatuses] = useState([]);
  const [sendingImages, setSendingImages] = useState(false);

  const [pieces, setPieces] = useState([]);
  const [piecesLoading, setPiecesLoading] = useState(false);
  const [piecesError, setPiecesError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [piecesSearch, setPiecesSearch] = useState('');

  const authenticated = Boolean(password);

  async function loadPieces() {
    setPiecesLoading(true);
    setPiecesError(null);
    const { data, error } = await supabase.from('pieces').select('*').order('id');
    if (error) setPiecesError(error.message);
    else setPieces(data ?? []);
    setPiecesLoading(false);
  }

  useEffect(() => {
    if (authenticated) loadPieces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  async function savePiece(id, patch) {
    setSavingId(id);
    try {
      const res = await fetch('/api/admin/update-piece', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id, ...patch })
      });
      const body = await res.json();
      if (!res.ok) {
        setPiecesError(body.error || 'falha ao salvar peça ' + id);
        return;
      }
      setPieces((prev) => prev.map((p) => (p.id === id ? body.piece : p)));
    } catch (err) {
      setPiecesError('Erro de conexão: ' + err.message);
    } finally {
      setSavingId(null);
    }
  }

  function handlePriceChange(id, value) {
    setPriceDrafts((prev) => ({ ...prev, [id]: value }));
  }

  function commitPrice(id) {
    const draft = priceDrafts[id];
    if (draft === undefined) return;
    const n = Number(draft.replace(',', '.'));
    if (Number.isFinite(n) && n >= 0) savePiece(id, { price: n });
    setPriceDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function toggleStatus(piece) {
    const next = piece.status === 'indisponivel' ? 'disponivel' : 'indisponivel';
    savePiece(piece.id, { status: next });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'x-admin-password': passwordInput }
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setLoginError(body.error || 'senha inválida');
        return;
      }
      sessionStorage.setItem(SESSION_KEY, passwordInput);
      setPassword(passwordInput);
    } catch (err) {
      setLoginError('Erro de conexão: ' + err.message);
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword('');
  }

  async function handleSheetFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSheetError(null);
    setSheetResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      setRows(raw.map(normalizeRow).filter((r) => !isBlankRow(r)));
    } catch (err) {
      setSheetError('Não foi possível ler o arquivo: ' + err.message);
      setRows([]);
    }
  }

  async function submitSheet() {
    if (rows.length === 0) return;
    setSendingSheet(true);
    setSheetError(null);
    setSheetResult(null);
    try {
      const res = await fetch('/api/admin/upload-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ rows })
      });
      const body = await res.json();
      if (!res.ok) {
        setSheetError(body.error || 'falha ao enviar planilha');
        return;
      }
      setSheetResult(body);
      loadPieces();
    } catch (err) {
      setSheetError('Erro de conexão: ' + err.message);
    } finally {
      setSendingSheet(false);
    }
  }

  const preview = useMemo(() => rows.slice(0, 10), [rows]);

  const filteredPieces = useMemo(() => {
    const q = stripAccents(piecesSearch);
    if (!q) return pieces;
    return pieces.filter((p) =>
      [p.id, p.name, p.brand].some((v) => stripAccents(String(v ?? '')).includes(q))
    );
  }, [pieces, piecesSearch]);

  async function handleImageFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const initial = files.map((f) => ({
      name: f.name,
      status: 'pendente',
      message: ''
    }));
    setImageStatuses(initial);
    setSendingImages(true);

    function updateStatus(name, patch) {
      setImageStatuses((prev) => prev.map((s) => (s.name === name ? { ...s, ...patch } : s)));
    }

    await runWithConcurrency(files, 3, async (file) => {
      const id = file.name.replace(/\.[^.]+$/, '');
      const filename = id + '.jpg';
      updateStatus(file.name, { status: 'enviando' });
      try {
        const blob = await resizeToJpeg(file);
        const res = await fetch('/api/admin/upload-image?filename=' + encodeURIComponent(filename), {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream', 'x-admin-password': password },
          body: blob
        });
        const body = await res.json();
        if (!res.ok) {
          updateStatus(file.name, { status: 'erro', message: body.error || 'falha' });
          return;
        }
        updateStatus(file.name, {
          status: 'ok',
          message: body.vinculado ? 'vinculada à peça ' + body.id : 'peça ' + body.id + ' não encontrada ainda'
        });
      } catch (err) {
        updateStatus(file.name, { status: 'erro', message: err.message });
      }
    });

    setSendingImages(false);
  }

  const imagesSent = imageStatuses.filter((s) => s.status === 'ok' || s.status === 'erro').length;

  if (!authenticated) {
    return (
      <div className="admin-page admin-login">
        <form onSubmit={handleLogin}>
          <h1>Bazar da Rebeca — admin</h1>
          <label>
            Senha
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
          </label>
          {loginError && <p className="admin-error">{loginError}</p>}
          <button type="submit" disabled={loggingIn || !passwordInput}>
            {loggingIn ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Bazar da Rebeca — admin</h1>
        <button className="admin-logout" onClick={handleLogout}>Sair</button>
      </header>

      <section className="admin-section">
        <h2>1. Planilha de peças</h2>
        <p className="admin-hint">
          Colunas esperadas: id, nome (ou produtos), marca, categoria, preço, tamanho e,
          opcionalmente, condição e status (Disponível/Indisponível — só é usado para
          peças novas, não altera o status de peças já cadastradas).
          Formato recomendado: .xlsx (também aceita .csv).
        </p>
        <input type="file" accept=".csv,.xlsx" onChange={handleSheetFile} />

        {sheetError && <p className="admin-error">{sheetError}</p>}

        {rows.length > 0 && (
          <>
            <p className="admin-hint">{rows.length} linha(s) lida(s). Prévia das primeiras {preview.length}:</p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>id</th><th>nome</th><th>marca</th><th>categoria</th><th>preço</th><th>tamanho</th><th>condição</th><th>status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i}>
                      <td>{r.id}</td><td>{r.nome}</td><td>{r.marca}</td><td>{r.categoria}</td>
                      <td>{r.preco}</td><td>{r.tamanho}</td><td>{r.condicao}</td><td>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={submitSheet} disabled={sendingSheet}>
              {sendingSheet ? 'Enviando…' : 'Enviar planilha'}
            </button>
          </>
        )}

        {sheetResult && (
          <div className="admin-result">
            <p>{sheetResult.salvos} peça(s) salva(s) com sucesso.</p>
            {sheetResult.erros?.length > 0 && (
              <>
                <p className="admin-error">{sheetResult.erros.length} linha(s) com erro:</p>
                <ul>
                  {sheetResult.erros.map((e, i) => (
                    <li key={i}>linha {e.linha}{e.id ? ' (' + e.id + ')' : ''}: {e.motivo}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>2. Fotos das peças</h2>
        <p className="admin-hint">
          Selecione as fotos nomeadas com o id da peça (ex: BR-01.jpg). Qualquer formato de imagem é
          convertido para JPEG automaticamente antes do envio.
        </p>
        <input type="file" accept="image/*" multiple onChange={handleImageFiles} />

        {imageStatuses.length > 0 && (
          <>
            <p className="admin-hint">{imagesSent} de {imageStatuses.length} enviada(s)</p>
            <ul className="admin-image-list">
              {imageStatuses.map((s) => (
                <li key={s.name} className={'admin-image-status admin-image-status--' + s.status}>
                  <span className="admin-image-name">{s.name}</span>
                  <span className="admin-image-state">{s.status}</span>
                  {s.message && <span className="admin-image-message">{s.message}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        {sendingImages && <p className="admin-hint">Enviando imagens…</p>}
      </section>

      <section className="admin-section">
        <h2>3. Peças cadastradas</h2>
        <p className="admin-hint">
          Ajuste preço ou disponibilidade sem precisar reenviar a planilha inteira.
          Peças "Indisponível" continuam aparecendo na página pública, só ficam travadas pra seleção.
        </p>

        {piecesError && <p className="admin-error">{piecesError}</p>}
        {piecesLoading && <p className="admin-hint">Carregando…</p>}

        {!piecesLoading && pieces.length > 0 && (
          <>
            <input
              type="text"
              className="admin-search"
              placeholder="Buscar por id, nome ou marca…"
              value={piecesSearch}
              onChange={(e) => setPiecesSearch(e.target.value)}
            />
            <p className="admin-hint">
              {filteredPieces.length} de {pieces.length} peça(s)
            </p>
          </>
        )}

        {!piecesLoading && filteredPieces.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-pieces">
              <thead>
                <tr>
                  <th>id</th><th>nome</th><th>marca</th><th>preço</th><th>status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPieces.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.brand}</td>
                    <td>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="admin-price-input"
                        value={priceDrafts[p.id] ?? String(p.price)}
                        onChange={(e) => handlePriceChange(p.id, e.target.value)}
                        onBlur={() => commitPrice(p.id)}
                        disabled={savingId === p.id}
                      />
                    </td>
                    <td>
                      <button
                        className={'admin-status-toggle admin-status-toggle--' + p.status}
                        onClick={() => toggleStatus(p)}
                        disabled={savingId === p.id}
                      >
                        {p.status === 'indisponivel' ? 'Indisponível' : 'Disponível'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!piecesLoading && pieces.length === 0 && !piecesError && (
          <p className="admin-hint">Nenhuma peça cadastrada ainda.</p>
        )}

        {!piecesLoading && pieces.length > 0 && filteredPieces.length === 0 && (
          <p className="admin-hint">Nenhuma peça encontrada para "{piecesSearch}".</p>
        )}
      </section>
    </div>
  );
}
