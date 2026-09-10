import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { BAZAR } from './config.js';
import { waLink, reservaMultiplaLink } from './whatsapp.js';
import PieceCard from './components/PieceCard.jsx';
import Star from './components/Star.jsx';

export default function App() {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [cat, setCat] = useState('Todas');
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    supabase
      .from('pieces')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setLoadError(error.message);
        else setPieces(data ?? []);
        setLoading(false);
      });
  }, []);

  const cats = useMemo(() => ['Todas', ...new Set(pieces.map((p) => p.cat))], [pieces]);
  const list = useMemo(() => (cat === 'Todas' ? pieces : pieces.filter((p) => p.cat === cat)), [cat, pieces]);

  function toggleSelect(id) {
    const piece = pieces.find((p) => p.id === id);
    if (!piece || piece.status === 'indisponivel') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const selectedPieces = useMemo(() => pieces.filter((p) => selected.has(p.id)), [pieces, selected]);

  return (
    <div className="page">
      <div className="hero pad">
        <div className="hero-bg">
          {/* troque por uma foto real: <img src="/hero.jpg" alt="" /> */}
          <div className="scrim" />
        </div>

        <header className="header">
          <span className="brand">Bazar da Rebeca</span>
          <nav>
            <a href="#pecas">Peças</a>
            <a href="#marcas">Marcas</a>
            <a href="#visita">Como visitar</a>
          </nav>
        </header>

        <section className="hero-inner">
          <Star />
          <h1 className="title">
            <span className="underline">Bazar</span> da Rebeca
          </h1>

          <div className="hero-row">
            <div className="price-blob">
              de R$<em>5,00</em> a R$<em>100,00</em> reais
            </div>
            <p className="hero-lead">
              Peças garimpadas de marcas que a gente ama, em bom estado e com preço de bazar.
              Escolha a sua na grade abaixo e reserve pelo WhatsApp.
            </p>
          </div>
        </section>
      </div>

      <section id="marcas" className="pad" style={{ paddingBottom: 'clamp(40px,7vw,72px)' }}>
        <div className="brands">
          {BAZAR.marcas.map((b) => <span key={b}>{b}</span>)}
        </div>
      </section>

      <section id="pecas" className="pad" style={{ paddingBottom: 'clamp(56px,8vw,96px)' }}>
        <div className="section-head">
          <h2>As peças</h2>
          <span className="count">
            {list.length} {list.length === 1 ? 'peça' : 'peças'}{cat === 'Todas' ? '' : ' em ' + cat}
          </span>
        </div>

        <div className="filters">
          {cats.map((c) => (
            <button key={c} aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        {loading && <p className="status">Carregando peças…</p>}
        {!loading && loadError && <p className="status">Não foi possível carregar as peças agora. Tente recarregar a página.</p>}
        {!loading && !loadError && list.length === 0 && <p className="status">Nenhuma peça encontrada.</p>}

        <div className="grid">
          {list.map((p) => (
            <PieceCard key={p.id} piece={p} selected={selected.has(p.id)} onToggle={toggleSelect} />
          ))}
        </div>
      </section>

      <section id="visita" className="visit">
        <div className="pad cols">
          <div>
            <h2>Como funciona</h2>
            <ol>
              <li>Escolha as peças na grade (pode marcar mais de uma).</li>
              <li>Clique em "Finalizar" para abrir o WhatsApp com a lista.</li>
              <li>Pagamento:pix, débito ou dinheiro.</li>
            </ol>
          </div>
          <div>
            <a className="wa" href={waLink('Oi Rebeca! Vi a página do bazar e queria tirar uma dúvida.')} target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="site pad">
        <span>Bazar da Rebeca · Fortaleza, CE</span>
        <span>Peças em perfeito estado</span>
      </footer>

      {selectedPieces.length > 0 && (
        <button
          className="fab-finalizar"
          onClick={() => window.open(reservaMultiplaLink(selectedPieces), '_blank', 'noopener,noreferrer')}
        >
          Finalizar ({selectedPieces.length})
        </button>
      )}
    </div>
  );
}
