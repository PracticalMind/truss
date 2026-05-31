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

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const json = await res.json().catch(() => null)
      const detail = Array.isArray(json?.detail)
        ? json.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(', ')
        : json?.detail
      throw new Error(json?.error ?? detail ?? `HTTP ${res.status}`)
    }
    // Non-JSON response (HTML gateway errors, etc.)
    throw new Error(`HTTP ${res.status}: ${res.statusText || 'Server error'}`)
  }

  const json = await res.json().catch(() => null)
  return json as T
}
