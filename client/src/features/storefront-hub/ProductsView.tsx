import { useState, useMemo } from 'react';
import { HUB_PRODUCTS, ALL_PRODUCT_FORMATS } from './data';
import type { ProductFormat } from './data';
import styles from './StorefrontHub.module.css';

export function ProductsView() {
  const [query,  setQuery]  = useState('');
  const [format, setFormat] = useState<ProductFormat | null>(null);

  const products = useMemo(() => {
    return HUB_PRODUCTS.filter(p => {
      if (format && p.format !== format) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.genres.some(g => g.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [query, format]);

  return (
    <div>
      <div className={styles.filterBar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search titles, authors, genres…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className={styles.genrePills}>
          <button
            className={styles.genrePill}
            data-active={format === null ? '' : undefined}
            onClick={() => setFormat(null)}
          >
            All formats
          </button>
          {ALL_PRODUCT_FORMATS.map(f => (
            <button
              key={f}
              className={styles.genrePill}
              data-active={format === f ? '' : undefined}
              onClick={() => setFormat(prev => prev === f ? null : f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.directorySection}>
        <div className={styles.sectionLabel}>
          {query || format
            ? `${products.length} result${products.length !== 1 ? 's' : ''}`
            : `All products · ${HUB_PRODUCTS.length}`}
        </div>
        {products.length === 0 ? (
          <div className={styles.empty}>No products match the current filters.</div>
        ) : (
          <div className={styles.productGrid}>
            {products.map(p => (
              <div key={p.id} className={styles.productCard}>
                <div className={styles.productCover}>
                  <div className={styles.productCoverTop}>
                    <span className={styles.genreTag}>{p.genres[0]}</span>
                    {p.status !== 'available' && (
                      <span
                        className={styles.productStatusTag}
                        data-preorder={p.status === 'pre-order' ? '' : undefined}
                      >
                        {p.status === 'pre-order' ? 'Pre-order' : 'Low stock'}
                      </span>
                    )}
                  </div>
                  <div className={styles.productCoverBottom}>
                    <div className={styles.productCoverAuthor}>
                      {p.authorName.split(' ').map(n => n[0]).join('. ')}.
                    </div>
                    <div className={`serif ${styles.productCoverTitle}`}>{p.title}</div>
                  </div>
                </div>
                <div className={styles.productCardBody}>
                  <div className={`serif ${styles.productCardTitle}`}>{p.title}</div>
                  <div className={styles.productCardAuthor}>{p.authorName}</div>
                  <div className={styles.productCardType}>{p.type}</div>
                  <div className={styles.productCardFooter}>
                    <span className={`serif ${styles.productCardPrice}`}>${p.price}</span>
                    <button
                      className={styles.productCardCta}
                      data-preorder={p.status === 'pre-order' ? '' : undefined}
                    >
                      {p.status === 'pre-order' ? 'Pre-order' : 'Buy →'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
