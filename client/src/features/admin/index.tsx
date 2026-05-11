import { useState, useEffect, useCallback } from 'react';
import { SectionHead, Avatar, Pill } from '../../shared/ui/atoms';
import { useAuth } from '../auth';
import { adminApi, fmtDate } from '../auth/adminApi';
import type { AdminUserRecord, InviteRecord } from '../auth/adminApi';
import styles from './AdminPanel.module.css';

type PanelAction = 'edit' | 'resetpw' | 'delete' | null;

interface RowState {
  action:    PanelAction;
  editName:  string;
  editEmail: string;
  resetLink: string | null;
  linkCopied: boolean;
  saved:     boolean;
}

function freshRow(u: AdminUserRecord): RowState {
  return { action: null, editName: u.name, editEmail: u.email, resetLink: null, linkCopied: false, saved: false };
}

export default function AdminPanel() {
  const { currentUser } = useAuth();

  const [users,    setUsers]    = useState<AdminUserRecord[]>([]);
  const [invites,  setInvites]  = useState<InviteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rows,     setRows]     = useState<Record<string, RowState>>({});

  // Invite form state
  const [inviteEmail,   setInviteEmail]   = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [devLink,       setDevLink]       = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.getUsers(), adminApi.getInvites()])
      .then(([loadedUsers, loadedInvites]) => {
        setUsers(loadedUsers);
        setInvites(loadedInvites);
        setRows(Object.fromEntries(loadedUsers.map(u => [u.id, freshRow(u)])));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  function row(id: string): RowState {
    const u = users.find(x => x.id === id);
    return rows[id] ?? (u ? freshRow(u) : { action: null, editName: '', editEmail: '', resetLink: null, linkCopied: false, saved: false });
  }

  function patchRow(id: string, patch: Partial<RowState>) {
    setRows(prev => ({ ...prev, [id]: { ...row(id), ...patch } }));
  }

  function toggle(id: string) {
    setExpanded(prev => prev === id ? null : id);
    if (expanded === id) patchRow(id, { action: null, resetLink: null, saved: false });
  }

  // ── Edit ──────────────────────────────────────────────────────────
  const saveEdit = useCallback(async (u: AdminUserRecord) => {
    const r = row(u.id);
    try {
      const updated = await adminApi.updateUser(u.id, {
        name:  r.editName.trim()  || u.name,
        email: r.editEmail.trim() || u.email,
      });
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
      patchRow(u.id, { action: null, saved: true, editName: updated.name, editEmail: updated.email });
      setTimeout(() => patchRow(u.id, { saved: false }), 2000);
    } catch (err: any) {
      console.error('Save failed:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, users]);

  // ── Password reset ────────────────────────────────────────────────
  const resetPw = useCallback(async (u: AdminUserRecord) => {
    try {
      const { link } = await adminApi.resetPassword(u.id);
      patchRow(u.id, { resetLink: link, action: null });
    } catch (err: any) {
      alert(err.message || 'Password reset failed. This user may not have a Supabase account.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function copyLink(id: string, link: string) {
    navigator.clipboard.writeText(link).then(() => {
      patchRow(id, { linkCopied: true });
      setTimeout(() => patchRow(id, { linkCopied: false }), 2000);
    });
  }

  // ── Delete ────────────────────────────────────────────────────────
  const confirmDelete = useCallback(async (id: string) => {
    try {
      await adminApi.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setExpanded(null);
    } catch (err: any) {
      alert(err.message || 'Delete failed.');
    }
  }, []);

  // ── Role / status ─────────────────────────────────────────────────
  const toggleRole = useCallback(async (u: AdminUserRecord) => {
    try {
      const updated = await adminApi.setUserRole(u.id, !u.isAdmin);
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
    } catch (err: any) {
      console.error('Role update failed:', err);
    }
  }, []);

  const toggleStatus = useCallback(async (u: AdminUserRecord) => {
    const next = u.status === 'active' ? 'suspended' : 'active';
    try {
      const updated = await adminApi.setUserStatus(u.id, next);
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
    } catch (err: any) {
      console.error('Status update failed:', err);
    }
  }, []);

  // ── Invites ───────────────────────────────────────────────────────
  const sendInvite = useCallback(async () => {
    if (!inviteEmail.trim()) return;
    setInviteSending(true);
    setDevLink(null);
    try {
      const invite = await adminApi.sendInvite(inviteEmail.trim());
      setInvites(prev => [invite, ...prev]);
      if (invite.devInviteLink) setDevLink(invite.devInviteLink);
      setInviteEmail('');
    } catch (err: any) {
      alert(err.message || 'Failed to send invite.');
    } finally {
      setInviteSending(false);
    }
  }, [inviteEmail]);

  const revokeInvite = useCallback(async (token: string) => {
    try {
      await adminApi.revokeInvite(token);
      setInvites(prev => prev.filter(i => i.token !== token));
    } catch (err: any) {
      alert(err.message || 'Failed to revoke invite.');
    }
  }, []);

  // ── Derived stats ─────────────────────────────────────────────────
  const totalUsers   = users.length;
  const adminCount   = users.filter(u => u.isAdmin).length;
  const suspendCount = users.filter(u => u.status === 'suspended').length;
  const recentCount  = users.filter(u => {
    const diff = Date.now() - new Date(u.createdAt).getTime();
    return diff < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const pendingInvites = invites.filter(i => !i.usedAt && new Date(i.expiresAt) > new Date());

  if (isLoading) {
    return (
      <section className={styles.section}>
        <SectionHead eyebrow="§ Admin" title="User Management" kicker="Loading…" />
        <div className={styles.loadingState}>Loading user data…</div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <SectionHead
          eyebrow="§ Admin"
          title="User Management"
          kicker={`${totalUsers} registered users · ${adminCount} admin${adminCount !== 1 ? 's' : ''} · ${suspendCount} suspended`}
        />
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total users',    value: totalUsers,   sub: 'all time' },
          { label: 'Admins',         value: adminCount,   sub: 'with elevated access' },
          { label: 'Suspended',      value: suspendCount, sub: 'blocked from login' },
          { label: 'New this month', value: recentCount,  sub: 'joined in last 30 days' },
        ].map(s => (
          <div key={s.label} className={styles.statCell}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={`serif ${styles.statValue}`}>{s.value}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className={styles.tableHead}>
        {['User', 'Email', 'Joined', 'Last login', 'Status', 'Role', ''].map((h, i) => (
          <div key={i} className={styles.tableHeadCell}>{h}</div>
        ))}
      </div>

      {users.map(u => {
        const r          = row(u.id);
        const isExpanded = expanded === u.id;
        const isYou      = u.id === currentUser?.id;

        return (
          <div key={u.id}>
            {/* ── Row ── */}
            <div
              className={styles.userRow}
              data-expanded={isExpanded ? '' : undefined}
              data-suspended={u.status === 'suspended' ? '' : undefined}
              onClick={() => toggle(u.id)}
            >
              <div className={styles.userIdentity}>
                <Avatar initials={u.name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)} tone="muted" size={28} />
                <span className={styles.userName}>
                  {u.name}
                  {isYou && <span className={styles.userYou}>you</span>}
                </span>
              </div>
              <div className={styles.userEmail}>{u.email}</div>
              <div className={styles.userMeta}>{fmtDate(u.createdAt)}</div>
              <div className={styles.userMeta}>{u.lastLoginAt ? fmtDate(u.lastLoginAt) : '—'}</div>
              <Pill tone={u.status === 'active' ? 'good' : 'danger'}>{u.status}</Pill>
              <Pill tone={u.isAdmin ? 'accent' : 'neutral'}>{u.isAdmin ? 'Admin' : 'User'}</Pill>
              <button className={styles.expandBtn} onClick={e => { e.stopPropagation(); toggle(u.id); }}>
                {isExpanded ? '▴' : '▾'}
              </button>
            </div>

            {/* ── Expanded panel ── */}
            {isExpanded && (
              <div className={styles.expandedPanel}>

                {/* Edit profile */}
                {r.action === 'edit' ? (
                  <div className={styles.expandSection}>
                    <div className={styles.expandLabel}>Edit profile info</div>
                    <div className={styles.editRow}>
                      <div className={styles.editField}>
                        <div className={styles.editFieldLabel}>Name</div>
                        <input
                          className={styles.editInput}
                          value={r.editName}
                          onChange={e => patchRow(u.id, { editName: e.target.value })}
                        />
                      </div>
                      <div className={styles.editField}>
                        <div className={styles.editFieldLabel}>Email</div>
                        <input
                          className={styles.editInput}
                          type="email"
                          value={r.editEmail}
                          onChange={e => patchRow(u.id, { editEmail: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className={styles.actionRow}>
                      <button className={styles.btnPrimary} onClick={() => saveEdit(u)}>Save changes</button>
                      <button className={styles.btnGhost} onClick={() => patchRow(u.id, { action: null, editName: u.name, editEmail: u.email })}>Cancel</button>
                    </div>
                  </div>
                ) : r.action === 'delete' ? (
                  <div className={styles.expandSection}>
                    <div className={styles.expandLabel}>Delete account</div>
                    <div className={styles.confirmBox}>
                      <div className={styles.confirmText}>
                        Permanently delete <strong>{u.name}</strong>? This cannot be undone.
                      </div>
                      <div className={styles.confirmActions}>
                        <button className={styles.btnDanger} onClick={() => confirmDelete(u.id)}>Yes, delete account</button>
                        <button className={styles.btnGhost} onClick={() => patchRow(u.id, { action: null })}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Recovery link display */}
                    {r.resetLink && (
                      <div className={styles.expandSection}>
                        <div className={styles.expandLabel}>Password reset link</div>
                        <div className={styles.tempPwBox}>
                          <span className={styles.tempPwLabel}>Share with user:</span>
                          <span className={styles.tempPwValue} style={{ fontSize: 11, wordBreak: 'break-all' }}>{r.resetLink}</span>
                          <button
                            className={styles.tempPwCopy}
                            data-copied={r.linkCopied ? '' : undefined}
                            onClick={() => copyLink(u.id, r.resetLink!)}
                          >
                            {r.linkCopied ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className={styles.expandSection}>
                      <div className={styles.expandLabel}>Actions</div>
                      <div className={styles.actionRow}>
                        <button className={styles.btnGhost} onClick={() => patchRow(u.id, { action: 'edit' })}>
                          Edit profile
                        </button>
                        <button className={styles.btnGhost} onClick={() => resetPw(u)}>
                          Reset password
                        </button>
                        <button
                          className={u.status === 'active' ? styles.btnWarn : styles.btnGhost}
                          onClick={() => toggleStatus(u)}
                        >
                          {u.status === 'active' ? 'Suspend account' : 'Reactivate account'}
                        </button>
                        {!isYou && (
                          <button className={styles.btnDanger} onClick={() => patchRow(u.id, { action: 'delete' })}>
                            Delete account
                          </button>
                        )}
                        {r.saved && <span className={styles.savedNote}>✓ Saved</span>}
                      </div>
                    </div>

                    {/* Admin role */}
                    <div className={styles.expandSection}>
                      <div className={styles.expandLabel}>Permissions</div>
                      <div className={styles.adminToggleRow}>
                        <label
                          className={styles.adminToggle}
                          data-active={u.isAdmin ? '' : undefined}
                          onClick={e => { e.preventDefault(); if (!isYou) toggleRole(u); }}
                        >
                          <input
                            type="checkbox"
                            checked={u.isAdmin}
                            onChange={() => { if (!isYou) toggleRole(u); }}
                            style={{ accentColor: 'var(--accent)' }}
                          />
                          Admin access
                        </label>
                        <span className={styles.adminToggleNote}>
                          {isYou
                            ? 'You cannot remove your own admin access.'
                            : 'Grants access to this Admin panel and user management.'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

              </div>
            )}
          </div>
        );
      })}

      {/* ── Invitations ── */}
      <div className={styles.inviteSection}>
        <SectionHead
          eyebrow="§ Admin"
          title="Invitations"
          kicker={`${pendingInvites.length} pending · invite new users by email`}
        />

        {/* Invite form */}
        <div className={styles.inviteFormRow}>
          <input
            className={styles.inviteInput}
            type="email"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendInvite()}
          />
          <button className={styles.btnPrimary} onClick={sendInvite} disabled={inviteSending}>
            {inviteSending ? 'Sending…' : 'Send invite'}
          </button>
        </div>

        {/* Dev-mode invite link */}
        {devLink && (
          <div className={styles.devLinkBox}>
            <span className={styles.devLinkLabel}>Dev invite link:</span>
            <span className={styles.devLinkValue}>{devLink}</span>
            <button className={styles.devLinkCopy} onClick={() => navigator.clipboard.writeText(devLink)}>
              Copy
            </button>
          </div>
        )}

        {/* Pending invites table */}
        {pendingInvites.length > 0 && (
          <>
            <div className={styles.inviteTableHead}>
              {['Email', 'Sent', 'Expires', 'Invited by', ''].map((h, i) => (
                <div key={i} className={styles.tableHeadCell}>{h}</div>
              ))}
            </div>
            {pendingInvites.map(invite => (
              <div
                key={invite.id}
                className={styles.inviteRow}
                data-expired={new Date(invite.expiresAt) < new Date() ? '' : undefined}
              >
                <div className={styles.userEmail}>{invite.email}</div>
                <div className={styles.userMeta}>{fmtDate(invite.createdAt)}</div>
                <div className={styles.userMeta}>{fmtDate(invite.expiresAt)}</div>
                <div className={styles.userMeta}>{invite.invitedBy.name}</div>
                <button className={styles.btnDanger} onClick={() => revokeInvite(invite.token)}>
                  Revoke
                </button>
              </div>
            ))}
          </>
        )}

        {pendingInvites.length === 0 && (
          <div className={styles.emptyState}>No pending invites.</div>
        )}
      </div>
    </section>
  );
}
