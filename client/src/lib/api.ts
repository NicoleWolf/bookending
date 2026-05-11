const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

type FetchOptions = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> };

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Set by AuthContext on login/logout — avoids circular imports with Supabase
let _token: string | null = null;
export function setApiToken(token: string | null) { _token = token; }

async function apiClient<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...options.headers };
  if (typeof options.body === 'string') headers['Content-Type'] = 'application/json';
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    _token = null;
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }

  const json = await res.json() as { data?: T; error?: string };
  if (!res.ok) throw new ApiError(res.status, json.error ?? `Request failed (${res.status})`);
  return json.data as T;
}

export const api = {
  get:    <T>(path: string)                 => apiClient<T>(path),
  post:   <T>(path: string, body?: unknown) => apiClient<T>(path, { method: 'POST',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  put:    <T>(path: string, body?: unknown) => apiClient<T>(path, { method: 'PUT',   body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown) => apiClient<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  del:    <T>(path: string)                 => apiClient<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, form: FormData) => apiClient<T>(path, { method: 'POST',  body: form as unknown as string }),
};
