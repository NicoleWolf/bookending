export type ProductStatus = 'live' | 'draft' | 'low-stock' | 'sold-out' | 'pre-order';
export type OrderStatus   = 'new' | 'processing' | 'shipped' | 'delivered' | 'refunded';

export interface Product {
  id: string; title: string; type: string; price: number;
  stock: string; sold: number; status: ProductStatus; featured?: boolean;
  manuscriptId?: string | null; coverUrl?: string;
}

export interface OrderAddress {
  line1: string;
  city: string;
  country: string;
  postal?: string;
}

export interface Order {
  id: string;
  num: string;
  customer: string;
  location: string;
  items: string;
  total: number;
  status: OrderStatus;
  date: string;
  address: OrderAddress;
  notes?: string;
  signedRequested: boolean;
  letterRequested: boolean;
  digital: boolean;
}
