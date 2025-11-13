/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react'
import type { User, UpdateUserRequest } from '@/Interfaces/User/UserInterfaces'
import { userService } from '@/Services/User/UserService'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'
import { toast } from 'react-toastify'

const useClasicUser = (userId?: number) => {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<{ roleId: number; roleName: string }[]>([])
  const [companies, setCompanies] = useState<{ companyId: number; name: string }[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [globalFilter, setGlobalFilter] = useState('')
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (typeof userId === 'number') fetchById(userId)
  }, [userId])

  /** 🔹 Cargar roles y compañías */
  useEffect(() => {
    const loadBaseData = async () => {
      try {
        const [rolesRes, companiesRes] = await Promise.all([
          userService.getRolesAsync(),
          userService.getCompaniesAsync()
        ])
        setRoles(rolesRes)
        setCompanies(companiesRes)
      } catch (err: any) {
        console.error('Error al cargar roles/empresas', err)
      }
    }
    loadBaseData()
  }, [])

  /** 🔹 Obtener usuarios paginados */
  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setLoadingList(true)
      setError(null)
      try {
        const res: PagedResponse<User> = await userService.getUsersAsync(globalFilter, p, s)
        setUsers(res.items)
        setTotalCount(res.meta.totalCount)
        setPage(res.meta.currentPage)
        setPageSize(res.meta.pageSize)
      } catch (err: any) {
        console.error('Error al obtener usuarios', err)
        setError(err)
        toast.error('Error al cargar usuarios')
      } finally {
        setLoadingList(false)
      }
    },
    [globalFilter, page, pageSize]
  )

  /** 🔹 Obtener un usuario por ID */
  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const user = await userService.getUserAsync(id)
      setSelectedUser(user)
    } catch (err: any) {
      setError(err)
      toast.error('Error al obtener usuario')
    } finally {
      setLoadingItem(false)
    }
  }, [])

  
  const create = useCallback(async (formData: FormData) => {
  setLoadingItem(true)
  setError(null)
  try {
    await userService.createUserAsync(formData)
    toast.success('Usuario creado')
    fetchPage(1)
    closeModal()
  } catch (err: any) {
    const backendMsg =
      err?.response?.data?.message ||
      err?.response?.data?.errors?.join(', ') ||
      'Error al crear usuario'
    setError(err)
    toast.error(backendMsg)
  } finally {
    setLoadingItem(false)
  }
}, [fetchPage])


  const update = useCallback(async (id: number, data: UpdateUserRequest) => {
    setLoadingItem(true)
    setError(null)
    try {
      await userService.updateUserAsync(id, data)
      toast.success('Usuario actualizado')
      fetchPage(page)
      closeModal()
    } catch (err: any) {
      setError(err)
      toast.error('Error al actualizar usuario')
    } finally {
      setLoadingItem(false)
    }
  }, [fetchPage, page])

  /** 🔹 Activar / desactivar usuario */
  const toggle = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      await userService.toggleUserAsync(id)
      toast.success('Estado de usuario actualizado')
      fetchPage(page)
    } catch (err: any) {
      setError(err)
      toast.error('Error al cambiar estado')
    } finally {
      setLoadingItem(false)
    }
  }, [fetchPage, page])

  /** 🔹 Modal: abrir / cerrar */
  const openCreate = useCallback(() => {
    setSelectedUser(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((user: User) => {
    setSelectedUser(user)
    setModalMode('edit')
    setModalOpen(true)
  }, [])

  const openView = useCallback((user: User) => {
    setSelectedUser(user)
    setModalMode('view')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedUser(null)
    setModalMode('create')
  }, [])

  /** 🔹 Crear o editar según modo */
  const handleSubmit = useCallback(
    (data: FormData | UpdateUserRequest) => {
      if (modalMode === 'create') create(data as FormData)
      else if (modalMode === 'edit' && selectedUser)
        update(selectedUser.userId, data as UpdateUserRequest)
    },
    [modalMode, selectedUser, create, update]
  )

  useEffect(() => {
    fetchPage()
  }, [fetchPage, globalFilter, page, pageSize])

  return {
    users,
    selectedUser,
    roles,
    companies,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    isModalOpen,
    modalMode,
    globalFilter,
    setPage: (p: number) => fetchPage(p, pageSize),
    setPageSize: (s: number) => fetchPage(1, s),
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    fetchPage,
    fetchById,
    create,
    update,
    toggle,
    setGlobalFilter,
  }
}

export default useClasicUser