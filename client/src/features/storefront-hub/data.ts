export interface AuthorStore {
  id: string;
  name: string;
  initials: string;
  tone: 'accent' | 'gold' | 'muted';
  location: string;
  tagline: string;
  genres: string[];
  featured: boolean;
  url: string;
  books: number;
  totalSold: number;
}

export const AUTHOR_STORES: AuthorStore[] = [
  {
    id: 'billie',
    name: 'Billie Wolf',
    initials: 'BW',
    tone: 'accent',
    location: 'Portland, OR',
    tagline: 'Literary fiction, slow and deliberate.',
    genres: ['Literary Fiction'],
    featured: true,
    url: 'billiewolf.bookending.press',
    books: 6,
    totalSold: 469,
  },
  {
    id: 'dante',
    name: 'Dante Osei',
    initials: 'DO',
    tone: 'gold',
    location: 'Accra, GH',
    tagline: 'Crime fiction and memoir from West Africa.',
    genres: ['Crime Fiction', 'Memoir'],
    featured: true,
    url: 'danteosei.bookending.press',
    books: 4,
    totalSold: 312,
  },
  {
    id: 'mira',
    name: 'Mira Hachemi',
    initials: 'MH',
    tone: 'muted',
    location: 'Montréal, QC',
    tagline: 'Speculative futures written in French and English.',
    genres: ['Speculative Fiction'],
    featured: false,
    url: 'mirahachemi.bookending.press',
    books: 3,
    totalSold: 198,
  },
  {
    id: 'thomas',
    name: 'Thomas Bergström',
    initials: 'TB',
    tone: 'accent',
    location: 'Stockholm, SE',
    tagline: 'Nordic historical fiction set at the edge of Europe.',
    genres: ['Historical Fiction'],
    featured: false,
    url: 'thomasbergstrom.bookending.press',
    books: 5,
    totalSold: 287,
  },
  {
    id: 'celia',
    name: 'Celia Nakamura',
    initials: 'CN',
    tone: 'gold',
    location: 'Tokyo, JP',
    tagline: 'Japanese-English literary fiction and translation.',
    genres: ['Literary Fiction', 'Translation'],
    featured: false,
    url: 'celianakamura.bookending.press',
    books: 2,
    totalSold: 143,
  },
  {
    id: 'rosa',
    name: 'Rosa Ferreira',
    initials: 'RF',
    tone: 'muted',
    location: 'Lisbon, PT',
    tagline: 'Diaspora fiction from the Portuguese Atlantic.',
    genres: ['Diaspora Fiction', 'Literary Fiction'],
    featured: false,
    url: 'rosaferreira.bookending.press',
    books: 3,
    totalSold: 221,
  },
  {
    id: 'james',
    name: 'James Holloway',
    initials: 'JH',
    tone: 'accent',
    location: 'Edinburgh, UK',
    tagline: 'Crime fiction set in Scotland and the Nordic countries.',
    genres: ['Crime Fiction'],
    featured: false,
    url: 'jamesholloway.bookending.press',
    books: 6,
    totalSold: 434,
  },
  {
    id: 'amara',
    name: 'Amara Diallo',
    initials: 'AD',
    tone: 'gold',
    location: 'Dakar, SN',
    tagline: 'Debut literary fiction from Senegal.',
    genres: ['Literary Fiction'],
    featured: false,
    url: 'amaradiallo.bookending.press',
    books: 1,
    totalSold: 87,
  },
];

export const ALL_STORE_GENRES = [...new Set(AUTHOR_STORES.flatMap(s => s.genres))].sort();

// ── Product catalogue ──────────────────────────────────────

export type ProductFormat = 'Hardcover' | 'Paperback' | 'eBook' | 'Zine';

export interface HubProduct {
  id: number;
  title: string;
  authorId: string;
  authorName: string;
  type: string;
  format: ProductFormat;
  price: number;
  genres: string[];
  status: 'available' | 'low-stock' | 'pre-order';
}

