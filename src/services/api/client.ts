import { supabase } from '../../lib/supabase'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()

  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const json = await res.json().catch(() => ({ detail: res.statusText }))

  if (!res.ok) {
    // FastAPI validation errors return detail as an array of objects
    const detail = Array.isArray(json.detail)
      ? json.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(', ')
      : json.detail
    throw new Error(json.error ?? detail ?? `HTTP ${res.status}`)
  }

  return json as T
}
