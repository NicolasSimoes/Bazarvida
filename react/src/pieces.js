// Cada peca precisa de um id unico: ele vai na mensagem do WhatsApp.
// image: coloque o arquivo em /public/pecas/ e aponte aqui (ex: '/pecas/BR-01.jpg')
//
// Este arquivo NAO é mais usado pela página pública (App.jsx busca as peças
// no Supabase). Ele serve só de dado de exemplo para scripts/seed.mjs,
// usado para popular a tabela `pieces` durante os testes.
export const PIECES = [
  { id: 'BR-01', brand: 'Le Lis',    name: 'Vestido midi de linho', cat: 'Vestidos', size: 'P',  price: 'R$ 90,00',  condition: 'Ótimo estado', image: '' },
  { id: 'BR-02', brand: 'Animale',   name: 'Blazer alfaiataria',    cat: 'Casacos',  size: 'M',  price: 'R$ 100,00', condition: 'Seminovo',     image: '' },
  { id: 'BR-03', brand: 'Dudalina',  name: 'Camisa listrada',       cat: 'Blusas',   size: 'M',  price: 'R$ 45,00',  condition: 'Ótimo estado', image: '' },
  { id: 'BR-04', brand: 'Horus',     name: 'Calça wide jeans',      cat: 'Calças',   size: '40', price: 'R$ 60,00',  condition: 'Bom estado',   image: '' },
  { id: 'BR-05', brand: 'Amarelô',   name: 'Saia plissada',         cat: 'Saias',    size: '38', price: 'R$ 35,00',  condition: 'Seminovo',     image: '' },
  { id: 'BR-06', brand: 'NV',        name: 'Cropped canelado',      cat: 'Blusas',   size: 'PP', price: 'R$ 20,00',  condition: 'Bom estado',   image: '' },
  { id: 'BR-07', brand: 'Manotropo', name: 'Vestido estampado',     cat: 'Vestidos', size: 'G',  price: 'R$ 70,00',  condition: 'Ótimo estado', image: '' },
  { id: 'BR-08', brand: 'Gregory',   name: 'Tricot gola alta',      cat: 'Casacos',  size: 'M',  price: 'R$ 55,00',  condition: 'Seminovo',     image: '' },
  { id: 'BR-09', brand: 'Areng',     name: 'Calça pantalona',       cat: 'Calças',   size: '42', price: 'R$ 50,00',  condition: 'Bom estado',   image: '' },
  { id: 'BR-10', brand: 'Le Lis',    name: 'Blusa de seda',         cat: 'Blusas',   size: 'P',  price: 'R$ 65,00',  condition: 'Ótimo estado', image: '' },
  { id: 'BR-11', brand: 'Animale',   name: 'Saia jeans reta',       cat: 'Saias',    size: '36', price: 'R$ 40,00',  condition: 'Bom estado',   image: '' },
  { id: 'BR-12', brand: 'Horus',     name: 'Vestido slip',          cat: 'Vestidos', size: 'M',  price: 'R$ 80,00',  condition: 'Seminovo',     image: '' }
];
