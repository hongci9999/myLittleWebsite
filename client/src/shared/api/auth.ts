const API_BASE = '/api/auth'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_at?: number
}

export interface RefreshResponse {
  access_token: string
  refresh_token: string
  expires_at?: number
}

const AUTH_STORAGE_KEY = 'mylittlewebsite-auth'

export function getStoredAuth(): {
  access_token: string
  refresh_token: string
} | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as {
      access_token: string
      refresh_token: string
    }
    return data.access_token && data.refresh_token ? data : null
  } catch {
    return null
  }
}

export function setStoredAuth(data: {
  access_token: string
  refresh_token: string
}) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? 'Login failed')
  }
  const data = (await res.json()) as LoginResponse
  return data
}

export async function refresh(
  refreshToken: string
): Promise<RefreshResponse | null> {
  const res = await fetch(`${API_BASE}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) return null
  return res.json() as Promise<RefreshResponse>
}

export async function verifyToken(accessToken: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.ok
}
