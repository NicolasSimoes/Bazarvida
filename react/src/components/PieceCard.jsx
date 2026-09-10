import { formatPrice } from '../format.js';

export default function PieceCard({ piece, selected, onToggle }) {
  const disponivel = piece.status !== 'indisponivel';

  return (
    <div
      className={'card' + (selected ? ' card-selected' : '') + (disponivel ? '' : ' card-disabled')}
      role="checkbox"
      aria-checked={selected}
      aria-disabled={!disponivel}
      tabIndex={disponivel ? 0 : -1}
      onClick={() => { if (disponivel) onToggle(piece.id); }}
      onKeyDown={(e) => {
        if (!disponivel) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(piece.id); }
      }}
    >
      <div className="thumb">
        {piece.image_url
          ? <img src={piece.image_url} alt={piece.brand + ' ' + piece.name} loading="lazy" />
          : <span className="empty">foto {piece.id}</span>}
        <span className="tag">{piece.id}</span>
        {disponivel && <span className="checkbox" aria-hidden="true">{selected ? '✓' : ''}</span>}
        {!disponivel && <span className="badge-indisponivel">Indisponível</span>}
      </div>
      <div className="body">
        <span className="brand">{piece.brand}</span>
        <span className="name">{piece.name}</span>
        <span className="meta">Tam. {piece.size} · {piece.condition}</span>
        <div className="foot">
          <span className="price">{formatPrice(piece.price)}</span>
          <span className="cta">
            {!disponivel ? 'Indisponível' : selected ? 'Selecionada ✓' : 'Selecionar'}
          </span>
        </div>
      </div>
    </div>
  );
}
