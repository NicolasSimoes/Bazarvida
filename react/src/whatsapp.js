import { WHATSAPP_NUMBER } from './config.js';
import { formatPrice } from './format.js';

export function waLink(text) {
  return 'https://wa.me/' + WHATSAPP_NUMBER.replace(/\D/g, '') + '?text=' + encodeURIComponent(text);
}

export function reservaMultiplaLink(pieces) {
  const linhas = pieces.map(
    (p) => '• ' + p.id + ' — ' + p.brand + ' ' + p.name + ' (' + formatPrice(p.price) + ')'
  );
  const total = pieces.reduce((sum, p) => sum + Number(p.price), 0);
  return waLink(
    'Oi Rebeca! Quero reservar essas peças:\n\n' +
    linhas.join('\n') +
    '\n\nTotal: ' + formatPrice(total) +
    '\n\nAinda estão disponíveis?'
  );
}
