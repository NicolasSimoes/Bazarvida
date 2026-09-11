import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { resizeToJpeg, runWithConcurrency } from './imageUpload.js';

export default function PieceImagesManager({ piece, password, onClose, onChanged }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadStatuses, setUploadStatuses] = useState([]);
  const [sendingImages, setSendingImages] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [movingId, setMovingId] = useState(null);

  async function loadImages() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('piece_images')
      .select('*')
      .eq('piece_id', piece.id)
      .order('position');
    if (err) setError(err.message);
    else setImages(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece.id]);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const initial = files.map((f) => ({ name: f.name, status: 'pendente', message: '' }));
    setUploadStatuses(initial);
    setSendingImages(true);

    function updateStatus(name, patch) {
      setUploadStatuses((prev) => prev.map((s) => (s.name === name ? { ...s, ...patch } : s)));
    }

    await runWithConcurrency(files, 3, async (file) => {
      updateStatus(file.name, { status: 'enviando' });
      try {
        const blob = await resizeToJpeg(file);
        const res = await fetch('/api/admin/upload-piece-image?id=' + encodeURIComponent(piece.id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream', 'x-admin-password': password },
          body: blob
        });
        const body = await res.json();
        if (!res.ok) {
          updateStatus(file.name, { status: 'erro', message: body.error || 'falha' });
          return;
        }
        updateStatus(file.name, { status: 'ok', message: '' });
        setImages((prev) => [...prev, body.image]);
        onChanged();
      } catch (err) {
        updateStatus(file.name, { status: 'erro', message: err.message });
      }
    });

    setSendingImages(false);
  }

  async function handleDelete(imageId) {
    if (!window.confirm('Apagar essa foto? Não tem como desfazer.')) return;
    setDeletingId(imageId);
    try {
      const res = await fetch('/api/admin/delete-piece-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ imageId })
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'falha ao apagar foto');
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      onChanged();
    } catch (err) {
      setError('Erro de conexão: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMove(imageId, direction) {
    const index = images.findIndex((img) => img.id === imageId);
    const swapIndex = direction === 'left' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= images.length) return;

    setMovingId(imageId);
    try {
      const res = await fetch('/api/admin/move-piece-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ imageId, direction })
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'falha ao mover foto');
        return;
      }
      setImages((prev) => {
        const next = [...prev];
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
        return next;
      });
    } catch (err) {
      setError('Erro de conexão: ' + err.message);
    } finally {
      setMovingId(null);
    }
  }

  const imagesSent = uploadStatuses.filter((s) => s.status === 'ok' || s.status === 'erro').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{piece.id} — {piece.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p className="admin-hint">
          Selecione as fotos dessa peça. Qualquer formato de imagem é convertido para JPEG
          automaticamente antes do envio.
        </p>
        <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={sendingImages} />

        {uploadStatuses.length > 0 && (
          <>
            <p className="admin-hint">{imagesSent} de {uploadStatuses.length} enviada(s)</p>
            <ul className="admin-image-list">
              {uploadStatuses.map((s) => (
                <li key={s.name} className={'admin-image-status admin-image-status--' + s.status}>
                  <span className="admin-image-name">{s.name}</span>
                  <span className="admin-image-state">{s.status}</span>
                  {s.message && <span className="admin-image-message">{s.message}</span>}
                </li>
              ))}
            </ul>
          </>
        )}

        {error && <p className="admin-error">{error}</p>}
        {loading && <p className="admin-hint">Carregando fotos…</p>}

        {!loading && images.length === 0 && (
          <p className="admin-hint">Nenhuma foto cadastrada ainda.</p>
        )}

        {!loading && images.length > 1 && (
          <p className="admin-hint">A ordem abaixo é a ordem do carrossel na página pública.</p>
        )}

        {!loading && images.length > 0 && (
          <div className="piece-images-grid">
            {images.map((img, i) => (
              <div key={img.id} className="piece-image-item">
                <img src={img.url} alt="" />
                <div className="piece-image-actions">
                  <button
                    onClick={() => handleMove(img.id, 'left')}
                    disabled={i === 0 || movingId !== null}
                    aria-label="Mover pra esquerda"
                  >‹</button>
                  <button onClick={() => handleDelete(img.id)} disabled={deletingId === img.id}>
                    {deletingId === img.id ? '…' : 'Excluir'}
                  </button>
                  <button
                    onClick={() => handleMove(img.id, 'right')}
                    disabled={i === images.length - 1 || movingId !== null}
                    aria-label="Mover pra direita"
                  >›</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
