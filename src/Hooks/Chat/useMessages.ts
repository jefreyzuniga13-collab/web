import { useCallback, useEffect, useMemo } from "react"
import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { getMessages } from "@/Services/chat/MessageService"
import type { NewMessagePayload } from "@/Services/signalr"
import { useSignalR } from "@/Context/SignalRContext"

import type { MessageDto } from "@/Interfaces/Chat/ChatInterfaces"
import type { PagedResponse } from "@/Interfaces/Common/GlobalInterface"

type UseMessagesResult = {
  messages: MessageDto[]
  loading: boolean
  error: string | null
  fetchOlderMessages: () => Promise<void>
  hasMoreMessages: boolean
  isFetchingOlderMessages: boolean
}

type MessagesInfiniteData = InfiniteData<
  PagedResponse<MessageDto>,
  number
>

const DEFAULT_PAGE_SIZE = 10

const MEDIA_MESSAGE_TYPES = new Set([
  "Image",
  "Video",
  "Audio",
  "Sticker",
  "Document",
])

const buildMessageKey = (
  conversationId: number,
  validFrom: Date | null,
  validTo: Date | null,
  agentId: number
) => {
  return [
    "chat-messages",
    conversationId,
    validFrom?.toISOString() ?? "",
    validTo?.toISOString() ?? "",
    agentId,
  ] as const
}

const getMessageTime = (message: MessageDto): number => {
  const time = new Date(message.sentAt).getTime()

  return Number.isNaN(time) ? 0 : time
}

const compareMessages = (
  first: MessageDto,
  second: MessageDto
): number => {
  const timeDifference =
    getMessageTime(first) - getMessageTime(second)

  if (timeDifference !== 0) {
    return timeDifference
  }

  return first.messageId - second.messageId
}

const mergeMessageData = (
  current: MessageDto,
  next: MessageDto
): MessageDto => {
  return {
    ...current,
    ...next,

    // Los eventos de estado pueden no incluir adjuntos.
    attachments:
      Array.isArray(next.attachments) &&
      next.attachments.length > 0
        ? next.attachments
        : current.attachments ?? [],

    contact:
      Array.isArray(next.contact) &&
      next.contact.length > 0
        ? next.contact
        : current.contact ?? [],

    referral:
      next.referral ??
      current.referral ??
      null,

    repliedMessage:
      next.repliedMessage ??
      current.repliedMessage ??
      null,
  }
}

const normalizeRealtimeMessage = (
  payload: NewMessagePayload
): MessageDto => {
  const messageAttachments =
    Array.isArray(payload.message.attachments)
      ? payload.message.attachments
      : []

  const payloadAttachments =
    Array.isArray(payload.attachments)
      ? payload.attachments
      : []

  return {
    ...payload.message,

    // Conserva los adjuntos incluidos directamente en el mensaje.
    attachments:
      payloadAttachments.length > 0
        ? payloadAttachments
        : messageAttachments,

    contact: Array.isArray(payload.message.contact)
      ? payload.message.contact
      : [],

    referral: payload.message.referral ?? null,
  }
}

const mergeMessage = (
  currentMessages: MessageDto[],
  nextMessage: MessageDto
): MessageDto[] => {
  const exists = currentMessages.some(
    (message) =>
      message.messageId === nextMessage.messageId
  )

  const merged = exists
    ? currentMessages.map((message) =>
        message.messageId === nextMessage.messageId
          ? mergeMessageData(message, nextMessage)
          : message
      )
    : [...currentMessages, nextMessage]

  return merged.sort(compareMessages)
}

const flattenPages = (
  pages: PagedResponse<MessageDto>[]
): MessageDto[] => {
  /*
   * Las páginas llegan desde la más reciente hacia las antiguas.
   * Se invierten para construir el historial cronológicamente.
   */
  const orderedMessages = [...pages]
    .reverse()
    .flatMap((page) => page.items)

  const uniqueMessages = new Map<number, MessageDto>()

  orderedMessages.forEach((message) => {
    const current = uniqueMessages.get(message.messageId)

    uniqueMessages.set(
      message.messageId,
      current
        ? mergeMessageData(current, message)
        : message
    )
  })

  return Array.from(uniqueMessages.values()).sort(
    compareMessages
  )
}

const createPageWithMessage = (
  message: MessageDto
): PagedResponse<MessageDto> => {
  return {
    items: [message],
    meta: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    },
  }
}

const updateMessageInPages = (
  current: MessagesInfiniteData,
  updatedMessage: MessageDto
): MessagesInfiniteData => {
  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.map((message) =>
        message.messageId === updatedMessage.messageId
          ? mergeMessageData(message, updatedMessage)
          : message
      ),
    })),
  }
}

const upsertRealtimeMessage = (
  current: MessagesInfiniteData,
  nextMessage: MessageDto
): MessagesInfiniteData => {
  if (current.pages.length === 0) {
    return {
      pages: [createPageWithMessage(nextMessage)],
      pageParams: [1],
    }
  }

  const existingPageIndex = current.pages.findIndex(
    (page) =>
      page.items.some(
        (message) =>
          message.messageId === nextMessage.messageId
      )
  )

  // Actualiza el mensaje donde ya se encuentra.
  if (existingPageIndex >= 0) {
    return {
      ...current,
      pages: current.pages.map((page, index) =>
        index === existingPageIndex
          ? {
              ...page,
              items: mergeMessage(
                page.items,
                nextMessage
              ),
            }
          : page
      ),
    }
  }

  const currentTotalCount = Math.max(
    0,
    ...current.pages.map(
      (page) => page.meta.totalCount
    )
  )

  const totalCount = currentTotalCount + 1
  const pageSize =
    current.pages[0]?.meta.pageSize ||
    DEFAULT_PAGE_SIZE

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize)
  )

  /*
   * Todas las páginas comparten los mismos totales.
   * Esto evita que getNextPageParam use metadatos antiguos.
   */
  const updatedPages = current.pages.map(
    (page) => ({
      ...page,
      meta: {
        ...page.meta,
        totalCount,
        totalPages,
      },
    })
  )

  const latestPage = updatedPages[0]

  updatedPages[0] = {
    ...latestPage,
    items: mergeMessage(
      latestPage.items,
      nextMessage
    ),
  }

  return {
    ...current,
    pages: updatedPages,
  }
}