export const HUB_PRODUCTS: HubProduct[] = [
  // Billie Wolf
  { id:  1, title: 'The Salt Roads',        authorId: 'billie',  authorName: 'Billie Wolf',      type: 'Signed hardcover',  format: 'Hardcover', price: 28, genres: ['Literary Fiction'],                     status: 'available'  },
  { id:  2, title: 'The Salt Roads',        authorId: 'billie',  authorName: 'Billie Wolf',      type: 'Paperback',         format: 'Paperback', price: 18, genres: ['Literary Fiction'],                     status: 'available'  },
  { id:  3, title: 'The Salt Roads',        authorId: 'billie',  authorName: 'Billie Wolf',      type: 'eBook — PDF',       format: 'eBook',     price:  8, genres: ['Literary Fiction'],                     status: 'available'  },
  { id:  4, title: 'A Quiet September',     authorId: 'billie',  authorName: 'Billie Wolf',      type: 'Paperback',         format: 'Paperback', price: 16, genres: ['Literary Fiction'],                     status: 'available'  },
  { id:  5, title: 'Letters from Portland', authorId: 'billie',  authorName: 'Billie Wolf',      type: 'Zine — ed. of 150', format: 'Zine',      price:  9, genres: ['Literary Fiction'],                     status: 'low-stock'  },
  // Dante Osei
  { id:  6, title: 'The Accra Notebooks',   authorId: 'dante',   authorName: 'Dante Osei',       type: 'Signed hardcover',  format: 'Hardcover', price: 26, genres: ['Crime Fiction', 'Memoir'],              status: 'available'  },
  { id:  7, title: 'The Accra Notebooks',   authorId: 'dante',   authorName: 'Dante Osei',       type: 'Paperback',         format: 'Paperback', price: 15, genres: ['Crime Fiction', 'Memoir'],              status: 'available'  },
  { id:  8, title: 'Night Market',          authorId: 'dante',   authorName: 'Dante Osei',       type: 'Paperback',         format: 'Paperback', price: 16, genres: ['Crime Fiction'],                        status: 'pre-order'  },
  // Mira Hachemi
  { id:  9, title: 'What the Mirrors Know', authorId: 'mira',    authorName: 'Mira Hachemi',     type: 'Signed hardcover',  format: 'Hardcover', price: 24, genres: ['Speculative Fiction'],                  status: 'available'  },
  { id: 10, title: 'What the Mirrors Know', authorId: 'mira',    authorName: 'Mira Hachemi',     type: 'eBook — PDF',       format: 'eBook',     price: 10, genres: ['Speculative Fiction'],                  status: 'available'  },
  { id: 11, title: 'Threshold',             authorId: 'mira',    authorName: 'Mira Hachemi',     type: 'Paperback',         format: 'Paperback', price: 14, genres: ['Speculative Fiction'],                  status: 'low-stock'  },
  // Thomas Bergström
  { id: 12, title: 'The Iron Cartographer', authorId: 'thomas',  authorName: 'Thomas Bergström', type: 'Hardcover',         format: 'Hardcover', price: 30, genres: ['Historical Fiction'],                   status: 'available'  },
  { id: 13, title: 'The Iron Cartographer', authorId: 'thomas',  authorName: 'Thomas Bergström', type: 'Paperback',         format: 'Paperback', price: 20, genres: ['Historical Fiction'],                   status: 'available'  },
  { id: 14, title: 'Winter Survey',         authorId: 'thomas',  authorName: 'Thomas Bergström', type: 'Paperback',         format: 'Paperback', price: 17, genres: ['Historical Fiction'],                   status: 'pre-order'  },
  // Celia Nakamura
  { id: 15, title: 'Hiraeth',               authorId: 'celia',   authorName: 'Celia Nakamura',   type: 'Hardcover',         format: 'Hardcover', price: 22, genres: ['Literary Fiction', 'Translation'],      status: 'available'  },
  { id: 16, title: 'Hiraeth',               authorId: 'celia',   authorName: 'Celia Nakamura',   type: 'eBook — EPUB',      format: 'eBook',     price:  9, genres: ['Literary Fiction', 'Translation'],      status: 'available'  },
  // Rosa Ferreira
  { id: 17, title: 'Atlantic Drift',        authorId: 'rosa',    authorName: 'Rosa Ferreira',    type: 'Signed hardcover',  format: 'Hardcover', price: 24, genres: ['Diaspora Fiction', 'Literary Fiction'], status: 'available'  },
  { id: 18, title: 'Atlantic Drift',        authorId: 'rosa',    authorName: 'Rosa Ferreira',    type: 'Paperback',         format: 'Paperback', price: 15, genres: ['Diaspora Fiction'],                     status: 'available'  },
  // James Holloway
  { id: 19, title: 'Cairngorm',             authorId: 'james',   authorName: 'James Holloway',   type: 'Hardcover',         format: 'Hardcover', price: 26, genres: ['Crime Fiction'],                        status: 'available'  },
  { id: 20, title: 'Dead Water',            authorId: 'james',   authorName: 'James Holloway',   type: 'Paperback',         format: 'Paperback', price: 14, genres: ['Crime Fiction'],                        status: 'available'  },
  { id: 21, title: 'Dead Water',            authorId: 'james',   authorName: 'James Holloway',   type: 'eBook — EPUB',      format: 'eBook',     price:  7, genres: ['Crime Fiction'],                        status: 'available'  },
  // Amara Diallo
  { id: 22, title: 'Sahel Waking',          authorId: 'amara',   authorName: 'Amara Diallo',     type: 'Signed hardcover',  format: 'Hardcover', price: 22, genres: ['Literary Fiction'],                     status: 'low-stock'  },
];

export const ALL_PRODUCT_FORMATS: ProductFormat[] = ['Hardcover', 'Paperback', 'eBook', 'Zine'];
