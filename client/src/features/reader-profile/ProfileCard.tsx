import { useRef, useState } from 'react';
import { Avatar } from '../../shared/ui/atoms';
import styles from './ProfileCard.module.css';

interface Props {
  name: string;
  location: string;
  avatarUrl: string | null;
  onNameChange:     (v: string) => void;
  onLocationChange: (v: string) => void;
  onAvatarChange:   (url: string | null) => void;
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

export function ProfileCard({ name, location, avatarUrl, onNameChange, onLocationChange, onAvatarChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const nameCount = name.length;
  const nameOver  = nameCount > 60;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB.'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { api } = await import('../../lib/api');
      const data = await api.upload<{ url: string }>('/api/covers/upload', form);
      onAvatarChange(data.url);
    } catch {
      /* non-fatal — user can retry */
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className={styles.card}>
      {/* Avatar */}
      <div className={styles.avatarWrap}>
        <button
          className={styles.avatarBtn}
          type="button"
          aria-label="Change profile photo"
          data-uploading={uploading ? '' : undefined}
          onClick={() => fileRef.current?.click()}
        >
          <Avatar
            initials={getInitials(name)}
            tone="paper"
            size={64}
            src={avatarUrl ?? undefined}
          />
          <span className={styles.avatarOverlay} aria-hidden="true">
            {uploading ? '…' : '⊕'}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.fileInput}
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* Fields */}
      <div className={styles.fields}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="rp-name">Display name</label>
          <input
            id="rp-name"
            className={styles.input}
            data-error={nameOver ? '' : undefined}
            type="text"
            value={name}
            maxLength={80}
            onChange={e => onNameChange(e.target.value)}
            autoComplete="name"
          />
          <span className={styles.charCount} data-over={nameOver ? '' : undefined}>
            {nameCount}/60
          </span>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="rp-location">Location</label>
          <input
            id="rp-location"
            className={styles.input}
            type="text"
            value={location}
            maxLength={80}
            placeholder="Optional"
            onChange={e => onLocationChange(e.target.value)}
            autoComplete="address-level2"
          />
        </div>
      </div>
    </div>
  );
}
