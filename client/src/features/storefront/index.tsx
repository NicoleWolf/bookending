import { useState } from 'react';
import { SectionHead, Btn } from '../../shared/ui/atoms';
import { IconArrow, IconArrowUp } from '../../shared/ui/icons';
import { OverviewView } from './OverviewView';
import { StorefrontView } from './StorefrontView';
import { ProductsView } from './ProductsView';
import { OrdersView } from './OrdersView';
import { SettingsView } from './SettingsView';
import { PRODUCTS, ORDERS } from './data';
import type { BookMetadata } from '../library/data';
import styles from './Storefront.module.css';

type SubView = 'overview' | 'products' | 'orders' | 'settings' | 'storefront';

interface StorefrontTabProps {
  savedBooks: Record<string, BookMetadata>;
  onTabChange: (tab: string) => void;
}

export default function StorefrontTab({ savedBooks, onTabChange }: StorefrontTabProps) {
  const [view, setView] = useState<SubView>('overview');

  const newOrders = ORDERS.filter(o => o.status === 'new').length;

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
            <span className={styles.tabCount}>({PRODUCTS.length})</span>
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
        </nav>
      </div>

      {view === 'overview'  && <OverviewView onViewChange={v => setView(v as SubView)} />}
      {view === 'storefront' && <StorefrontView />}
      {view === 'products'  && <ProductsView savedBooks={savedBooks} onTabChange={onTabChange} />}
      {view === 'orders'    && <OrdersView />}
      {view === 'settings'  && <SettingsView />}
    </section>
  );
}
