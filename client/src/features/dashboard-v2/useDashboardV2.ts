import { useState, useEffect } from 'react';
import type { DashboardV2 } from '@bookending/shared';
import { api } from '../../lib/api';

export interface DashboardV2State {
  data:    DashboardV2 | null;
  loading: boolean;
  error:   string | null;
  refresh: () => void;
}

export function useDashboardV2(): DashboardV2State {
  const [data,    setData]    = useState<DashboardV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get<DashboardV2>('/api/dashboard/v2')
      .then(d  => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e instanceof Error ? e.message : 'Failed to load'); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tick]);

  return { data, loading, error, refresh: () => setTick(t => t + 1) };
}
