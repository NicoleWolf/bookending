import type { ProductStatus, OrderStatus } from './types';

export const PRODUCT_STATUS_TONE: Record<ProductStatus, 'good' | 'neutral' | 'accent' | 'danger' | 'paper'> = {
  live: 'good', draft: 'paper', 'low-stock': 'accent', 'sold-out': 'danger', 'pre-order': 'neutral',
};

export const ORDER_STATUS_TONE: Record<OrderStatus, 'good' | 'neutral' | 'accent' | 'danger' | 'paper'> = {
  new: 'accent', processing: 'neutral', shipped: 'neutral', delivered: 'good', refunded: 'danger',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered', refunded: 'Refunded',
};

export const REVENUE_SERIES: { current: number[]; prev: number[] } = { current: [], prev: [] };

export const GEOGRAPHY: { country: string; pct: number; orders: number }[] = [];

export const FUNNEL = { visitors: 0, productViews: 0, cartAdds: 0, checkouts: 0 };

export const REPEAT_RATE = { rate: 0, repeatOrders: 0 };

export const STOREFRONT_CONFIG = {
  hero: { name: 'Billie Wolf', tagline: 'Literary fiction from Portland, Oregon.' },
  featuredIds: ['1', '2', '3', '6'],
};
