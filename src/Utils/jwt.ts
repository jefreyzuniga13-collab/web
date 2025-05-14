import {jwtDecode} from 'jwt-decode'

const ACCESS_TOKEN_KEY = 'accessToken'

export function saveAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function removeAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}
interface TokenPayload {
  role?: string | string[]
}

export function getRolesFromStoredToken(): string[] {
  const token = getAccessToken()
  if (!token) return []

  try {
    const { role } = jwtDecode<TokenPayload>(token)
    if (!role) return []
    return Array.isArray(role) ? role : [role]
  } catch {
    return []
  }
}