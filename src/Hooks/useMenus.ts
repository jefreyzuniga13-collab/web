import { useState, useEffect } from 'react'
import { menuService } from '@/Services/MenuService'
import type { MenuDto } from '@/Interfaces/Chat/ChatInterfaces'

export function useMenus() {
  const [menus, setMenus] = useState<MenuDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

useEffect(() => {
    setLoading(true)
    menuService.getMenusAsync()
      .then(setMenus)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
}, [])

  return { menus, loading, error }
}