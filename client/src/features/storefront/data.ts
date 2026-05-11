import type { Product, Order, ProductStatus, OrderStatus } from './types';

export const PRODUCTS: Product[] = [
  { id: 'static-p1', title: 'The Salt Roads',   type: 'Signed hardcover',       price: 28, stock: '47 in stock',  sold: 89,  status: 'live',      featured: true },
  { id: 'static-p2', title: 'The Salt Roads',   type: 'Paperback',              price: 18, stock: 'POD',          sold: 224, status: 'live' },
  { id: 'static-p3', title: 'The Salt Roads',   type: 'eBook — PDF',            price: 8,  stock: 'Digital',      sold: 156, status: 'live' },
  { id: 'static-p4', title: 'Hollow Meridian',  type: 'Paperback · pre-order',  price: 16, stock: 'Pre-order',    sold: 23,  status: 'pre-order' },
  { id: 'static-p5', title: 'Bundle: Both',     type: 'Paperback bundle',       price: 38, stock: 'Made to order', sold: 18, status: 'live' },
  { id: 'static-p6', title: 'Lighthouses',      type: 'Zine — ed. of 200',      price: 9,  stock: '12 left',      sold: 188, status: 'low-stock' },
];

export const ORDERS: Order[] = [
  {
    id: 1,  num: '#4421', customer: 'L. Marchetti',   location: 'Milan, IT',
    items: 'Signed hardcover',         total: 28, status: 'new',       date: '14m ago',
    address: { line1: 'Via Brera 12', city: 'Milan', country: 'Italy', postal: '20121' },
    notes: 'Please sign to my daughter Sofia — she has been waiting for this one',
    signedRequested: true,  letterRequested: true,  digital: false,
  },
  {
    id: 2,  num: '#4420', customer: 'D. Okonkwo',     location: 'Lagos, NG',
    items: 'Paperback bundle',         total: 38, status: 'new',       date: '42m ago',
    address: { line1: '14 Admiralty Way', city: 'Lagos', country: 'Nigeria' },
    signedRequested: true,  letterRequested: false, digital: false,
  },
  {
    id: 3,  num: '#4419', customer: 'A. Pham',        location: 'Brooklyn, US',
    items: 'Paperback',                total: 18, status: 'processing', date: '1h ago',
    address: { line1: '227 Bedford Ave', city: 'Brooklyn, NY', country: 'United States', postal: '11211' },
    signedRequested: false, letterRequested: false, digital: false,
  },
  {
    id: 4,  num: '#4418', customer: 'R. Søndergaard', location: 'Aarhus, DK',
    items: 'Lighthouses zine',         total: 9,  status: 'processing', date: '2h ago',
    address: { line1: 'Bispetorvet 3', city: 'Aarhus', country: 'Denmark', postal: '8000' },
    signedRequested: false, letterRequested: false, digital: false,
  },
  {
    id: 5,  num: '#4417', customer: 'C. Nwosu',       location: 'London, UK',
    items: 'Signed hardcover + eBook', total: 34, status: 'shipped',   date: '4h ago',
    address: { line1: '47 Bermondsey St', city: 'London', country: 'United Kingdom', postal: 'SE1 3XT' },
    notes: 'Long-time reader — thank you for writing',
    signedRequested: true,  letterRequested: false, digital: false,
  },
  {
    id: 6,  num: '#4416', customer: 'T. Bergström',   location: 'Stockholm, SE',
    items: 'eBook — PDF',              total: 8,  status: 'delivered', date: '1d ago',
    address: { line1: 'Birger Jarlsgatan 18', city: 'Stockholm', country: 'Sweden', postal: '114 34' },
    signedRequested: false, letterRequested: false, digital: true,
  },
  {
    id: 7,  num: '#4415', customer: 'M. Velasquez',   location: 'Mexico City, MX',
    items: 'Paperback',                total: 18, status: 'delivered', date: '1d ago',
    address: { line1: 'Calle Durango 240, Col. Roma', city: 'Mexico City', country: 'Mexico', postal: '06700' },
    signedRequested: false, letterRequested: false, digital: false,
  },
  {
    id: 8,  num: '#4414', customer: 'F. Dubois',      location: 'Lyon, FR',
    items: 'Paperback bundle',         total: 38, status: 'shipped',   date: '2d ago',
    address: { line1: '9 Rue de la République', city: 'Lyon', country: 'France', postal: '69001' },
    notes: 'Please include a note — this is a birthday gift',
    signedRequested: true,  letterRequested: true,  digital: false,
  },
  {
    id: 9,  num: '#4413', customer: 'H. Yamamoto',    location: 'Osaka, JP',
    items: 'Signed hardcover',         total: 28, status: 'delivered', date: '2d ago',
    address: { line1: '3-2-1 Namba, Chuo-ku', city: 'Osaka', country: 'Japan', postal: '542-0076' },
    notes: 'Please do not include receipt — this is a gift',
    signedRequested: true,  letterRequested: false, digital: false,
  },
  {
    id: 10, num: '#4412', customer: 'B. Osei',        location: 'Accra, GH',
    items: 'eBook — PDF',              total: 8,  status: 'refunded',  date: '3d ago',
    address: { line1: '12 Oxford St, Osu', city: 'Accra', country: 'Ghana' },
    signedRequested: false, letterRequested: false, digital: true,
  },
];

