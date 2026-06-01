/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ContactLogInterface, ContactFormValues } from '@/Interfaces/Auth/ContactInterface'
import { contactService } from '@/Services/auth/ContactService'
import type { PagedResponse } from '@/Interfaces/Common/GlobalInterface'
import { toast } from 'react-toastify'

type ModalMode = 'create' | 'edit' | 'view'

const contactKeys = {
  all: ['contacts'] as const,
  list: (filter: string, page: number, pageSize: number) =>
    [...contactKeys.all, 'list', filter, page, pageSize] as const,
  verified: (page: number, pageSize: number) =>
    [...contactKeys.all, 'verified', page, pageSize] as const,
  detail: (id: number) => [...contactKeys.all, 'detail', id] as const,
  phone: (phone: string) => [...contactKeys.all, 'phone', phone] as const,
  byClient: (clientId: string, page: number, pageSize: number) =>
    [...contactKeys.all, 'client', clientId, page, pageSize] as const,
  byClientCode: (clientCode: string, page: number, pageSize: number) =>
    [...contactKeys.all, 'client-code', clientCode, page, pageSize] as const,
}

const useContact = (contactId?: number) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedData, setSelectedData] = useState<ContactLogInterface | null>(null)
  const [contactByClient, setContactByClient] = useState<ContactLogInterface[]>([])
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [isModalOpen, setModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [page, setPageState] = useState(1)
  const [pageSize, setPageSizeState] = useState(30)

  const {
    data: pagedContacts,
    isLoading: loadingList,
    isFetching: fetchingList,
    error: listError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    refetch: refetchPage,
  } = useQuery<PagedResponse<ContactLogInterface>, Error>({
    queryKey: contactKeys.list(globalFilter, page, pageSize),
    queryFn: () => contactService.getAllAsync(globalFilter, page, pageSize),
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: verifiedPagedContacts,
    isLoading: loadingVerified,
    isFetching: fetchingVerified,
    error: verifiedError,
  } = useQuery<PagedResponse<ContactLogInterface>, Error>({
    queryKey: contactKeys.verified(page, pageSize),
    queryFn: () => contactService.getAllVerifiedAsync(page, pageSize),
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: detailData,
    isLoading: loadingDetail,
    isFetching: fetchingDetail,
    error: detailError,
  } = useQuery<ContactLogInterface | null, Error>({
    queryKey: contactKeys.detail(contactId ?? 0),
    queryFn: async () => {
      if (!contactId || contactId <= 0) return null
      return await contactService.getContactByIdAsync(contactId)
    },
    enabled: typeof contactId === 'number' && contactId > 0,
    staleTime: 1000 * 60 * 5,
  })

  const createMutation = useMutation<ContactLogInterface, Error, ContactFormValues>({
    mutationFn: async values => {
      const payload = { ...values } as ContactLogInterface
      return await contactService.createAsync(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contactKeys.all })
    },
    onError: err => {
      toast.error('Error al crear el contacto')
      throw err
    },
  })

  const updateMutation = useMutation<
    ContactLogInterface,
    Error,
    { id: number; values: ContactFormValues }
  >({
    mutationFn: async ({ id, values }) => {
      const payload = { ...(selectedData ?? {}), ...values, id } as ContactLogInterface
      return await contactService.updateContactAsync(payload)
    },
    onSuccess: async (updatedItem, variables) => {
      queryClient.setQueryData<ContactLogInterface>(contactKeys.detail(variables.id), updatedItem)
      setSelectedData(prev => (prev?.id === variables.id ? updatedItem : prev))
      await queryClient.invalidateQueries({ queryKey: contactKeys.all })
    },
    onError: err => {
      toast.error('Error al actualizar el contacto')
      throw err
    },
  })

  const toggleMutation = useMutation<void, Error, number>({
    mutationFn: async id => {
      await contactService.toggleAsync(id)
    },
    onSuccess: async (_, id) => {
      queryClient.setQueriesData<PagedResponse<ContactLogInterface>>(
        { queryKey: contactKeys.all },
        old => {
          if (!old?.items) return old

          return {
            ...old,
            items: old.items.map(item =>
              item.id === id ? { ...item, isActive: !item.isActive } : item
            ),
          }
        }
      )

      setSelectedData(prev =>
        prev?.id === id ? { ...prev, isActive: !prev.isActive } : prev
      )

      await queryClient.invalidateQueries({ queryKey: contactKeys.all })
    },
    onError: err => {
      toast.error('Error al alternar el estado del contacto')
      throw err
    },
  })

  const updateEcommerceUserMutation = useMutation<any, Error, { id: number; ecommerceUserId: number }>({
    mutationFn: async ({ id, ecommerceUserId }) =>
      await contactService.UpdateEcommerceUser(id, ecommerceUserId),
    onError: err => {
      toast.error('Error al actualizar el usuario ecommerce del contacto')
      throw err
    },
  })

  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setPageState(p)
      setPageSizeState(s)

      const result = await queryClient.fetchQuery<PagedResponse<ContactLogInterface>>({
        queryKey: contactKeys.list(globalFilter, p, s),
        queryFn: () => contactService.getAllAsync(globalFilter, p, s),
        staleTime: 1000 * 60 * 5,
      })

      await queryClient.prefetchQuery({
        queryKey: contactKeys.verified(p, s),
        queryFn: () => contactService.getAllVerifiedAsync(p, s),
        staleTime: 1000 * 60 * 5,
      })

      return result
    },
    [globalFilter, page, pageSize, queryClient]
  )

  const getByClient = useCallback(
    async (clientId: string, p = page, s = pageSize) => {
      try {
        setPageState(p)
        setPageSizeState(s)

        const res = await queryClient.fetchQuery<PagedResponse<ContactLogInterface>>({
          queryKey: contactKeys.byClient(clientId, p, s),
          queryFn: () => contactService.getContactByClientAsync(clientId, p, s),
          staleTime: 1000 * 60 * 5,
        })

        setContactByClient(res.items)
        return res
      } catch {
        return null
      }
    },
    [page, pageSize, queryClient]
  )

  const getByClientCode = useCallback(
    async (clientCode: string, p = page, s = pageSize) => {
      try {
        setPageState(p)
        setPageSizeState(s)

        const res = await queryClient.fetchQuery<PagedResponse<ContactLogInterface>>({
          queryKey: contactKeys.byClientCode(clientCode, p, s),
          queryFn: () => contactService.getContactByClientCodeAsync(clientCode, p, s),
          staleTime: 1000 * 60 * 5,
        })

        setContactByClient(res.items)
        return res
      } catch {
        return null
      }
    },
    [page, pageSize, queryClient]
  )

  const getById = useCallback(
    async (id: number) => {
      try {
        const res = await contactService.getById(id)

        if (res.success) {
          setSelectedData(res.data)
          queryClient.setQueryData(contactKeys.detail(id), res.data)
          return res.data
        }

        toast.error(res.message)
        return null
      } catch (err: any) {
        toast.error(err?.message ?? 'Error al obtener el contacto')
        return null
      }
    },
    [queryClient]
  )

  const fetchById = useCallback(
    async (id: number) => {
      if (!id || id <= 0) {
        setSelectedData(null)
        return null
      }

      try {
        const item = await queryClient.fetchQuery<ContactLogInterface>({
          queryKey: contactKeys.detail(id),
          queryFn: () => contactService.getContactByIdAsync(id),
          staleTime: 1000 * 60 * 5,
        })

        setSelectedData(item)
        return item
      } catch {
        return null
      }
    },
    [queryClient]
  )

  const fetchByPhone = useCallback(
    async (phone: string) => {
      if (!phone?.trim()) {
        setSelectedData(null)
        return null
      }

      try {
        const item = await queryClient.fetchQuery<ContactLogInterface>({
          queryKey: contactKeys.phone(phone),
          queryFn: () => contactService.getContactByPhoneAsync(phone),
          staleTime: 1000 * 60 * 5,
        })

        setSelectedData(item)
        return item
      } catch {
        return null
      }
    },
    [queryClient]
  )

  const create = useCallback(
    async (values: ContactFormValues) => {
      try {
        return await createMutation.mutateAsync(values)
      } catch {
        return null
      }
    },
    [createMutation]
  )

  const update = useCallback(
    async (id: number, values: ContactFormValues) => {
      try {
        return await updateMutation.mutateAsync({ id, values })
      } catch {
        return null
      }
    },
    [updateMutation]
  )

  const toggle = useCallback(
    async (id: number) => {
      try {
        await toggleMutation.mutateAsync(id)
        return true
      } catch {
        return false
      }
    },
    [toggleMutation]
  )

  const UpdateEcommerceUserAsync = useCallback(
    async (id: number, ecommerceUserId: number) => {
      try {
        return await updateEcommerceUserMutation.mutateAsync({ id, ecommerceUserId })
      } catch {
        return null
      }
    },
    [updateEcommerceUserMutation]
  )

  const verify = useCallback(
    async (id: number) => {
      navigate(`/verify-contact/${id}`)
      return true
    },
    [navigate]
  )

  const openCreate = useCallback(() => {
    setSelectedData(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item: ContactLogInterface) => {
    setSelectedData(item)
    setModalMode('edit')
    setModalOpen(true)
  }, [])

  const openView = useCallback((item: ContactLogInterface) => {
    setSelectedData(item)
    setModalMode('view')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedData(null)
    setModalMode('create')
  }, [])

  const handleSubmit = useCallback(
    async (values: ContactFormValues) => {
      let result: ContactLogInterface | null = null

      if (modalMode === 'create') {
        result = await create(values)
      } else if (modalMode === 'edit' && selectedData) {
        result = await update(selectedData.id as number, values)
      }

      if (result) {
        closeModal()
      }
    },
    [modalMode, selectedData, create, update, closeModal]
  )

  useEffect(() => {
    if (typeof contactId !== 'number' || contactId <= 0) {
      setSelectedData(null)
      return
    }

    if (detailData) {
      setSelectedData(detailData)
    }
  }, [contactId, detailData])

  const data = useMemo(() => pagedContacts?.items ?? [], [pagedContacts])
  const verifiedContact = useMemo(
    () => verifiedPagedContacts?.items ?? [],
    [verifiedPagedContacts]
  )

  const totalCount = pagedContacts?.meta.totalCount ?? 0

  const loadingMutations =
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleMutation.isPending ||
    updateEcommerceUserMutation.isPending

  const loading =
    loadingList ||
    fetchingList ||
    loadingVerified ||
    fetchingVerified ||
    loadingDetail ||
    fetchingDetail ||
    loadingMutations

  const error = useMemo(
    () =>
      createMutation.error ||
      updateMutation.error ||
      toggleMutation.error ||
      updateEcommerceUserMutation.error ||
      detailError ||
      verifiedError ||
      listError ||
      null,
    [
      createMutation.error,
      updateMutation.error,
      toggleMutation.error,
      updateEcommerceUserMutation.error,
      detailError,
      verifiedError,
      listError,
    ]
  )

  return {
    data,
    verifiedContact,
    selectedData,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    isModalOpen,
    modalMode,
    globalFilter,
    setPage: (p: number) => {
      setPageState(p)
    },
    setPageSize: (s: number) => {
      setPageSizeState(s)
      setPageState(1)
    },
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    fetchPage,
    fetchById,
    fetchByPhone,
    getByClient,
    create,
    update,
    toggle,
    verify,
    setGlobalFilter,
    getByClientCode,
    contactByClient,
    UpdateEcommerceUserAsync,
    getById,
  }
}

export default useContact