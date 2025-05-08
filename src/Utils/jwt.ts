import {jwtDecode} from 'jwt-decode'

interface TokenPayload {
  role?: string
}
export function getRoleFromToken(token: string): string | null {
  try {
    const payload = jwtDecode<TokenPayload>(token)
    return payload.role ?? null
  } catch {
    return null
  }
}