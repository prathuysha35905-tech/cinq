import type { ChatResponse, LoginResponse } from './types';

const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8000';

const API_BASE_STORAGE_KEY = 'cinq_api_base';

export function getApiBase(): string {
  if (typeof window === 'undefined') return DEFAULT_API_BASE;
  return (window.localStorage.getItem(API_BASE_STORAGE_KEY) || DEFAULT_API_BASE).replace(/\/+$/, '');
}

export function setApiBase(url: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(API_BASE_STORAGE_KEY, url.replace(/\/+$/, '') || DEFAULT_API_BASE);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  /** Sent as URL query params instead of a JSON body — needed for endpoints
   *  whose FastAPI handlers declare plain `str` args (query params) rather
   *  than a Pydantic request-body model, e.g. `def login(username: str, password: str)`. */
  query?: Record<string, string>;
  token?: string | null;
  auth?: boolean;
}

export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body = null, query = null, token = null, auth = true } = opts;

  let url = `${getApiBase()}${path}`;
  if (query) {
    const qs = new URLSearchParams(query).toString();
    url += (url.includes('?') ? '&' : '?') + qs;
  }

  const headers: Record<string, string> = {};
  if (body != null) headers['Content-Type'] = 'application/json';

  if (auth) {
    if (!token) throw new ApiError('Not authenticated', 401);
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    const reason = networkErr instanceof Error ? networkErr.message : String(networkErr);
    throw new ApiError(`Can't reach ${getApiBase()} — is the CINQ backend running? (${reason})`, 0);
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const parsed = data as { detail?: unknown; message?: unknown } | null;
    let msg: unknown = parsed?.detail ?? parsed?.message ?? res.statusText ?? `Request failed (${res.status})`;
    if (typeof msg !== 'string') msg = JSON.stringify(msg);
    throw new ApiError(msg as string, res.status);
  }

  return data as T;
}

export interface RawSession {
  session_id?: string;
  id?: string;
  title?: string;
  name?: string;
  [key: string]: unknown;
}

export const endpoints = {
  // NOTE: the backend declares these as plain `username: str` / `password: str`
  // (etc.) function args rather than a Pydantic body model, so FastAPI treats
  // them as query params — not a JSON body. Sending JSON here 422s.
  register: (params: { username: string; email: string; password: string }) =>
    apiFetch<unknown>('/api/v1/auth/register', { method: 'POST', auth: false, query: params }),

  login: (params: { username: string; password: string }) =>
    apiFetch<LoginResponse>('/api/v1/auth/login', { method: 'POST', auth: false, query: params }),

  listSessions: (token: string) => apiFetch<RawSession[] | { sessions?: RawSession[]; items?: RawSession[] }>('/api/v1/sessions', { token }),

  createSession: (token: string) => apiFetch<RawSession>('/api/v1/sessions', { method: 'POST', token, body: {} }),

  getSession: (token: string, id: string) =>
    apiFetch<Record<string, unknown>>(`/api/v1/sessions/${encodeURIComponent(id)}`, { token }),

  deleteSession: (token: string, id: string) =>
    apiFetch<unknown>(`/api/v1/sessions/${encodeURIComponent(id)}`, { method: 'DELETE', token }),

   chat: (token: string, body: { session_id: string; message: string; agent: string }) =>
    apiFetch<ChatResponse>('/api/v1/chat', { method: 'POST', token, body }),

  updateUsername: (token: string, username: string) =>
    apiFetch<{ message: string; username: string }>(
      '/api/v1/auth/username',
      {
        method: 'PATCH',
        token,
        query: { username },
      }
    ),

  changePassword: (
    token: string,
    currentPassword: string,
    newPassword: string
  ) =>
    apiFetch<{ message: string }>(
      '/api/v1/auth/change-password',
      {
        method: 'POST',
        token,
        query: {
          current_password: currentPassword,
          new_password: newPassword,
        },
      }
    ),
};
