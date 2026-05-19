import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';

export interface AuthorProfileData {
  id: string;
  name: string;
  displayName: string | null;
  location: string | null;
  authorBio: string | null;
  writingProcess: string | null;
  genres: string[];
  subgenres: string[];
  featuredManuscriptId: string | null;
  showActivityPublicly: boolean;
  avatarUrl: string | null;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useAuthorProfileSave(profile: AuthorProfileData): { saveState: SaveState; retry: () => void } {
  const [saveState, setSaveState]   = useState<SaveState>('idle');
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef     = useRef(profile);
  const isFirstRender = useRef(true);

  useEffect(() => { latestRef.current = profile; }, [profile]);

  const save = useCallback(async (p: AuthorProfileData) => {
    setSaveState('saving');
    try {
      await api.patch('/api/author-profile', {
        authorBio:            p.authorBio,
        writingProcess:       p.writingProcess,
        genres:               JSON.stringify(p.genres),
        subgenres:            JSON.stringify(p.subgenres),
        featuredManuscriptId: p.featuredManuscriptId,
        showActivityPublicly: p.showActivityPublicly,
      });
      setSaveState('saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        setSaveState(s => s === 'saved' ? 'idle' : s);
      }, 2500);
    } catch {
      setSaveState('error');
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void save(latestRef.current), 500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [profile, save]);

  const retry = useCallback(() => void save(latestRef.current), [save]);

  return { saveState, retry };
}
