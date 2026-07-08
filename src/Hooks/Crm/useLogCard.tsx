import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery,useQueryClient} from "@tanstack/react-query"
import { toast } from "react-toastify"
import type {LogCartFormValues, LogCartResponseDto} from "@/Interfaces/Crm/LogCartInterface"
import type { ApiResponse } from "@/Interfaces/Auth/UserInterfaces"
import { logCartService } from "@/Services/Crm/LogCartService"

export const LOG_CART_MODAL_MODE = {
  CREATE: "CREATE",
  EDIT: "EDIT",
  VIEW: "VIEW",
} as const

export type ModalMode =
  (typeof LOG_CART_MODAL_MODE)[keyof typeof LOG_CART_MODAL_MODE]

type UseLogCartOptions = {
  enabledList?: boolean
}

const queryKeys = {
  all: ["log-cart"] as const,
  lists: () => [...queryKeys.all, "list"] as const,
  detail: (id: number) => [...queryKeys.all, "detail", id] as const,
  byOrder: (orderId: number) => [...queryKeys.all, "order", orderId] as const,
  byContact: (contactId: number) =>
    [...queryKeys.all, "contact-status", contactId] as const,
}

const useLogCart = (
  logCartId?: number,
  options?: UseLogCartOptions
) => {
  const queryClient = useQueryClient()
  const enabledList = options?.enabledList ?? false

  const [selectedData, setSelectedData] =
    useState<LogCartResponseDto | null>(null)

  const [isModalOpen, setModalOpen] = useState(false)

  const [modalMode, setModalMode] = useState<ModalMode>(
    LOG_CART_MODAL_MODE.CREATE
  )

  const {
    data: listResponse,
    isLoading: loadingList,
    isFetching: fetchingList,
    error: listError,
    refetch: refetchAll,
  } = useQuery<ApiResponse<LogCartResponseDto[]>, Error>({
    queryKey: queryKeys.lists(),
    queryFn: () => logCartService.getAllAsync(),
    enabled: enabledList,
  })

  const listData = useMemo(
    () => listResponse?.data ?? [],
    [listResponse]
  )

  const {
    data: detailResponse,
    isLoading: loadingDetail,
    isFetching: fetchingDetail,
    error: detailError,
  } = useQuery<ApiResponse<LogCartResponseDto | null>, Error>({
    queryKey: queryKeys.detail(logCartId ?? 0),
    queryFn: () => logCartService.getByIdAsync(logCartId as number),
    enabled: typeof logCartId === "number" && logCartId > 0,
  })

  const detailData = detailResponse?.data ?? null

  const invalidateLogCartQueries = useCallback(
    async (params?: {
      id?: number
      orderId?: number
      contactId?: number
      invalidateList?: boolean
    }) => {
      if (params?.invalidateList) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.lists(),
        })
      }

      if (params?.id && params.id > 0) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.detail(params.id),
        })
      }

      if (params?.orderId && params.orderId > 0) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.byOrder(params.orderId),
        })
      }

      if (params?.contactId && params.contactId > 0) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.byContact(params.contactId),
        })
      }
    },
    [queryClient]
  )

  const createMutation = useMutation<
    ApiResponse<LogCartResponseDto>,
    Error,
    LogCartFormValues
  >({
    mutationFn: (values) => logCartService.createAsync(values),
    onSuccess: async (response) => {
      setSelectedData(response.data)

      await invalidateLogCartQueries({
        id: response.data?.id,
        orderId: response.data?.orderId,
        contactId: response.data?.contactId,
        invalidateList: enabledList,
      })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const updateMutation = useMutation<
    ApiResponse<LogCartResponseDto>,
    Error,
    { id: number; values: LogCartFormValues }
  >({
    mutationFn: ({ id, values }) =>
      logCartService.updateAsync(id, values),
    onSuccess: async (response, variables) => {
      setSelectedData(response.data)

      queryClient.setQueryData(
        queryKeys.detail(variables.id),
        response
      )

      await invalidateLogCartQueries({
        id: variables.id,
        orderId: response.data?.orderId,
        contactId: response.data?.contactId,
        invalidateList: enabledList,
      })

    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const toggleMutation = useMutation<
    ApiResponse<LogCartResponseDto>,
    Error,
    number
  >({
    mutationFn: (id) => logCartService.toggleAsync(id),
    onSuccess: async (response, id) => {
      setSelectedData(response.data)

      queryClient.setQueryData(
        queryKeys.detail(id),
        response
      )

      await invalidateLogCartQueries({
        id,
        orderId: response.data?.orderId,
        contactId: response.data?.contactId,
        invalidateList: enabledList,
      })

    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const updateStatusMutation = useMutation<
    ApiResponse<LogCartResponseDto>,
    Error,
    { id: number; statusId: number }
  >({
    mutationFn: ({ id, statusId }) =>
      logCartService.UpdatedStatusAsync(id, statusId),
    onSuccess: async (response, variables) => {
      setSelectedData(response.data)

      queryClient.setQueryData(
        queryKeys.detail(variables.id),
        response
      )

      await invalidateLogCartQueries({
        id: variables.id,
        orderId: response.data?.orderId,
        contactId: response.data?.contactId,
        invalidateList: enabledList,
      })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const fetchAll = useCallback(async () => {
    const result = await refetchAll()
    return result.data?.data ?? []
  }, [refetchAll])

  const fetchById = useCallback(
    async (id: number) => {
      if (!id || id <= 0) return null

      const res = await queryClient.fetchQuery<
        ApiResponse<LogCartResponseDto | null>
      >({
        queryKey: queryKeys.detail(id),
        queryFn: () => logCartService.getByIdAsync(id),
      })

      setSelectedData(res.data ?? null)
      return res.data ?? null
    },
    [queryClient]
  )

  const fetchByOrderId = useCallback(
    async (orderId: number) => {
      if (!orderId || orderId <= 0) return null

      const res = await queryClient.fetchQuery<
        ApiResponse<LogCartResponseDto | null>
      >({
        queryKey: queryKeys.byOrder(orderId),
        queryFn: () => logCartService.getByOrderIdAsync(orderId),
      })

      setSelectedData(res.data ?? null)
      return res.data ?? null
    },
    [queryClient]
  )

  const fetchByContactId = useCallback(
    async (contactId: number) => {
      if (!contactId || contactId <= 0) return null

      const res = await queryClient.fetchQuery<
        ApiResponse<LogCartResponseDto | null>
      >({
        queryKey: queryKeys.byContact(contactId),
        queryFn: () =>
          logCartService.GetByContactAndStatus(contactId),
        staleTime: 0,
      })

      setSelectedData(res.data ?? null)
      return res.data ?? null
    },
    [queryClient]
  )

  const removeByContactCache = useCallback(
    async (contactId: number) => {
      if (!contactId || contactId <= 0) return

      await queryClient.removeQueries({
        queryKey: queryKeys.byContact(contactId),
        exact: true,
      })
    },
    [queryClient]
  )

  const invalidateByContact = useCallback(
    async (contactId: number) => {
      if (!contactId || contactId <= 0) return

      await queryClient.invalidateQueries({
        queryKey: queryKeys.byContact(contactId),
      })
    },
    [queryClient]
  )

  const create = useCallback(
    async (values: LogCartFormValues) => {
      const res = await createMutation.mutateAsync(values)
      return res.data
    },
    [createMutation]
  )

  const update = useCallback(
    async (id: number, values: LogCartFormValues) => {
      const res = await updateMutation.mutateAsync({ id, values })
      return res.data
    },
    [updateMutation]
  )

  const toggle = useCallback(
    async (id: number) => {
      const res = await toggleMutation.mutateAsync(id)
      return res.data
    },
    [toggleMutation]
  )

  const UpdatedStatus = useCallback(
    async (id: number, statusId: number) => {
      const res = await updateStatusMutation.mutateAsync({
        id,
        statusId,
      })

      return res.data
    },
    [updateStatusMutation]
  )

  const openCreate = useCallback(() => {
    setSelectedData(null)
    setModalMode(LOG_CART_MODAL_MODE.CREATE)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item: LogCartResponseDto) => {
    setSelectedData(item)
    setModalMode(LOG_CART_MODAL_MODE.EDIT)
    setModalOpen(true)
  }, [])

  const openView = useCallback((item: LogCartResponseDto) => {
    setSelectedData(item)
    setModalMode(LOG_CART_MODAL_MODE.VIEW)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedData(null)
    setModalMode(LOG_CART_MODAL_MODE.CREATE)
  }, [])

  const handleSubmit = useCallback(
    async (values: LogCartFormValues) => {
      if (modalMode === LOG_CART_MODAL_MODE.CREATE) {
        await create(values)
      }

      if (
        modalMode === LOG_CART_MODAL_MODE.EDIT &&
        selectedData?.id
      ) {
        await update(selectedData.id, values)
      }

      closeModal()
    },
    [modalMode, selectedData, create, update, closeModal]
  )

  const selected = selectedData ?? detailData ?? null

  const error =
    createMutation.error ||
    updateMutation.error ||
    toggleMutation.error ||
    updateStatusMutation.error ||
    detailError ||
    listError

  const loading =
    loadingList ||
    fetchingList ||
    loadingDetail ||
    fetchingDetail ||
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleMutation.isPending ||
    updateStatusMutation.isPending

  return {
    data: listData,
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
    fetchByOrderId,
    fetchByContactId,
    removeByContactCache,
    invalidateByContact,

    create,
    update,
    toggle,
    UpdatedStatus,
  }
}

export default useLogCart