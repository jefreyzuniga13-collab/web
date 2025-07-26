import { useEffect, useState, useCallback } from 'react'
import { RolesServices } from '@/Services/RolesServices'
import type { RoleResponseDto } from '@/Interfaces/Auth/AuthInterface'

export const useRoles = () => {
  const [roles, setRoles] = useState<RoleResponseDto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      const data = await RolesServices.getRolesAsync()
      setRoles(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  return { roles, loading, error, refetchRoles: fetchRoles }
}
