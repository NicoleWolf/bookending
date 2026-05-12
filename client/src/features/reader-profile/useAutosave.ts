import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import type { ReaderProfileRecord } from '@bookending/shared';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useAutosave(profile: ReaderProfileRecord): { saveState: SaveState; retry: () => void } {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef       = useRef(profile);
  const isFirstRender   = useRef(true);

  useEffect(() => { latestRef.current = profile; }, [profile]);

  const save = useCallback(async (p: ReaderProfileRecord) => {
    setSaveState('saving');
    try {
      await api.patch('/api/reader-profile', {
        name:              p.name,
        bio:               p.bio,
        location:          p.location,
        genres:            p.genres,
        availableForReads: p.availableForReads,
        avatarUrl:         p.avatarUrl,
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
