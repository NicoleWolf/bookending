export type PurchaseStatus = 'processing' | 'shipped' | 'delivered';
export type ChecklistKey   = 'signed' | 'letter' | 'labeled' | 'packed';

export interface PurchasedItem {
  title: string;
  format: string;
  price: number;
  digital: boolean;
}

export interface PurchaseAddress {
  line1: string;
  city: string;
  country: string;
  postal?: string;
}

export interface PurchasePayment {
  brand: string;
  last4: string;
}

export interface Purchase {
  id: number;
  num: string;
  author: string;
  storeName: string;
  date: string;
  items: PurchasedItem[];
  shipping: number;
  total: number;
  status: PurchaseStatus;
  trackingNum?: string;
  address?: PurchaseAddress;
  payment: PurchasePayment;
  authorNote?: string;
  signedRequested?: boolean;
  letterRequested?: boolean;
  checklist: Record<ChecklistKey, boolean>;
}

export const PURCHASES: Purchase[] = [
  {
    id: 1,
    num: '#6203',
    author: 'Billie Wolf',
    storeName: 'Billie Wolf Books',
    date: '7 May 2026',
    items: [
      { title: 'The Salt Roads', format: 'Signed hardcover', price: 28, digital: false },
    ],
    shipping: 4,
    total: 32,
    status: 'delivered',
    trackingNum: 'USPS 9400 1118 9922 3752 5109 73',
    address: { line1: '127 N Killingsworth St', city: 'Portland, OR', country: 'United States', postal: '97217' },
    payment: { brand: 'Visa', last4: '4242' },
    authorNote: 'Thank you for your support — I hope this one finds you well. — Billie',
    signedRequested: true,
    letterRequested: true,
    checklist: { signed: true, letter: true, labeled: true, packed: true },
  },
  {
    id: 2,
    num: '#6198',
    author: 'Nneka Osei-Bonsu',
    storeName: 'Nneka Osei-Bonsu',
    date: '3 May 2026',
    items: [
      { title: 'Between Two Silences', format: 'eBook — EPUB', price: 9, digital: true },
      { title: 'What the River Carries', format: 'eBook — EPUB', price: 9, digital: true },
    ],
    shipping: 0,
    total: 18,
    status: 'delivered',
    payment: { brand: 'Mastercard', last4: '8810' },
    authorNote: 'Enjoy the stories. — N.O.B.',
    checklist: { signed: false, letter: false, labeled: false, packed: false },
  },
  {
    id: 3,
    num: '#6191',
    author: 'Cai Lindqvist',
    storeName: 'Cai Lindqvist',
    date: '28 Apr 2026',
    items: [
      { title: 'Tidemarks', format: 'Paperback', price: 16, digital: false },
    ],
    shipping: 6,
    total: 22,
    status: 'shipped',
    trackingNum: 'PostNord SE123456789SE',
    address: { line1: '127 N Killingsworth St', city: 'Portland, OR', country: 'United States', postal: '97217' },
    payment: { brand: 'Visa', last4: '4242' },
    checklist: { signed: false, letter: false, labeled: true, packed: true },
  },
  {
    id: 4,
    num: '#6184',
    author: 'Billie Wolf',
    storeName: 'Billie Wolf Books',
    date: '20 Apr 2026',
    items: [
      { title: 'Lighthouses', format: 'Zine — ed. of 200', price: 9, digital: false },
    ],
    shipping: 4,
    total: 13,
    status: 'delivered',
    trackingNum: 'USPS 9400 1118 9922 3699 4801 12',
    address: { line1: '127 N Killingsworth St', city: 'Portland, OR', country: 'United States', postal: '97217' },
    payment: { brand: 'Visa', last4: '4242' },
    checklist: { signed: false, letter: false, labeled: true, packed: true },
  },
  {
    id: 5,
    num: '#6176',
    author: 'R. Marchetti',
    storeName: 'R. Marchetti',
    date: '14 Apr 2026',
    items: [
      { title: "The Cartographer's Daughter", format: 'eBook — PDF', price: 7, digital: true },
    ],
    shipping: 0,
    total: 7,
    status: 'delivered',
    payment: { brand: 'Visa', last4: '4242' },
    checklist: { signed: false, letter: false, labeled: false, packed: false },
  },
  {
    id: 6,
    num: '#6170',
    author: 'Cai Lindqvist',
    storeName: 'Cai Lindqvist',
    date: '2 Apr 2026',
    items: [
      { title: 'Hollow Meridian', format: 'Paperback · pre-order', price: 16, digital: false },
    ],
    shipping: 6,
    total: 22,
    status: 'processing',
    address: { line1: '127 N Killingsworth St', city: 'Portland, OR', country: 'United States', postal: '97217' },
    payment: { brand: 'Mastercard', last4: '8810' },
    authorNote: 'Pre-orders mean everything for an indie author. Release day: September 2026.',
    checklist: { signed: false, letter: false, labeled: false, packed: false },
  },
];

export const PURCHASE_STATUS_LABEL: Record<PurchaseStatus, string> = {
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
};

export const PURCHASE_STATUS_TONE: Record<PurchaseStatus, 'neutral' | 'good'> = {
  processing: 'neutral',
  shipped:    'neutral',
  delivered:  'good',
};

export const CHECKLIST_LABEL: Record<ChecklistKey, string> = {
  signed:  'Copy signed',
  letter:  'Letter written',
  labeled: 'Label printed',
  packed:  'Packed and sealed',
};
