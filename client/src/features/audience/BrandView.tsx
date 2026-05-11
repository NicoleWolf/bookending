import { useState } from 'react';
import { Btn } from '../../shared/ui/atoms';
import { IconArrowUp } from '../../shared/ui/icons';
import { PK_ASSETS } from './data';
import { IdentityView } from './IdentityView';
import { PressKitView } from './PressKitView';
import type { BookMetadata } from '../library/data';
import styles from './Brand.module.css';

interface BrandViewProps {
  savedBooks: Record<number, BookMetadata>;
}

export function BrandView({ savedBooks }: BrandViewProps) {
  const [brandTab, setBrandTab] = useState<'identity' | 'presskit'>('identity');

  const draftCount = PK_ASSETS.filter(a => a.status === 'draft').length;

  return (
    <div>
      <div className={styles.brandBar}>
        <nav className={styles.brandTabs}>
          <button
            className={styles.brandTab}
            data-active={brandTab === 'identity' ? 'true' : undefined}
            onClick={() => setBrandTab('identity')}
          >
            Identity & social
          </button>
          <button
            className={styles.brandTab}
            data-active={brandTab === 'presskit' ? 'true' : undefined}
            onClick={() => setBrandTab('presskit')}
          >
            Press kit
            {draftCount > 0 && <span className={styles.tabDot} />}
          </button>
        </nav>
        {brandTab === 'presskit' && (
          <Btn tone="ghost" icon={<IconArrowUp size={12} />}>Download full kit ↗</Btn>
        )}
      </div>
      {brandTab === 'identity' && <IdentityView />}
      {brandTab === 'presskit' && <PressKitView savedBooks={savedBooks} />}
    </div>
  );
}
