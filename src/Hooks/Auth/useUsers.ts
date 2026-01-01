import { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  fetchUsers,
  fetchUserById,
  createUser,
  updateUser,
  toggleUserAsync,
  fetchRoles,
  fetchCompanies,
  clearCurrentUser,
} from '@/Context/Slices/Auth/userSlice'
import type { AppDispatch, RootState } from '@/Context'
import type { UpdateUserRequest } from '@/Interfaces/Auth/UserInterfaces'
import { AgentService } from '@/Services/auth/AgentService'
import type { AgentDto } from '@/Interfaces/Chat/ChatInterfaces'

export function useUsers() {
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    users,
    currentUser,
    loading,
    error,
    pagination: { currentPage, pageSize, totalCount },
    roles,
    companies,
  } = useSelector((state: RootState) => state.users)

  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [agents, setAgents] = useState<AgentDto[]>([])
  const [globalFilter, setGlobalFilter] = useState<string>('')

  const fetchPage = useCallback(
    (page = 1, size = pageSize) => {
      dispatch(fetchUsers({globalFilter, page, pageSize: size, search }))
    },
    [dispatch, pageSize, search, globalFilter]
  )

   const setPage = useCallback(
    (p: number) => {
      fetchPage(p, pageSize)
    },
    [fetchPage, pageSize]
  )

  const fetchOne = useCallback(
    (id: number) => {
      dispatch(fetchUserById(id)).unwrap()
    },
    [dispatch]
  )

  const create = useCallback(
    (data: FormData) => {
      dispatch(createUser(data))
        .unwrap()
        .then(() => {
          toast.success('Usuario creado')
          fetchPage(1)
          closeModal()
        })
        .catch(() => toast.error('Error al crear usuario'))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, fetchPage]
  )

  const update = useCallback(
    (id: number, data: UpdateUserRequest) => {
      dispatch(updateUser({ userId: id, userData: data }))
        .unwrap()
        .then(() => {
          toast.success('Usuario actualizado')
          fetchPage(currentPage)
          closeModal()
        })
        .catch(() => toast.error('Error al actualizar usuario'))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, fetchPage, currentPage]
  )

  const toggleUser = useCallback(
    (id: number) => {
      dispatch(toggleUserAsync(id))
        .unwrap()
        .then(() => {
          toast.success('Estado de usuario cambiado')
          fetchPage(currentPage)
        })
        .catch(() => toast.error('Error al cambiar estado de usuario'))
    },
    [dispatch, fetchPage, currentPage]
  )

  const openCreate = useCallback(() => {
    dispatch(clearCurrentUser())
    setModalMode('create')
    setModalOpen(true)
  }, [dispatch])

  const openEdit = useCallback(
    (id: number) => {
      dispatch(clearCurrentUser())
      setModalMode('edit')
      setModalOpen(true)
      fetchOne(id)
    },
    [dispatch, fetchOne]
  )

  const getAgents = useCallback(async () => {
  try {
    const agents = await AgentService.getAgentsAsync();
    setAgents(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    // toast.error('Error al cargar agentes');
  }
}, []);

  const openView = useCallback(
    (id: number) => {
      setModalMode('view')
      setModalOpen(true)
      fetchOne(id)
    },
    [fetchOne]
  )

  
  const closeModal = useCallback(() => {
    setModalOpen(false)
    dispatch(clearCurrentUser())
  }, [dispatch])

  const handleSubmit = useCallback(
    (data: FormData | UpdateUserRequest) => {
      if (modalMode === 'create') {
        create(data as FormData)
      } else if (modalMode === 'edit' && currentUser) {
        update(currentUser.userId, data as UpdateUserRequest)
      }
    },
    [modalMode, create, update, currentUser]
  )

  useEffect(() => {
    dispatch(fetchRoles())
    dispatch(fetchCompanies())
    fetchPage()
  }, [dispatch, fetchPage, globalFilter])

  return {
    users,
    currentUser,
    roles,
    companies,
    loading,
    error,
    page: currentPage,
    pageSize,
    totalCount,
    fetchOne,
    setPage,
    setPageSize: (s: number) => fetchPage(1, s),
    search,
    setSearch,
    fetchPage,
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleUser,
    agents,
    getAgents,
    globalFilter,
    setGlobalFilter,
    update,
    create
  }
}