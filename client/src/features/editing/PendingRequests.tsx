import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import type { BetaRequestRecord } from '@bookending/shared';
import styles from './PendingRequests.module.css';

interface Props {
  manuscriptId: string;
}

export default function PendingRequests({ manuscriptId }: Props) {
  const { session } = useAuth();
  const [requests, setRequests]   = useState<BetaRequestRecord[]>([]);
  const [deciding, setDeciding]   = useState<Set<string>>(new Set());

  const fetchRequests = useCallback(async () => {
    if (!session?.token) return;
    try {
      const data = await api.get<BetaRequestRecord[]>(
        `/api/manuscripts/${manuscriptId}/readers/requests`
      );
      setRequests(data);
    } catch { /* silent */ }
  }, [manuscriptId, session?.token]);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  async function decide(requestId: string, status: 'APPROVED' | 'DECLINED') {
    setDeciding(prev => new Set([...prev, requestId]));
    try {
      await api.patch(`/api/manuscripts/${manuscriptId}/readers/requests/${requestId}`, { status });
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch { /* leave request in list */ } finally {
      setDeciding(prev => { const s = new Set(prev); s.delete(requestId); return s; });
    }
  }

  if (!session) return null;
  if (requests.length === 0) return (
    <div className={styles.empty}>No pending read requests.</div>
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        PENDING REQUESTS — {requests.length}
      </div>
      <ul className={styles.list}>
        {requests.map(req => {
          const busy = deciding.has(req.id);
          const daysAgo = Math.max(0, Math.floor(
            (Date.now() - new Date(req.createdAt).getTime()) / 86_400_000
          ));
          return (
            <li key={req.id} className={styles.row}>
              <div className={styles.meta}>
                <span className={styles.name}>{req.user.name}</span>
                <span className={styles.date}>
                  {daysAgo === 0 ? 'today' : `${daysAgo}d ago`}
                </span>
              </div>
              {req.note && (
                <p className={`serif ${styles.note}`}>&ldquo;{req.note}&rdquo;</p>
              )}
              <div className={styles.actions}>
                <button
                  className={styles.approveBtn}
                  disabled={busy}
                  onClick={() => decide(req.id, 'APPROVED')}
                  type="button"
                >
                  {busy ? '…' : 'Approve →'}
                </button>
                <button
                  className={styles.declineBtn}
                  disabled={busy}
                  onClick={() => decide(req.id, 'DECLINED')}
                  type="button"
                >
                  Decline
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
