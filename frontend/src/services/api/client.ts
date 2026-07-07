import { supabase } from '../../lib/supabase';

const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER ?? 'local';
const LOCAL_TOKEN_KEY = 'truss_token';
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

async function getToken(): Promise<string | null> {
  if (AUTH_PROVIDER === 'local') {
    return localStorage.getItem(LOCAL_TOKEN_KEY);
  }
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function refreshToken(): Promise<string | null> {
  if (AUTH_PROVIDER === 'local') {
    // Local tokens are long-lived; a 401 means the token is truly invalid.
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    localStorage.removeItem('truss_user');
    return null;
  }
  if (!supabase) return null;
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    await supabase.auth.signOut();
    return null;
  }
  return data.session.access_token;
}

function buildHeaders(
  token: string | null,
  isFormData: boolean,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function parseError(res: Response, json: { error?: string; detail?: unknown } | null): ApiError {
  if (json) {
    const detail = Array.isArray(json.detail)
      ? (json.detail as { msg?: string }[]).map(d => d.msg ?? JSON.stringify(d)).join(', ')
      : json.detail;
    return new ApiError(json.error ?? (detail as string) ?? `HTTP ${res.status}`, res.status);
  }
  return new ApiError(`HTTP ${res.status}: ${res.statusText || 'Server error'}`, res.status);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const extra = (options.headers as Record<string, string>) ?? {};

  let token = await getToken();
  let res = await fetch(`${BASE}${path}`, { ...options, headers: buildHeaders(token, isFormData, extra) });

  if (res.status === 401) {
    token = await refreshToken();
    if (!token) throw new Error('Session expired. Please sign in again.');
    res = await fetch(`${BASE}${path}`, { ...options, headers: buildHeaders(token, isFormData, extra) });
  }

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? '';
    const json = contentType.includes('application/json') ? await res.json().catch(() => null) : null;
    throw parseError(res, json);
  }

  return res.json().catch(() => null) as T;
}

export async function apiFormDownload(path: string, body: FormData, filename: string): Promise<void> {
  let token = await getToken();
  let res = await fetch(`${BASE}${path}`, { method: 'POST', headers: buildHeaders(token, true), body });

  if (res.status === 401) {
    token = await refreshToken();
    if (!token) throw new Error('Session expired. Please sign in again.');
    res = await fetch(`${BASE}${path}`, { method: 'POST', headers: buildHeaders(token, true), body });
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText || 'Upload failed'}`);
  _triggerDownload(await res.blob(), filename);
}

export async function apiDownload(path: string, filename: string): Promise<void> {
  let token = await getToken();
  let res = await fetch(`${BASE}${path}`, { headers: buildHeaders(token, false) });

  if (res.status === 401) {
    token = await refreshToken();
    if (!token) throw new Error('Session expired. Please sign in again.');
    res = await fetch(`${BASE}${path}`, { headers: buildHeaders(token, false) });
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText || 'Export failed'}`);
  _triggerDownload(await res.blob(), filename);
}

function _triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
