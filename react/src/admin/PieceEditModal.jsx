import { useState } from 'react';

export default function PieceEditModal({ piece, password, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: piece.name,
    brand: piece.brand,
    cat: piece.cat,
    size: piece.size,
    condition: piece.condition ?? '',
    price: String(piece.price)
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const price = Number(form.price.replace(',', '.'));
    if (!Number.isFinite(price) || price < 0) {
      setError('Preço inválido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/update-piece', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          id: piece.id,
          name: form.name,
          brand: form.brand,
          cat: form.cat,
          size: form.size,
          condition: form.condition,
          price
        })
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'falha ao salvar peça');
        return;
      }
      onSaved(body.piece);
      onClose();
    } catch (err) {
      setError('Erro de conexão: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar {piece.id}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form className="admin-edit-form" onSubmit={handleSubmit}>
          <label>
            Nome
            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
          </label>
          <label>
            Marca
            <input type="text" value={form.brand} onChange={(e) => handleChange('brand', e.target.value)} required />
          </label>
          <label>
            Categoria
            <input type="text" value={form.cat} onChange={(e) => handleChange('cat', e.target.value)} required />
          </label>
          <label>
            Tamanho
            <input type="text" value={form.size} onChange={(e) => handleChange('size', e.target.value)} required />
          </label>
          <label>
            Condição
            <input type="text" value={form.condition} onChange={(e) => handleChange('condition', e.target.value)} />
          </label>
          <label>
            Preço
            <input type="text" inputMode="decimal" value={form.price} onChange={(e) => handleChange('price', e.target.value)} required />
          </label>

          {error && <p className="admin-error">{error}</p>}

          <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
        </form>
      </div>
    </div>
  );
}
