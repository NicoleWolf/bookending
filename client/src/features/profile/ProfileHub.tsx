import { useState } from 'react';
import ProfileView from './ProfileView';
import ReaderProfilePage from '../reader-profile';
import AuthorProfilePage from '../author-profile';
import type { AppNotification } from '../notifications/data';
import styles from './ProfileHub.module.css';

export type HubTab = 'Profile' | 'My Reader Profile' | 'My Author Profile';

const TABS: HubTab[] = ['Profile', 'My Reader Profile', 'My Author Profile'];

interface Props {
  onBack: () => void;
  onToast: (n: AppNotification) => void;
  initialTab?: HubTab;
}

export default function ProfileHub({ onBack, onToast, initialTab = 'Profile' }: Props) {
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);

  return (
    <div className={styles.hub}>
      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab}
            className={styles.tab}
            data-active={activeTab === tab ? '' : undefined}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        {activeTab === 'Profile' && (
          <ProfileView onBack={onBack} />
        )}
        {activeTab === 'My Reader Profile' && (
          <ReaderProfilePage onDone={() => setActiveTab('Profile')} onToast={onToast} />
        )}
        {activeTab === 'My Author Profile' && (
          <AuthorProfilePage onDone={() => setActiveTab('Profile')} onToast={onToast} />
        )}
      </div>
    </div>
  );
}
