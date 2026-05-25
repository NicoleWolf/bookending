import { useState } from 'react';
import type { Product } from './types';
import { STOREFRONT_CONFIG } from './data';
import styles from './StorefrontView.module.css';

interface HeroData { name: string; tagline: string; }

interface StorefrontViewProps {
  onViewListing?: (productId: string) => void;
}

export function StorefrontView({ onViewListing }: StorefrontViewProps = {}) {
  const [editMode,       setEditMode]       = useState(false);
  const [editingSection, setEditingSection] = useState<'hero' | 'products' | null>(null);
  const [hero,           setHero]           = useState<HeroData>(STOREFRONT_CONFIG.hero);
  const [heroDraft,      setHeroDraft]      = useState<HeroData>(STOREFRONT_CONFIG.hero);
  const [featuredIds,    setFeaturedIds]    = useState<string[]>(STOREFRONT_CONFIG.featuredIds);
  const [hasChanges,     setHasChanges]     = useState(false);

  const featured: Product[] = [];
  const eligible: Product[] = [];

  function applyHero() {
    setHero(heroDraft);
    setHasChanges(true);
    setEditingSection(null);
  }

  function toggleFeatured(id: string, checked: boolean) {
    setFeaturedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    setHasChanges(true);
  }

  function handleSave() {
    setHasChanges(false);
    setEditMode(false);
    setEditingSection(null);
  }

  function handleDiscard() {
    setHero(STOREFRONT_CONFIG.hero);
    setHeroDraft(STOREFRONT_CONFIG.hero);
    setFeaturedIds(STOREFRONT_CONFIG.featuredIds);
    setHasChanges(false);
    setEditingSection(null);
  }

  function enterEdit() {
    setEditMode(true);
  }

  function exitEdit() {
    setEditMode(false);
    setEditingSection(null);
  }

  return (
    <div className={styles.root}>
      {/* ── Edit bar ── */}
      <div className={styles.editBar}>
        <div className={styles.editBarLeft}>
          <span className={styles.editBarDot} data-active={editMode ? '' : undefined} />
          <span className={styles.editBarUrl}>billiewolf.bookending.press</span>
        </div>
        <div className={styles.editBarCenter}>
          <button
            className={styles.editToggle}
            data-active={editMode ? '' : undefined}
            onClick={editMode ? exitEdit : enterEdit}
          >
            {editMode ? 'Exit edit mode' : 'Edit storefront'}
          </button>
        </div>
        <div className={styles.editBarRight}>
          {hasChanges && (
            <>
              <button className={styles.editBarDiscard} onClick={handleDiscard}>Discard</button>
              <button className={styles.editBarSave} onClick={handleSave}>Save changes</button>
            </>
          )}
        </div>
      </div>

      {/* ── Storefront (light theme) ── */}
      <div className={styles.storefront}>

        {/* Nav */}
        <div className={styles.sfNav}>
          <span className={`serif ${styles.sfNavBrand}`}>{hero.name}</span>
          <span className={styles.sfNavLinks}>SHOP · ESSAYS · LETTER</span>
        </div>

        <hr className={styles.sfRule} />

        {/* Hero */}
        <div className={styles.sfHero}>
          <div className={styles.sfHeroBody}>
            <div className={`serif ${styles.sfHeroName}`}>{hero.name}</div>
            <div className={`serif ${styles.sfHeroTagline}`}>{hero.tagline}</div>
            <div className={styles.sfHeroLocation}>Portland, Oregon</div>
          </div>
          {editMode && editingSection !== 'hero' && (
            <button
              className={styles.sectionEditBtn}
              onClick={() => { setHeroDraft(hero); setEditingSection('hero'); }}
            >
              Edit hero
            </button>
          )}
        </div>

        {editMode && editingSection === 'hero' && (
          <div className={styles.sectionEditPanel}>
            <div className={styles.editPanelRow}>
              <div className={styles.editPanelField}>
                <label className={styles.editPanelLabel}>Display name</label>
                <input
                  className={styles.editPanelInput}
                  value={heroDraft.name}
                  onChange={e => setHeroDraft(d => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className={`${styles.editPanelField} ${styles.editFieldWide}`}>
                <label className={styles.editPanelLabel}>Tagline</label>
                <input
                  className={styles.editPanelInput}
                  value={heroDraft.tagline}
                  onChange={e => setHeroDraft(d => ({ ...d, tagline: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.editPanelActions}>
              <button className={styles.editPanelCancel} onClick={() => setEditingSection(null)}>Cancel</button>
              <button className={styles.editPanelApply} onClick={applyHero}>Apply</button>
            </div>
          </div>
        )}

        <hr className={styles.sfRule} />

        {/* Products */}
        <div className={styles.sfProducts}>
          <div className={styles.sfProductsHeader}>
            <span className={styles.sfProductsLabel}>Shop — books & editions</span>
            {editMode && editingSection !== 'products' && (
              <button
                className={styles.sectionEditBtn}
                onClick={() => setEditingSection('products')}
              >
                Edit featured
              </button>
            )}
          </div>

          {editMode && editingSection === 'products' && (
            <div className={styles.sectionEditPanel}>
              <div className={`${styles.editPanelLabel} ${styles.editLabelSpaced}`}>
                Select which products to feature in your shop
              </div>
              <div className={styles.productCheckList}>
                {eligible.map(p => (
                  <label key={p.id} className={styles.productCheckRow}>
                    <input
                      type="checkbox"
                      className={styles.productCheckbox}
                      checked={featuredIds.includes(p.id)}
                      onChange={e => toggleFeatured(p.id, e.target.checked)}
                    />
                    <span className={styles.productCheckTitle}>{p.title}</span>
                    <span className={styles.productCheckType}>{p.type}</span>
                    <span className={styles.productCheckPrice}>${p.price}</span>
                  </label>
                ))}
              </div>
              <div className={styles.editPanelActions}>
                <button className={styles.editPanelApply} onClick={() => setEditingSection(null)}>Done</button>
              </div>
            </div>
          )}

          <div className={styles.sfProductGrid}>
            {featured.map(p => (
              <div
                key={p.id}
                className={styles.sfProduct}
                style={onViewListing ? { cursor: 'pointer' } : undefined}
                onClick={onViewListing ? () => onViewListing(p.id) : undefined}
              >
                <div className={styles.sfProductCover}>
                  <div className={styles.sfProductAuthor}>B. WOLF</div>
                  <div className={`serif ${styles.sfProductTitle}`}>{p.title}</div>
                </div>
                <div className={styles.sfProductType}>{p.type}</div>
                <div className={styles.sfProductFooter}>
                  <span className={`serif ${styles.sfProductPrice}`}>${p.price}</span>
                  <button className={styles.sfProductCta}>Add to cart</button>
                </div>
              </div>
            ))}
            {featured.length === 0 && editMode && (
              <div className={styles.emptyFeatured}>
                No products featured — use "Edit featured" to add some.
              </div>
            )}
          </div>
        </div>

        <div className={styles.sfFooter}>
          <span className={styles.sfFooterText}>
            BILLIE WOLF · PORTLAND, OREGON · SIGNED ON REQUEST · EST. 2024
          </span>
        </div>
      </div>
    </div>
  );
}
