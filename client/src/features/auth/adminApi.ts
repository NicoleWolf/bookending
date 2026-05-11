import { api } from '../../lib/api';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  status: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface InviteRecord {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  invitedBy: { name: string; email: string };
  createdAt: string;
  devInviteLink?: string;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const adminApi = {
  whoami: () =>
    api.get<{ id: string; email: string; role: string; isAdmin: boolean }>('/api/admin/whoami'),

  getUsers: () =>
    api.get<AdminUserRecord[]>('/api/admin/users'),

  updateUser: (id: string, data: { name?: string; email?: string }) =>
    api.patch<AdminUserRecord>(`/api/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    api.del<{ deleted: boolean }>(`/api/admin/users/${id}`),

  setUserRole: (id: string, isAdmin: boolean) =>
    api.patch<AdminUserRecord>(`/api/admin/users/${id}/role`, { isAdmin }),

  setUserStatus: (id: string, status: 'active' | 'suspended') =>
    api.patch<AdminUserRecord>(`/api/admin/users/${id}/status`, { status }),

  resetPassword: (id: string) =>
    api.post<{ link: string }>(`/api/admin/users/${id}/reset-password`),

  getInvites: () =>
    api.get<InviteRecord[]>('/api/admin/invites'),

  sendInvite: (email: string) =>
    api.post<InviteRecord>('/api/admin/invites', { email }),

  revokeInvite: (token: string) =>
    api.del<{ revoked: boolean }>(`/api/admin/invites/${token}`),
};
