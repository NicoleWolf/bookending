import { HUB_PRODUCTS } from './data';
import type { AuthorStore } from './data';
import styles from './AuthorStorefrontPage.module.css';

interface Props {
  author: AuthorStore;
  onBack: () => void;
}

export function AuthorStorefrontPage({ author, onBack }: Props) {
  const products   = HUB_PRODUCTS.filter(p => p.authorId === author.id);
  const authorAbbr = author.name.split(' ').map(n => n[0]).join('. ') + '.';

  return (
    <div className={styles.root}>
      {/* ── Back bar ── */}
      <div className={styles.backBar}>
        <button className={styles.backBtn} onClick={onBack}>← All shops</button>
        <span className={styles.backUrl}>{author.url}</span>
      </div>

      {/* ── Storefront (light theme) ── */}
      <div className={styles.storefront}>

        {/* Nav */}
        <div className={styles.sfNav}>
          <span className={`serif ${styles.sfNavBrand}`}>{author.name}</span>
          <span className={styles.sfNavLinks}>SHOP · ESSAYS · LETTER</span>
        </div>
        <hr className={styles.sfRule} />

        {/* Hero */}
        <div className={styles.sfHero}>
          <div className={styles.sfHeroBody}>
            <div className={`serif ${styles.sfHeroName}`}>{author.name}</div>
            <div className={`serif ${styles.sfHeroTagline}`}>{author.tagline}</div>
            <div className={styles.sfHeroLocation}>{author.location}</div>
          </div>
        </div>
        <hr className={styles.sfRule} />

        {/* Products */}
        <div className={styles.sfProducts}>
          <div className={styles.sfProductsHeader}>
            <span className={styles.sfProductsLabel}>Shop — books & editions</span>
          </div>
          {products.length === 0 ? (
            <div className={styles.emptyProducts}>No products listed yet.</div>
          ) : (
            <div className={styles.sfProductGrid}>
              {products.map(p => (
                <div key={p.id} className={styles.sfProduct}>
                  <div className={styles.sfProductCover}>
                    <div className={styles.sfProductCoverTop}>
                      {p.status !== 'available' && (
                        <span
                          className={styles.sfProductBadge}
                          data-preorder={p.status === 'pre-order' ? '' : undefined}
                        >
                          {p.status === 'pre-order' ? 'Pre-order' : 'Low stock'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className={styles.sfProductAuthor}>{authorAbbr}</div>
                      <div className={`serif ${styles.sfProductTitle}`}>{p.title}</div>
                    </div>
                  </div>
                  <div className={styles.sfProductType}>{p.type}</div>
                  <div className={styles.sfProductFooter}>
                    <span className={`serif ${styles.sfProductPrice}`}>${p.price}</span>
                    <button className={styles.sfProductCta}>
                      {p.status === 'pre-order' ? 'Pre-order' : 'Add to cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.sfFooter}>
          <span className={styles.sfFooterText}>
            {author.name.toUpperCase()} · {author.location.toUpperCase()} · SIGNED ON REQUEST
          </span>
        </div>
      </div>
    </div>
  );
}
