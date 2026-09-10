export function formatPrice(value) {
  const n = typeof value === 'number' ? value : Number(value);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