export const STATS = [
  { l: 'Revenue · 30d',   v: '$3,284', sub: '+34% from last month',   spark: [8,12,9,15,18,11,14,22,17,28,24,32,38,30] },
  { l: 'Orders · 30d',    v: '124',    sub: '11 in last 24 hours',    spark: [3,4,3,5,6,4,5,7,6,9,8,10,12,10] },
  { l: 'Avg order',       v: '$26.48', sub: 'Up from $22.10',         spark: [20,22,21,23,24,22,25,24,26,25,27,26,27,28] },
  { l: 'Per dollar kept', v: '95¢',    sub: 'After payment fees',     spark: [94,95,95,94,95,95,95,95,95,95,95,95,95,95] },
];

export const PRODUCT_STATUS_TONE: Record<ProductStatus, 'good' | 'neutral' | 'accent' | 'danger' | 'paper'> = {
  live: 'good', draft: 'paper', 'low-stock': 'accent', 'sold-out': 'danger', 'pre-order': 'neutral',
};

export const ORDER_STATUS_TONE: Record<OrderStatus, 'good' | 'neutral' | 'accent' | 'danger' | 'paper'> = {
  new: 'accent', processing: 'neutral', shipped: 'neutral', delivered: 'good', refunded: 'danger',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', refunded: 'Refunded',
};

export const REVENUE_SERIES = {
  current: [0, 84, 204, 300, 452, 636, 746, 886, 1106, 1278, 1562, 1806, 2126, 2510, 2814],
  prev:    [0, 60, 130, 190, 280, 390, 470, 580, 700,  840,  990,  1150, 1360, 1560, 1860],
};

export const GEOGRAPHY = [
  { country: 'United States',  pct: 38, orders: 47 },
  { country: 'United Kingdom', pct: 18, orders: 22 },
  { country: 'Germany',        pct: 12, orders: 15 },
  { country: 'France',         pct: 9,  orders: 11 },
  { country: 'Australia',      pct: 7,  orders: 9  },
  { country: 'Other',          pct: 16, orders: 20 },
];

export const FUNNEL = {
  visitors: 1847, productViews: 412, cartAdds: 89, checkouts: 31,
};

export const REPEAT_RATE = { rate: 23, repeatOrders: 28 };

export const STOREFRONT_CONFIG = {
  hero: { name: 'Billie Wolf', tagline: 'Literary fiction from Portland, Oregon.' },
  featuredIds: [1, 2, 3, 6] as number[],
};
