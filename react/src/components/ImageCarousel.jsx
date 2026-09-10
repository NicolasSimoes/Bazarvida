import { useRef, useState } from 'react';

export default function ImageCarousel({ images, alt }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const tickingRef = useRef(false);

  function handleScroll() {
    if (tickingRef.current) return;
    tickingRef.current = true;
    requestAnimationFrame(() => {
      const el = trackRef.current;
      if (el && el.clientWidth > 0) setIndex(Math.round(el.scrollLeft / el.clientWidth));
      tickingRef.current = false;
    });
  }

  function goTo(e, i) {
    e.stopPropagation();
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div className="carousel">
      <div className="carousel-track" ref={trackRef} onScroll={handleScroll}>
        {images.map((img) => (
          <img key={img.id} src={img.url} alt={alt} loading="lazy" className="carousel-slide" />
        ))}
      </div>
      {index > 0 && (
        <button className="carousel-arrow carousel-arrow--prev" onClick={(e) => goTo(e, index - 1)} aria-label="Foto anterior">‹</button>
      )}
      {index < images.length - 1 && (
        <button className="carousel-arrow carousel-arrow--next" onClick={(e) => goTo(e, index + 1)} aria-label="Próxima foto">›</button>
      )}
      <span className="carousel-counter">{index + 1}/{images.length}</span>
    </div>
  );
}
