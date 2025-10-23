import { useEffect, useState, useCallback } from 'react'
import { RolesService } from '@/Services/RolesServices'
import type { RoleResponseDto } from '@/Interfaces/Auth/MenuInterfaces'

type ModalMode = 'create' | 'update' | 'view'

export const useRoles = () => {
  const [roles, setRoles] = useState<RoleResponseDto[]>([])
  const [selectedRole, setSelectedRole] = useState<RoleResponseDto | null>(null)
  const [loadingList, setLoadingList] = useState<boolean>(false)
  const [loadingItem, setLoadingItem] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState<string>('')

  const [page, setPageState] = useState<number>(1)
  const [pageSize, setPageSizeState] = useState<number>(20)
  const [totalCount, setTotalCount] = useState<number>(0)

  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      try {
        setLoadingList(true)
        setError(null)
        const resp = await RolesService.getAllAsync(p, s)
        setRoles(resp.items)
        setTotalCount(resp.meta.totalCount)
        setPageState(resp.meta.currentPage)
        setPageSizeState(resp.meta.pageSize)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoadingList(false)
      }
    },
    [page, pageSize]
  )

  const fetchById = useCallback(async (id: number) => {
    try {
      setLoadingItem(true)
      setError(null)
      const dto = await RolesService.getByIdAsync(id)
      setSelectedRole(dto)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  const create = useCallback(
    async (values: { roleName: string; description?: string | null }) => {
      try {
        setLoadingItem(true)
        setError(null)
        await RolesService.createAsync(values)
        await fetchPage(1, pageSize)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage, pageSize]
  )

  const update = useCallback(
    async (id: number, values: { roleName: string; description?: string | null }) => {
      try {
        setLoadingItem(true)
        setError(null)
        await RolesService.updateAsync(id, values)
        await fetchPage(page, pageSize)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage, page, pageSize]
  )

  const toggleRole = useCallback(
    async (id: number) => {
      try {
        setLoadingItem(true)
        setError(null)
        await RolesService.toggleAsync(id)
        await fetchPage(page, pageSize)
      } catch (err) {
        setError((err as Error).message)
        await fetchPage(page, pageSize)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage, page, pageSize]
  )

  const openCreate = useCallback(() => {
    setSelectedRole(null)
    setModalMode('create')
    setIsModalOpen(true)
  }, [])

  const openEdit = useCallback(
    (id: number) => {
      const cached = roles.find(r => r.roleId === id) || null
      setSelectedRole(cached)
      setModalMode('update')
      setIsModalOpen(true)
      fetchById(id)
    },
    [roles, fetchById]
  )

  const openView = useCallback(
    (id: number) => {
      const cached = roles.find(r => r.roleId === id) || null
      setSelectedRole(cached)
      setModalMode('view')
      setIsModalOpen(true)
      fetchById(id)
    },
    [roles, fetchById]
  )

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedRole(null)
  }, [])

  const handleSubmit = useCallback(
    (values: { roleName: string; description?: string | null }) => {
      if (modalMode === 'create') {
        create(values)
      } else if (modalMode === 'update' && selectedRole) {
        update(selectedRole.roleId, values)
      }
      closeModal()
    },
    [modalMode, selectedRole, create, update, closeModal]
  )

  const setPage = useCallback(
    (p: number) => {
      setPageState(p)
      fetchPage(p, pageSize)
    },
    [fetchPage, pageSize]
  )

  const setPageSize = useCallback(
    (s: number) => {
      setPageSizeState(s)
      fetchPage(1, s)
    },
    [fetchPage]
  )

  useEffect(() => {
    fetchPage()
  }, [fetchPage, globalFilter])

  const loading = loadingList || loadingItem

  return {
    roles,
    selectedRole,
    loading,
    error,
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleRole,
    globalFilter,
    setGlobalFilter,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
  }
}