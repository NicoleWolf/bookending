import type { Device } from '../index';
import styles from './LiveProofPanel.module.css';

interface Props {
  device: Device;
  onDeviceChange: (device: Device) => void;
}

const DEVICES: { id: Device; label: string }[] = [
  { id: 'paperwhite', label: 'Paperwhite' },
  { id: 'phone',      label: 'Phone' },
  { id: 'tablet',     label: '7″ tablet' },
];

export default function LiveProofPanel({ device, onDeviceChange }: Props) {
  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={`mono ${styles.headerLabel}`}>LIVE PROOF</span>
        <span className={`mono ${styles.headerMeta}`}>— · IN EPUB</span>
      </div>

      <div className={styles.deviceToggle}>
        {DEVICES.map(d => (
          <button
            key={d.id}
            className={`mono ${styles.deviceBtn}`}
            data-active={d.id === device ? '' : undefined}
            onClick={() => onDeviceChange(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className={styles.frameWrap}>
        <div className={styles.deviceFrame} data-device={device}>
          <div className={styles.frameEmpty}>
            <span className={`mono ${styles.frameEmptyText}`}>No preview yet</span>
          </div>
        </div>
      </div>

      <div className={styles.epubcheck}>
        <div className={styles.epubcheckHeader}>
          <span className={`mono ${styles.epubcheckLabel}`}>EPUBCHECK</span>
          <span className={`mono ${styles.epubcheckSep}`}>·</span>
          <span className={`mono ${styles.epubcheckMeta}`}>LAST BUILD</span>
        </div>
        <hr className="rule" />
        <p className={`mono ${styles.epubcheckStatus}`}>
          No build yet — run after Step 02.
        </p>
      </div>
    </aside>
  );
}
