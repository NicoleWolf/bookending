import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import type { ReaderProfileRecord } from '@bookending/shared';
import type { AppNotification } from '../notifications/data';
import { ReaderProfileEdit } from './ReaderProfileEdit';

interface Props {
  onDone: () => void;
  onToast: (n: AppNotification) => void;
}

export default function ReaderProfilePage({ onDone, onToast }: Props) {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<ReaderProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ReaderProfileRecord>('/api/reader-profile')
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => {
        if (currentUser) {
          setProfile({
            name: currentUser.name,
            bio: null,
            location: null,
            genres: null,
            availableForReads: true,
            avatarUrl: currentUser.avatarUrl ?? null,
          });
        }
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !profile) return null;

  return (
    <ReaderProfileEdit
      profile={profile}
      onProfileChange={setProfile}
      onDone={onDone}
      onToast={onToast}
    />
  );
}
