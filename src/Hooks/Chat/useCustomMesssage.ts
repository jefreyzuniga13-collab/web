/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  CustomMessageRequestDto,
  CustomMessageResponseDto,
} from "@/Interfaces/Crm/CustomMessageInterface"
import { CustomMessageServices } from "@/Services/chat/CustomMessageServices"

type ModalMode = "create" | "edit" | "view"

type UseCustomMessageOptions = {
  autoLoad?: boolean
}

export const CUSTOM_MESSAGES_QUERY_KEY = ["customMessages"] as const

const normalizeError = (error: any): Error => {
  if (error instanceof Error) return error

  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Ocurrió un error al procesar los mensajes personalizados."

  return new Error(message)
}

export function useCustomMessage(options: UseCustomMessageOptions | boolean = true) {
  const normalizedOptions = useMemo<UseCustomMessageOptions>(() => {
    if (typeof options === "boolean") {
      return {
        autoLoad: options,
      }
    }

    return {
      autoLoad: options.autoLoad ?? true,
    }
  }, [options])

  const { autoLoad = true } = normalizedOptions

  const queryClient = useQueryClient()

  const [selectedCustomMessage, setSelectedCustomMessage] =
    useState<CustomMessageResponseDto | null>(null)

  const [modalMode, setModalMode] = useState<ModalMode>("create")
  const [isModalOpen, setModalOpen] = useState(false)

  const customMessagesQuery = useQuery<CustomMessageResponseDto[], Error>({
    queryKey: CUSTOM_MESSAGES_QUERY_KEY,
    queryFn: async () => {
      try {
        return await CustomMessageServices.getAllAsync()
      } catch (error: any) {
        throw normalizeError(error)
      }
    },
    enabled: autoLoad,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })

  const customMessages = customMessagesQuery.data ?? []

  const activeCustomMessages = useMemo(() => {
    return customMessages.filter((item) => item.isActive)
  }, [customMessages])

  const invalidateCustomMessages = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: CUSTOM_MESSAGES_QUERY_KEY,
    })
  }, [queryClient])

  const fetchByIdMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await CustomMessageServices.getByIdAsync(id)
      } catch (error: any) {
        throw normalizeError(error)
      }
    },
    onSuccess: (item) => {
      setSelectedCustomMessage(item)

      queryClient.setQueryData<CustomMessageResponseDto[]>(
        CUSTOM_MESSAGES_QUERY_KEY,
        (current = []) => {
          const exists = current.some((message) => message.id === item.id)

          if (exists) {
            return current.map((message) =>
              message.id === item.id ? item : message
            )
          }

          return [item, ...current]
        }
      )
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: CustomMessageRequestDto) => {
      try {
        return await CustomMessageServices.createAsync(values)
      } catch (error: any) {
        throw normalizeError(error)
      }
    },
    onSuccess: async () => {
      await invalidateCustomMessages()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (params: {
      id: number
      values: CustomMessageRequestDto
    }) => {
      try {
        return await CustomMessageServices.updateAsync(params.id, params.values)
      } catch (error: any) {
        throw normalizeError(error)
      }
    },
    onSuccess: async () => {
      await invalidateCustomMessages()
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await CustomMessageServices.toggleStatusAsync(id)
      } catch (error: any) {
        throw normalizeError(error)
      }
    },
    onSuccess: (toggled) => {
      queryClient.setQueryData<CustomMessageResponseDto[]>(
        CUSTOM_MESSAGES_QUERY_KEY,
        (current = []) =>
          current.map((item) => (item.id === toggled.id ? toggled : item))
      )

      setSelectedCustomMessage((current) => {
        if (!current) return current
        return current.id === toggled.id ? toggled : current
      })
    },
  })

  const fetchById = useCallback(
    async (id: number) => {
      return await fetchByIdMutation.mutateAsync(id)
    },
    [fetchByIdMutation]
  )

  const create = useCallback(
    async (values: CustomMessageRequestDto) => {
      await createMutation.mutateAsync(values)
    },
    [createMutation]
  )

  const update = useCallback(
    async (id: number, values: CustomMessageRequestDto) => {
      await updateMutation.mutateAsync({
        id,
        values,
      })
    },
    [updateMutation]
  )

  const toggleStatus = useCallback(
    async (id: number) => {
      await toggleMutation.mutateAsync(id)
    },
    [toggleMutation]
  )

  const openCreate = useCallback(() => {
    setSelectedCustomMessage(null)
    setModalMode("create")
    setModalOpen(true)
  }, [])

  const openEdit = useCallback(
    (id: number) => {
      const cache = customMessages.find((item) => item.id === id) || null

      setSelectedCustomMessage(cache)
      setModalMode("edit")
      setModalOpen(true)

      void fetchById(id)
    },
    [customMessages, fetchById]
  )

  const openView = useCallback(
    (id: number) => {
      const cache = customMessages.find((item) => item.id === id) || null

      setSelectedCustomMessage(cache)
      setModalMode("view")
      setModalOpen(true)

      void fetchById(id)
    },
    [customMessages, fetchById]
  )

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedCustomMessage(null)
  }, [])

  const handleSubmit = useCallback(
    async (values: CustomMessageRequestDto) => {
      if (modalMode === "create") {
        await create(values)
        closeModal()
        return
      }

      if (modalMode === "edit" && selectedCustomMessage) {
        await update(selectedCustomMessage.id, values)
        closeModal()
      }
    },
    [modalMode, selectedCustomMessage, create, update, closeModal]
  )

  const load = useCallback(async () => {
    const result = await customMessagesQuery.refetch()
    return result.data ?? []
  }, [customMessagesQuery])

  const refresh = useCallback(async () => {
    await invalidateCustomMessages()
  }, [invalidateCustomMessages])

  const insertLocal = useCallback(
    (item: CustomMessageResponseDto) => {
      queryClient.setQueryData<CustomMessageResponseDto[]>(
        CUSTOM_MESSAGES_QUERY_KEY,
        (current = []) => {
          const exists = current.some((message) => message.id === item.id)

          if (exists) {
            return current.map((message) =>
              message.id === item.id ? item : message
            )
          }

          return [item, ...current]
        }
      )
    },
    [queryClient]
  )

  const removeLocal = useCallback(
    (id: number) => {
      queryClient.setQueryData<CustomMessageResponseDto[]>(
        CUSTOM_MESSAGES_QUERY_KEY,
        (current = []) => current.filter((message) => message.id !== id)
      )
    },
    [queryClient]
  )

  const error =
    customMessagesQuery.error ||
    fetchByIdMutation.error ||
    createMutation.error ||
    updateMutation.error ||
    toggleMutation.error ||
    null

  const loadingList = customMessagesQuery.isLoading
  const loadingItem =
    fetchByIdMutation.isPending ||
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleMutation.isPending

  return {
    customMessages,
    activeCustomMessages,
    selectedCustomMessage,

    loading: loadingList || loadingItem,
    loadingList,
    loadingItem,
    error,

    modalMode,
    isModalOpen,

    loaded: customMessagesQuery.isSuccess,

    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,

    create,
    update,

    toggleSystemParam: toggleStatus,
    toggleStatus,

    load,
    refresh,

    insertLocal,
    removeLocal,
  }
}

export default useCustomMessage