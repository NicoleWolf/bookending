import { useState, useEffect } from 'react';
import { Pill, Btn, BookCover } from '../../shared/ui/atoms';
import { IconArrow, IconArrowUp, IconMore, IconSearch } from '../../shared/ui/icons';
import { PRODUCT_STATUS_TONE } from './data';
import type { Product, ProductStatus } from './types';
import type { BookMetadata } from '../library/data';
import { useAuth } from '../auth';
import { RoyaltyCalculator } from './RoyaltyCalculator';
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
  onBookSave?: (id: string, book: BookMetadata) => void;
}

export function ProductsView({ savedBooks, onTabChange, onBookSave }: ProductsViewProps) {
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (!session?.token) return;
    void (async () => {
      try {
        const records = await api.get<ProductRecord[]>('/api/products');
        setProducts(records.map(recordToProduct));
      } catch { /* leave empty */ }
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
          <IconSearch size={13} className={styles.searchIcon} aria-hidden="true" />
          <input
            id="products-search"
            aria-label="Search products"
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
          <button className={styles.productMore} aria-label={`More options for ${p.title}`}>
            <IconMore size={15} />
          </button>
        </div>
      ))}

      {filtered.length === 0 && search && (
        <div className={styles.emptyState}>
          <div className={`serif ${styles.emptyText}`}>No products match "{search}"</div>
        </div>
      )}

      {onBookSave && Object.values(savedBooks).length > 0 && (
        <div className={styles.pricingSection}>
          <div className={styles.pricingHeader}>
            <div className="label">Manuscript pricing</div>
            <span className={styles.pricingHeaderSub}>SET PRICES PER FORMAT · SAVED AUTOMATICALLY</span>
          </div>
          <div className={styles.pricingGrid}>
            {Object.values(savedBooks).map((book) => (
              <div key={book.id} className={styles.pricingItem}>
                <div className={styles.pricingBookTitle}>{book.title}</div>
                <div className={styles.pricingFields}>
                  <div className={styles.pricingField}>
                    <label htmlFor={`price-ebook-${book.id}`} className={styles.pricingFieldLabel}>Ebook</label>
                    <div className={styles.priceRow}>
                      <span aria-hidden="true" className={styles.pricePrefix}>$</span>
                      <input
                        id={`price-ebook-${book.id}`}
                        className={styles.priceInput}
                        type="text"
                        inputMode="decimal"
                        value={book.priceEbook ?? ''}
                        onChange={e => onBookSave(book.id, { ...book, priceEbook: e.target.value })}
                        placeholder="9.99"
                        aria-label={`Ebook price for ${book.title} in USD`}
                      />
                    </div>
                  </div>
                  <div className={styles.pricingField}>
                    <label htmlFor={`price-pb-${book.id}`} className={styles.pricingFieldLabel}>Paperback</label>
                    <div className={styles.priceRow}>
                      <span aria-hidden="true" className={styles.pricePrefix}>$</span>
                      <input
                        id={`price-pb-${book.id}`}
                        className={styles.priceInput}
                        type="text"
                        inputMode="decimal"
                        value={book.pricePaperback ?? ''}
                        onChange={e => onBookSave(book.id, { ...book, pricePaperback: e.target.value })}
                        placeholder="17.99"
                        aria-label={`Paperback price for ${book.title} in USD`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <RoyaltyCalculator />

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
                  <BookCover title={book.title} />
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
