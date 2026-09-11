import { useMemo, useState } from 'react';

export default function BrandFilter({ brands, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.toLowerCase().includes(q));
  }, [brands, query]);

  function select(b) {
    onChange(b);
    setOpen(false);
    setQuery('');
  }

  return (
    <>
      <button
        className={'brand-trigger' + (value !== 'Todas' ? ' brand-trigger--active' : '')}
        onClick={() => setOpen(true)}
      >
        {value === 'Todas' ? 'Marca' : value}
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 7l5 6 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="sheet-overlay" onClick={() => setOpen(false)}>
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <h3>Marca</h3>
              <button className="sheet-close" onClick={() => setOpen(false)} aria-label="Fechar">×</button>
            </div>
            <input
              type="text"
              className="sheet-search"
              placeholder="Buscar marca…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div className="sheet-list">
              <button
                className={'sheet-option' + (value === 'Todas' ? ' sheet-option--active' : '')}
                onClick={() => select('Todas')}
              >
                Todas as marcas
              </button>
              {filtered.map((b) => (
                <button
                  key={b}
                  className={'sheet-option' + (value === b ? ' sheet-option--active' : '')}
                  onClick={() => select(b)}
                >
                  {b}
                </button>
              ))}
              {filtered.length === 0 && <p className="sheet-empty">Nenhuma marca encontrada.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
