/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  LogCartFormValues,
  LogCartResponseDto,
} from "@/Interfaces/Crm/LogCartInterface"
import { logCartService } from "@/Services/Crm/LogCartService"
import { toast } from "react-toastify"

type ModalMode = "create" | "edit" | "view"

const queryKeys = {
  all: ["log-cart"] as const,
  lists: () => [...queryKeys.all, "list"] as const,
  detail: (id: number) => [...queryKeys.all, "detail", id] as const,
  byOrder: (orderId: number) => [...queryKeys.all, "order", orderId] as const,
  byContact: (contactId: number) =>
    [...queryKeys.all, "contact-status", contactId] as const,
}

const useLogCart = (logCartId?: number) => {
  const queryClient = useQueryClient()
  const [selectedData, setSelectedData] = useState<LogCartResponseDto | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>("create")

  const {
    data: listData = [],
    isLoading: loadingList,
    isFetching: fetchingList,
    error: listError,
    refetch: refetchAll,
  } = useQuery<LogCartResponseDto[], Error>({
    queryKey: queryKeys.lists(),
    queryFn: () => logCartService.getAllAsync(),
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: detailData,
    isLoading: loadingDetail,
    isFetching: fetchingDetail,
    error: detailError,
  } = useQuery<LogCartResponseDto | null, Error>({
    queryKey: queryKeys.detail(logCartId ?? 0),
    queryFn: async () => {
      if (!logCartId || logCartId <= 0) return null
      return await logCartService.getByIdAsync(logCartId)
    },
    enabled: typeof logCartId === "number" && logCartId > 0,
    staleTime: 1000 * 60 * 5,
  })

  const createMutation = useMutation<LogCartResponseDto, Error, LogCartFormValues>({
    mutationFn: async (values) => {
      const payload = { ...values }
      return await logCartService.createAsync(payload)
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<LogCartResponseDto[]>(queryKeys.lists(), (prev = []) => [
        ...prev,
        newItem,
      ])
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
    onError: (err) => {
      toast.error("Error al crear el log de carrito")
      throw err
    },
  })

  const updateMutation = useMutation<
    LogCartResponseDto,
    Error,
    { id: number; values: LogCartFormValues }
  >({
    mutationFn: async ({ id, values }) => {
      const payload = { ...values }
      return await logCartService.updateAsync(id, payload)
    },
    onSuccess: (updatedItem, variables) => {
      queryClient.setQueryData<LogCartResponseDto[]>(queryKeys.lists(), (prev = []) =>
        prev.map((item) => (item.id === variables.id ? updatedItem : item))
      )
      queryClient.setQueryData(queryKeys.detail(variables.id), updatedItem)
      setSelectedData((prev) => (prev?.id === variables.id ? updatedItem : prev))
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
    onError: (err) => {
      toast.error("Error al actualizar el log de carrito")
      throw err
    },
  })

  const toggleMutation = useMutation<LogCartResponseDto, Error, number>({
    mutationFn: async (id) => await logCartService.toggleAsync(id),
    onSuccess: (updatedItem, id) => {
      queryClient.setQueryData<LogCartResponseDto[]>(queryKeys.lists(), (prev = []) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      )
      queryClient.setQueryData(queryKeys.detail(id), updatedItem)
      setSelectedData((prev) => (prev?.id === id ? updatedItem : prev))
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
    onError: (err) => {
      toast.error("Error al alternar el estado del log de carrito")
      throw err
    },
  })

  const updateStatusMutation = useMutation<
    LogCartResponseDto,
    Error,
    { id: number; statusId: number }
  >({
    mutationFn: async ({ id, statusId }) =>
      await logCartService.UpdatedStatusAsync(id, statusId),
    onSuccess: (updatedItem, variables) => {
      queryClient.setQueryData<LogCartResponseDto[]>(queryKeys.lists(), (prev = []) =>
        prev.map((item) => (item.id === variables.id ? updatedItem : item))
      )
      queryClient.setQueryData(queryKeys.detail(variables.id), updatedItem)
      setSelectedData((prev) => (prev?.id === variables.id ? updatedItem : prev))
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
    },
    onError: (err) => {
      toast.error("Error al actualizar el estado del log de carrito")
      throw err
    },
  })

  const fetchAll = useCallback(async () => {
    const result = await refetchAll()
    return result.data ?? []
  }, [refetchAll])

  const fetchById = useCallback(
    async (id: number) => {
      if (!id || id <= 0) {
        setSelectedData(null)
        return null
      }

      const item = await queryClient.fetchQuery<LogCartResponseDto>({
        queryKey: queryKeys.detail(id),
        queryFn: () => logCartService.getByIdAsync(id),
        staleTime: 1000 * 60 * 5,
      })

      setSelectedData(item)
      return item
    },
    [queryClient]
  )

  const fetchByOrderId = useCallback(
    async (orderId: number) => {
      if (!orderId || orderId <= 0) {
        setSelectedData(null)
        return null
      }

      const serviceAny = logCartService as any
      const queryFn = async () => {
        if (typeof serviceAny.getByOrderIdAsync === "function") {
          return await serviceAny.getByOrderIdAsync(orderId)
        }

        return await logCartService.getByIdAsync(orderId)
      }

      const item = await queryClient.fetchQuery<LogCartResponseDto | null>({
        queryKey: queryKeys.byOrder(orderId),
        queryFn,
        staleTime: 1000 * 60 * 5,
      })

      setSelectedData(item)
      return item
    },
    [queryClient]
  )

  const fetchByContactId = useCallback(
    async (contactId: number) => {
      if (!contactId || contactId <= 0) {
        setSelectedData(null)
        return null
      }

      const item = await queryClient.fetchQuery<LogCartResponseDto | null>({
        queryKey: queryKeys.byContact(contactId),
        queryFn: () => logCartService.GetByContactAndStatus(contactId),
        staleTime: 1000 * 60 * 2,
      })

      setSelectedData(item)
      return item
    },
    [queryClient]
  )

  const create = useCallback(
    async (values: LogCartFormValues) => {
      try {
        return await createMutation.mutateAsync(values)
      } catch {
        return null
      }
    },
    [createMutation]
  )

  const update = useCallback(
    async (id: number, values: LogCartFormValues) => {
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
        return await toggleMutation.mutateAsync(id)
      } catch {
        return null
      }
    },
    [toggleMutation]
  )

  const UpdatedStatus = useCallback(
    async (id: number, statusId: number) => {
      try {
        return await updateStatusMutation.mutateAsync({ id, statusId })
      } catch {
        return null
      }
    },
    [updateStatusMutation]
  )

  const openCreate = useCallback(() => {
    setSelectedData(null)
    setModalMode("create")
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item: LogCartResponseDto) => {
    setSelectedData(item)
    setModalMode("edit")
    setModalOpen(true)
  }, [])

  const openView = useCallback((item: LogCartResponseDto) => {
    setSelectedData(item)
    setModalMode("view")
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedData(null)
    setModalMode("create")
  }, [])

  const handleSubmit = useCallback(
    async (values: LogCartFormValues) => {
      let result: LogCartResponseDto | null = null

      if (modalMode === "create") {
        result = await create(values)
      } else if (modalMode === "edit" && selectedData) {
        result = await update(selectedData.id, values)
      }

      if (result) {
        closeModal()
      }
    },
    [modalMode, selectedData, create, update, closeModal]
  )

  const data = useMemo(() => listData, [listData])

  const selected = useMemo(() => {
    if (selectedData) return selectedData
    if (detailData) return detailData
    return null
  }, [selectedData, detailData])

  const error = useMemo(
    () =>
      createMutation.error ||
      updateMutation.error ||
      toggleMutation.error ||
      updateStatusMutation.error ||
      detailError ||
      listError ||
      null,
    [
      createMutation.error,
      updateMutation.error,
      toggleMutation.error,
      updateStatusMutation.error,
      detailError,
      listError,
    ]
  )

  const loadingMutations =
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleMutation.isPending ||
    updateStatusMutation.isPending

  const loading =
    loadingList ||
    fetchingList ||
    loadingDetail ||
    fetchingDetail ||
    loadingMutations

  return {
    data,
    selectedData: selected,
    loading,
    error,
    isModalOpen,
    modalMode,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    fetchAll,
    fetchById,
    create,
    update,
    toggle,
    fetchByOrderId,
    fetchByContactId,
    UpdatedStatus,
  }
}

export default useLogCart