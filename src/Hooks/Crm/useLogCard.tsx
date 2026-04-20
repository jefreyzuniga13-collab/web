import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  LogCartFormValues,
  LogCartResponseDto,
} from "@/Interfaces/Crm/LogCartInterface"
import type { ApiResponse } from "@/Interfaces/Auth/UserInterfaces"
import { logCartService } from "@/Services/Crm/LogCartService"
import { toast } from "react-toastify"

export const LOG_CART_MODAL_MODE = {
  CREATE: "CREATE",
  EDIT: "EDIT",
  VIEW: "VIEW",
} as const

export type ModalMode =
  (typeof LOG_CART_MODAL_MODE)[keyof typeof LOG_CART_MODAL_MODE]

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

  const [selectedData, setSelectedData] = useState<LogCartResponseDto>()
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
  } = useQuery<ApiResponse<LogCartResponseDto>, Error>({
    queryKey: queryKeys.detail(logCartId ?? 0),
    queryFn: () => logCartService.getByIdAsync(logCartId as number),
    enabled: typeof logCartId === "number" && logCartId > 0,
  })

  const detailData = detailResponse?.data

  const createMutation = useMutation<
    ApiResponse<LogCartResponseDto>,
    Error,
    LogCartFormValues
  >({
    mutationFn: (values) => logCartService.createAsync(values),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
      // toast.success(response.message)
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = useMutation<
    ApiResponse<LogCartResponseDto>,
    Error,
    { id: number; values: LogCartFormValues }
  >({
    mutationFn: ({ id, values }) =>
      logCartService.updateAsync(id, values),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
      queryClient.setQueryData(
        queryKeys.detail(variables.id),
        response
      )
      setSelectedData(response.data)
      toast.success(response.message)
    },
    onError: (err) => toast.error(err.message),
  })

  const toggleMutation = useMutation<
    ApiResponse<LogCartResponseDto>,
    Error,
    number
  >({
    mutationFn: (id) => logCartService.toggleAsync(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
      queryClient.setQueryData(queryKeys.detail(id), response)
      setSelectedData(response.data)
      toast.success(response.message)
    },
    onError: (err) => toast.error(err.message),
  })

  const updateStatusMutation = useMutation<
    ApiResponse<LogCartResponseDto>,
    Error,
    { id: number; statusId: number }
  >({
    mutationFn: ({ id, statusId }) =>
      logCartService.UpdatedStatusAsync(id, statusId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
      queryClient.setQueryData(
        queryKeys.detail(variables.id),
        response
      )
      setSelectedData(response.data)
      toast.success(response.message)
    },
    onError: (err) => toast.error(err.message),
  })

  const fetchAll = useCallback(async () => {
    const result = await refetchAll()
    return result.data?.data ?? []
  }, [refetchAll])

  const fetchById = useCallback(
    async (id: number) => {
      const res = await queryClient.fetchQuery<ApiResponse<LogCartResponseDto>>({
        queryKey: queryKeys.detail(id),
        queryFn: () => logCartService.getByIdAsync(id),
      })
      setSelectedData(res.data)
      return res.data
    },
    [queryClient]
  )

  const fetchByOrderId = useCallback(
    async (orderId: number) => {
      const res = await queryClient.fetchQuery<ApiResponse<LogCartResponseDto>>({
        queryKey: queryKeys.byOrder(orderId),
        queryFn: () => logCartService.getByOrderIdAsync(orderId),
      })
      setSelectedData(res.data)
      return res.data
    },
    [queryClient]
  )

  const fetchByContactId = useCallback(
    async (contactId: number) => {
      const res = await queryClient.fetchQuery<ApiResponse<LogCartResponseDto>>({
        queryKey: queryKeys.byContact(contactId),
        queryFn: () =>
          logCartService.GetByContactAndStatus(contactId),
      })
      setSelectedData(res.data)
      return res.data
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
      const res = await updateStatusMutation.mutateAsync({ id, statusId })
      return res.data
    },
    [updateStatusMutation]
  )

  const openCreate = () => {
    setSelectedData(undefined)
    setModalMode(LOG_CART_MODAL_MODE.CREATE)
    setModalOpen(true)
  }

  const openEdit = (item: LogCartResponseDto) => {
    setSelectedData(item)
    setModalMode(LOG_CART_MODAL_MODE.EDIT)
    setModalOpen(true)
  }

  const openView = (item: LogCartResponseDto) => {
    setSelectedData(item)
    setModalMode(LOG_CART_MODAL_MODE.VIEW)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedData(undefined)
    setModalMode(LOG_CART_MODAL_MODE.CREATE)
  }

  const handleSubmit = useCallback(
    async (values: LogCartFormValues) => {
      if (modalMode === LOG_CART_MODAL_MODE.CREATE) {
        await create(values)
      }

      if (
        modalMode === LOG_CART_MODAL_MODE.EDIT &&
        selectedData
      ) {
        await update(selectedData.id, values)
      }

      closeModal()
    },
    [modalMode, selectedData, create, update]
  )

  const data = listData

  const selected =
    selectedData ?? detailData ?? undefined

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
    fetchByOrderId,
    fetchByContactId,
    create,
    update,
    toggle,
    UpdatedStatus,
  }
}

export default useLogCart