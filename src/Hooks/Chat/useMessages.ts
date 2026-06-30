import { useCallback, useEffect, useMemo } from "react"
import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { getMessages } from "@/Services/chat/MessageService"
import { useSignalR } from "@/Context/SignalRContext"
import type {
  MessageDto,
  AttachmentDto,
} from "@/Interfaces/Chat/ChatInterfaces"
import type { PagedResponse } from "@/Interfaces/Common/GlobalInterface"

type NewMessagePayload = {
  message: MessageDto
  attachments?: AttachmentDto[]
}

type UseMessagesResult = {
  messages: MessageDto[]
  loading: boolean
  error: string | null
  fetchOlderMessages: () => Promise<void>
  hasMoreMessages: boolean
  isFetchingOlderMessages: boolean
}

type MessagesInfiniteData = InfiniteData<PagedResponse<MessageDto>, number>

const DEFAULT_PAGE_SIZE = 10

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

const mergeMessage = (
  currentMessages: MessageDto[],
  nextMessage: MessageDto
): MessageDto[] => {
  const exists = currentMessages.some(
    (message) => message.messageId === nextMessage.messageId
  )

  const merged = exists
    ? currentMessages.map((message) =>
        message.messageId === nextMessage.messageId
          ? { ...message, ...nextMessage }
          : message
      )
    : [...currentMessages, nextMessage]

  return merged.sort((a, b) => getMessageTime(a) - getMessageTime(b))
}

const flattenPages = (
  pages: PagedResponse<MessageDto>[]
): MessageDto[] => {
  const orderedMessages = [...pages]
    .reverse()
    .flatMap((page) => page.items)

  const uniqueMessages = new Map<number, MessageDto>()

  orderedMessages.forEach((message) => {
    uniqueMessages.set(message.messageId, message)
  })

  return Array.from(uniqueMessages.values()).sort(
    (a, b) => getMessageTime(a) - getMessageTime(b)
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

const upsertMessageInLatestPage = (
  page: PagedResponse<MessageDto>,
  message: MessageDto
): PagedResponse<MessageDto> => {
  const alreadyExists = page.items.some(
    (item) => item.messageId === message.messageId
  )

  return {
    ...page,
    items: mergeMessage(page.items, message),
    meta: {
      ...page.meta,
      totalCount: alreadyExists
        ? page.meta.totalCount
        : page.meta.totalCount + 1,
    },
  }
}

const useMessages = (
  validFrom: Date | null = null,
  validTo: Date | null = null,
  agentId: number = 0,
  conversationId: number | null = null
): UseMessagesResult => {
  const queryClient = useQueryClient()
  const currentConversationId = conversationId ?? 0
  const currentAgentId = agentId > 0 ? agentId : 0

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
    [currentConversationId, validFrom, validTo, currentAgentId]
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
        conversationId: currentConversationId,
        validFrom,
        validTo,
        agentId: currentAgentId,
        pageNumber: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
      })
    },

    // Page 1 debe ser la página más reciente.
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.meta.currentPage
      const totalPages = lastPage.meta.totalPages

      if (currentPage >= totalPages) return null

      return currentPage + 1
    },

    // Evita recargas innecesarias al cambiar de ventana.
    refetchOnWindowFocus: false,

    // Cache corto para chats.
    staleTime: 15_000,
    gcTime: 60_000,

    // Evita reintentos excesivos.
    // retry: 1,
  })

  const messages = useMemo(() => {
    return flattenPages(data?.pages ?? [])
  }, [data?.pages])

  const fetchOlderMessages = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return

    await fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const receiveHandler = useCallback(
    (payload: NewMessagePayload) => {
      const { message } = payload

      if (message.conversationId !== currentConversationId) return

      const attachments = payload.attachments ?? []
      const senderUserId = Number(message.senderUserId ?? 0)

      // Respeta filtro de agente.
      if (currentAgentId > 0 && senderUserId !== currentAgentId) return

      const nextMessage: MessageDto = {
        ...message,
        attachments,
      }

      queryClient.setQueryData<MessagesInfiniteData>(queryKey, (current) => {
        if (!current) {
          return {
            pages: [createPageWithMessage(nextMessage)],
            pageParams: [1],
          }
        }

        const [latestPage, ...oldPages] = current.pages

        if (!latestPage) {
          return {
            ...current,
            pages: [createPageWithMessage(nextMessage)],
          }
        }

        return {
          ...current,
          pages: [
            upsertMessageInLatestPage(latestPage, nextMessage),
            ...oldPages,
          ],
        }
      })

      if (message.messageType !== "Text" && attachments.length === 0) {
        // Recarga cuando llega media sin adjuntos.
        void queryClient.invalidateQueries({ queryKey })
      }
    },
    [currentConversationId, currentAgentId, queryClient, queryKey]
  )

  const statusHandler = useCallback(
    (updated: MessageDto) => {
      if (updated.conversationId !== currentConversationId) return

      queryClient.setQueryData<MessagesInfiniteData>(queryKey, (current) => {
        if (!current) return current

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((message) =>
              message.messageId === updated.messageId
                ? { ...message, ...updated }
                : message
            ),
          })),
        }
      })
    },
    [currentConversationId, queryClient, queryKey]
  )

  useEffect(() => {
    if (currentConversationId <= 0) return

    joinConversation(currentConversationId)
    onNewMessage(receiveHandler)
    onMessageStatusChanged(statusHandler)

    return () => {
      leaveConversation(currentConversationId)
      offNewMessage(receiveHandler)
      offMessageStatusChanged(statusHandler)
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
    error: error instanceof Error ? error.message : null,
    fetchOlderMessages,
    hasMoreMessages: Boolean(hasNextPage),
    isFetchingOlderMessages: isFetchingNextPage,
  }
}

export default useMessages