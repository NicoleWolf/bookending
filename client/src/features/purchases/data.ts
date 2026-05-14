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