const useMessages = (
  validFrom: Date | null = null,
  validTo: Date | null = null,
  agentId: number = 0,
  conversationId: number | null = null
): UseMessagesResult => {
  const queryClient = useQueryClient()

  const currentConversationId =
    conversationId ?? 0

  const currentAgentId =
    agentId > 0 ? agentId : 0

  const {
    joinConversation,
    leaveConversation,
    onNewMessage,
    offNewMessage,
    onMessageStatusChanged,
    offMessageStatusChanged,
  } = useSignalR()

  const queryKey = useMemo(
    () =>
      buildMessageKey(
        currentConversationId,
        validFrom,
        validTo,
        currentAgentId
      ),
    [
      currentConversationId,
      validFrom,
      validTo,
      currentAgentId,
    ]
  )

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    enabled: currentConversationId > 0,
    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      return getMessages({
        conversationId:
          currentConversationId,
        validFrom,
        validTo,
        agentId: currentAgentId,
        pageNumber: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
      })
    },

    // Página 1 contiene los mensajes más recientes.
    getNextPageParam: (lastPage) => {
      const currentPage =
        lastPage.meta.currentPage

      const totalPages =
        lastPage.meta.totalPages

      if (currentPage >= totalPages) {
        return undefined
      }

      return currentPage + 1
    },

    refetchOnWindowFocus: false,
    staleTime: 15_000,
    gcTime: 60_000,
    retry: 1,
  })

  const messages = useMemo(() => {
    return flattenPages(data?.pages ?? [])
  }, [data?.pages])

  const fetchOlderMessages =
    useCallback(async () => {
      if (
        !hasNextPage ||
        isFetchingNextPage
      ) {
        return
      }

      await fetchNextPage()
    }, [
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    ])

  const receiveHandler = useCallback(
    (payload: NewMessagePayload) => {
      const nextMessage =
        normalizeRealtimeMessage(payload)

      if (
        nextMessage.conversationId !==
        currentConversationId
      ) {
        return
      }

      const senderUserId = Number(
        nextMessage.senderUserId ?? 0
      )

      // Respeta el filtro de agente.
      if (
        currentAgentId > 0 &&
        senderUserId !== currentAgentId
      ) {
        return
      }

      queryClient.setQueryData<
        MessagesInfiniteData
      >(
        queryKey,
        (current) => {
          if (!current) {
            return {
              pages: [
                createPageWithMessage(
                  nextMessage
                ),
              ],
              pageParams: [1],
            }
          }

          return upsertRealtimeMessage(
            current,
            nextMessage
          )
        }
      )

      const requiresMediaRefresh =
        MEDIA_MESSAGE_TYPES.has(
          nextMessage.messageType
        ) &&
        nextMessage.attachments.length === 0

      if (requiresMediaRefresh) {
        void queryClient.invalidateQueries({
          queryKey,
        })
      }
    },
    [
      currentConversationId,
      currentAgentId,
      queryClient,
      queryKey,
    ]
  )

  const statusHandler = useCallback(
    (updatedMessage: MessageDto) => {
      if (
        updatedMessage.conversationId !==
        currentConversationId
      ) {
        return
      }

      queryClient.setQueryData<
        MessagesInfiniteData
      >(
        queryKey,
        (current) => {
          if (!current) return current

          return updateMessageInPages(
            current,
            updatedMessage
          )
        }
      )
    },
    [
      currentConversationId,
      queryClient,
      queryKey,
    ]
  )

  useEffect(() => {
    if (currentConversationId <= 0) {
      return
    }

    let cancelled = false

    onNewMessage(receiveHandler)
    onMessageStatusChanged(statusHandler)

    const joinCurrentConversation =
      async () => {
        try {
          await joinConversation(
            currentConversationId
          )

          /*
           * Evita quedar unido cuando el componente
           * se desmonta antes de terminar el join.
           */
          if (cancelled) {
            await leaveConversation(
              currentConversationId
            )
          }
        } catch (connectionError) {
          console.error(
            "[useMessages] No se pudo unir a la conversación.",
            connectionError
          )
        }
      }

    void joinCurrentConversation()

    return () => {
      cancelled = true

      offNewMessage(receiveHandler)
      offMessageStatusChanged(
        statusHandler
      )

      void leaveConversation(
        currentConversationId
      ).catch((connectionError) => {
        console.error(
          "[useMessages] No se pudo abandonar la conversación.",
          connectionError
        )
      })
    }
  }, [
    currentConversationId,
    joinConversation,
    leaveConversation,
    onNewMessage,
    offNewMessage,
    onMessageStatusChanged,
    offMessageStatusChanged,
    receiveHandler,
    statusHandler,
  ])

  return {
    messages,
    loading: isLoading,
    error:
      error instanceof Error
        ? error.message
        : null,
    fetchOlderMessages,
    hasMoreMessages:
      Boolean(hasNextPage),
    isFetchingOlderMessages:
      isFetchingNextPage,
  }
}

export default useMessages