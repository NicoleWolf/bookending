import { useState, useEffect } from 'react';
import { SectionHead, Btn } from '../../shared/ui/atoms';
import { IconArrow, IconArrowUp } from '../../shared/ui/icons';
import { OverviewView } from './OverviewView';
import { StorefrontView } from './StorefrontView';
import { ProductsView } from './ProductsView';
import { OrdersView } from './OrdersView';
import { SettingsView } from './SettingsView';
import { AttributionView } from './AttributionView';
import type { BookMetadata } from '../library/data';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import type { OrderRecord, ProductRecord } from '@bookending/shared';
import styles from './Storefront.module.css';

type SubView = 'overview' | 'products' | 'orders' | 'settings' | 'storefront' | 'attribution';

interface StorefrontTabProps {
  savedBooks:     Record<string, BookMetadata>;
  onTabChange:    (tab: string) => void;
  onBookSave?:    (id: string, book: BookMetadata) => void;
  onViewListing?: (bookId: string) => void;
}

export default function StorefrontTab({ savedBooks, onTabChange, onBookSave, onViewListing }: StorefrontTabProps) {
  const { session } = useAuth();
  const [view,       setView]       = useState<SubView>('overview');
  const [newOrders,  setNewOrders]  = useState(0);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (!session?.token) return;
    void api.get<OrderRecord[]>('/api/orders')
      .then(orders => setNewOrders(orders.filter(o => o.status === 'new').length))
      .catch(() => {});
    void api.get<ProductRecord[]>('/api/products')
      .then(products => setProductCount(products.length))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <SectionHead
          eyebrow="§ 03 · My Store · billiewolf.bookending.press"
          title="My Store"
          kicker="Direct sales keep 95¢ of every dollar. Your shop has been open 14 months."
        >
          <Btn tone="ghost" icon={<IconArrowUp size={13} />} onClick={() => setView('storefront')}>Storefront ↗</Btn>
          <Btn tone="primary" icon={<IconArrow size={14} />}>New product</Btn>
        </SectionHead>

        <nav className={styles.tabs}>
          <button
            className={styles.tab}
            data-active={view === 'overview' ? 'true' : undefined}
            onClick={() => setView('overview')}
          >
            Overview
          </button>
          <button
            className={styles.tab}
            data-active={view === 'products' ? 'true' : undefined}
            onClick={() => setView('products')}
          >
            Products
            {productCount > 0 && <span className={styles.tabCount}>({productCount})</span>}
          </button>
          <button
            className={styles.tab}
            data-active={view === 'orders' ? 'true' : undefined}
            onClick={() => setView('orders')}
          >
            Orders
            {newOrders > 0 && (
              <span className={styles.tabBadge}>{newOrders}</span>
            )}
          </button>
          <button
            className={styles.tab}
            data-active={view === 'settings' ? 'true' : undefined}
            onClick={() => setView('settings')}
          >
            Settings
          </button>
          <button
            className={styles.tab}
            data-active={view === 'storefront' ? 'true' : undefined}
            onClick={() => setView('storefront')}
          >
            Storefront
          </button>
          <button
            className={styles.tab}
            data-active={view === 'attribution' ? 'true' : undefined}
            onClick={() => setView('attribution')}
          >
            Attribution
          </button>
        </nav>
      </div>

      {view === 'overview'  && <OverviewView onViewChange={v => setView(v as SubView)} />}
      {view === 'storefront' && <StorefrontView onViewListing={onViewListing} />}
      {view === 'products'  && <ProductsView savedBooks={savedBooks} onTabChange={onTabChange} onBookSave={onBookSave} />}
      {view === 'orders'    && <OrdersView />}
      {view === 'settings'     && <SettingsView />}
      {view === 'attribution'  && <AttributionView />}
    </section>
  );
}
