import { useState, useEffect } from 'react';
import { Pill, Btn, BookCover } from '../../shared/ui/atoms';
import { IconArrow, IconArrowUp, IconMore, IconSearch } from '../../shared/ui/icons';
import { PRODUCTS as STATIC_PRODUCTS, PRODUCT_STATUS_TONE } from './data';
import type { Product, ProductStatus } from './types';
import type { BookMetadata } from '../library/data';
import { useAuth } from '../auth';
import styles from './ProductsView.module.css';

import { api } from '../../lib/api';
import type { ProductRecord } from '@bookending/shared';

function recordToProduct(r: ProductRecord): Product {
  const status = r.status.toLowerCase().replace('_', '-') as ProductStatus;
  let stock = 'POD';
  if (r.digital)                  stock = 'Digital';
  else if (r.stockCount === null)  stock = 'POD';
  else if (r.stockCount === 0)     stock = 'Sold out';
  else                             stock = `${r.stockCount} in stock`;

  return {
    id:           r.id,
    title:        r.title,
    type:         r.type,
    price:        r.price,
    stock,
    sold:         0,
    status,
    featured:     r.featured,
    manuscriptId: r.manuscriptId,
  };
}

interface ProductsViewProps {
  savedBooks: Record<string, BookMetadata>;
  onTabChange?: (tab: string) => void;
}

export function ProductsView({ savedBooks, onTabChange }: ProductsViewProps) {
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (!session?.token) return;
    void (async () => {
      try {
        const records = await api.get<ProductRecord[]>('/api/products');
        if (records.length > 0) {
          setProducts(records.map(recordToProduct));
          return;
        }
        // DB empty — seed from static data
        const seeded: Product[] = [];
        for (const p of STATIC_PRODUCTS) {
          const digital    = p.stock === 'Digital';
          const stockCount = p.stock.includes('in stock')
            ? parseInt(p.stock)
            : p.stock === 'Sold out' ? 0 : null;
          try {
            const created = await api.post<ProductRecord>('/api/products', {
              title:        p.title,
              type:         p.type,
              price:        p.price,
              status:       p.status.toUpperCase().replace('-', '_'),
              featured:     p.featured ?? false,
              digital,
              stockCount,
              manuscriptId: null,
            });
            seeded.push(recordToProduct(created));
          } catch { /* skip */ }
        }
        if (seeded.length > 0) setProducts(seeded);
      } catch { /* API down — static data remains */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  const listedManuscriptIds = new Set(products.filter(p => p.manuscriptId).map(p => p.manuscriptId!));
  const listedBooks = Object.values(savedBooks).filter(b => listedManuscriptIds.has(b.id));

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <IconSearch size={13} className={styles.searchIcon} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className={styles.searchInput}
          />
        </div>
        <div className={styles.toolbarRight}>
          <span className={styles.productCount}>{filtered.length} PRODUCTS</span>
          <Btn tone="primary" icon={<IconArrow size={13} />}>New product</Btn>
        </div>
      </div>

      <div className={styles.tableHead}>
        {['Product', 'Type', 'Price', 'Stock', 'Sold', 'Status', ''].map(h => (
          <div key={h} className={styles.tableHeadCell}>{h}</div>
        ))}
      </div>

      {filtered.map((p) => (
        <div key={p.id} className={styles.productRow}>
          <div className={styles.productCell}>
            <div className={styles.productThumb}>
              <div className={`serif ${styles.thumbLabel}`}>
                {p.title.split(' ').slice(0, 2).join('\n')}
              </div>
            </div>
            <div>
              <div className={styles.productName}>{p.title}</div>
              <div className={styles.productMeta}>
                {p.featured && (
                  <div className={styles.productFeatured}>FEATURED</div>
                )}
                {p.manuscriptId && (
                  <div className={styles.productCoverStatus}>
                    {savedBooks[p.manuscriptId]?.coverUploaded ? '↗ COVER IN PRESS KIT' : '⚠ NO COVER UPLOADED'}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={`serif ${styles.productType}`}>{p.type}</div>
          <div className={`serif ${styles.productPrice}`}>${p.price}</div>
          <div className={styles.productStock}>{p.stock}</div>
          <div className={`serif ${styles.productSold}`}>{p.sold}</div>
          <Pill tone={PRODUCT_STATUS_TONE[p.status]}>{p.status.replace('-', ' ')}</Pill>
          <button className={styles.productMore}>
            <IconMore size={15} />
          </button>
        </div>
      ))}

      {filtered.length === 0 && search && (
        <div className={styles.emptyState}>
          <div className={`serif ${styles.emptyText}`}>No products match "{search}"</div>
        </div>
      )}

      {listedBooks.length > 0 && (
        <div className={styles.coversSection}>
          <div className={styles.coversHeader}>
            <div className="label">Cover images</div>
            <span className={styles.coversHeaderSub}>LISTED PRODUCTS ONLY · UPLOAD COVERS IN MANUSCRIPTS</span>
          </div>
          <div className={styles.coversGrid}>
            {listedBooks.map((book) => (
              <div key={book.id} className={styles.coverItem}>
                <div className={styles.coverThumb}>
                  <BookCover title={book.title} scheme={0} />
                </div>
                <div className={styles.coverInfo}>
                  <div className={styles.coverInfoHeader}>
                    <div className={styles.coverInfoTitle}>{book.title}</div>
                    <Pill tone={book.coverUploaded ? 'good' : 'paper'}>
                      {book.coverUploaded ? 'uploaded' : 'missing'}
                    </Pill>
                  </div>
                  <div className={styles.coverStatus}>
                    {book.status.toUpperCase()} · PNG OR JPG · 2400×3600 MIN
                  </div>
                  {book.coverUploaded
                    ? <div className={styles.coverActions}>
                        <Btn tone="ghost" icon={<IconArrowUp size={11} />}>Download ↗</Btn>
                      </div>
                    : <div className={styles.coverManageHint}>
                        Upload your cover in{' '}
                        <button
                          className={styles.coverManageLink}
                          onClick={() => onTabChange?.('Manuscripts')}
                        >
                          Manuscripts →
                        </button>
                      </div>
                  }
                  <div
                    className={styles.coverLinked}
                    data-spaced={book.coverUploaded ? 'true' : undefined}
                  >
                    <div className={styles.coverDot} />
                    <span className={styles.coverLinkedText}>
                      LINKED TO AUDIENCE → PRESS KIT
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
