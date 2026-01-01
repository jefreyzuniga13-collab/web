// import { useCallback, useEffect, useState } from 'react'
// import { RolesService } from '@/Services/RolesServices'
// import type { MenuResponseDto, RoleMenuResponseDto } from '@/Interfaces/Auth/MenuInterfaces'

// export function useRoleMenus(roleId: number) {
//   const [menus, setMenus] = useState<MenuResponseDto[]>([])
//   const [relations, setRelations] = useState<RoleMenuResponseDto[]>([])
//   const [loading, setLoading] = useState<boolean>(false)
//   const [error, setError] = useState<Error | null>(null)

//   const fetchAll = useCallback(async () => {
//     if (!roleId || roleId <= 0) {
//       setMenus([])
//       setRelations([])
//       return
//     }
//     setLoading(true)
//     setError(null)
//     try {
//       const [m, r] = await Promise.all([
//         RolesService.getMenusByRoleAsync(roleId),
//         RolesService.getRelationsByRoleAsync(roleId),
//       ])
//       setMenus(m)
//       setRelations(r)
//     } catch (err) {
//       setError(err as Error)
//     } finally {
//       setLoading(false)
//     }
//   }, [roleId])

//   const assignMenu = useCallback(
//     async (menuId: number) => {
//       if (!roleId || roleId <= 0 || !menuId || menuId <= 0) return
//       setLoading(true)
//       setError(null)
//       try {
//         await RolesService.assignMenuAsync({ roleId, menuId })
//         await fetchAll()
//       } catch (err) {
//         setError(err as Error)
//       } finally {
//         setLoading(false)
//       }
//     },
//     [roleId, fetchAll]
//   )

//   const toggleMenu = useCallback(
//     async (menuId: number) => {
//       if (!roleId || roleId <= 0 || !menuId || menuId <= 0) return
//       setLoading(true)
//       setError(null)
//       try {
//         await RolesService.toggleMenuAsync({ roleId, menuId })
//         await fetchAll()
//       } catch (err) {
//         setError(err as Error)
//       } finally {
//         setLoading(false)
//       }
//     },
//     [roleId, fetchAll]
//   )

//   useEffect(() => {
//     fetchAll()
//   }, [fetchAll])

//   return { menus, relations, loading, error, assignMenu, toggleMenu, refresh: fetchAll }
// }