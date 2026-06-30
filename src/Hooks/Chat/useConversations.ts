import { useState, useEffect, useCallback, useRef } from "react"
import { useSelector } from "react-redux"
import { selectIsAdmin, selectUserId } from "@/Context/Slices/Auth/authSlice"
import { useSignalR } from "@/Context/SignalRContext"
import type {
  ConversationDto,
  MessageDto,
  AttachmentDto,
} from "@/Interfaces/Chat/ChatInterfaces"
import type { PaginationInfo } from "@/Interfaces/Common/GlobalInterface"
import { joinConversation } from "@/Services/signalr"
import { ConversationService } from "@/Services/chat/ConversationService"

export type Filter =
  | "all"
  | "bot"
  | "waiting"
  | "human"
  | "closed"
  | "incomplete"
  | "paused"

export type DateField = "validFrom" | "validTo"

export interface FormInterface {
  validFrom: Date | null
  validTo: Date | null
  agentId: number
}

export interface UseConversationsResult {
  conversations: ConversationDto[]
  loading: boolean
  error: string | null
  form: FormInterface
  appliedRange: FormInterface
  handleDate: (field: DateField, date: Date | null) => void
  handleAgentChange: (agentId: number) => void
  applyDateFilter: () => void
  clearFilter: () => void
  page: number
  pageSize: number
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const DEFAULT_PAGE_SIZE = 10
const STORAGE_FROM = "convFrom"
const STORAGE_TO = "convTo"
const STORAGE_AGENT = "convAgentId"

const readStoredDate = (key: string): Date | null => {
  const value = localStorage.getItem(key)

  if (!value) return null

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

const readStoredAgentId = (): number => {
  const value = Number(localStorage.getItem(STORAGE_AGENT) ?? 0)

  return Number.isFinite(value) ? value : 0
}

const initialRange = (): FormInterface => {
  return {
    validFrom: readStoredDate(STORAGE_FROM),
    validTo: readStoredDate(STORAGE_TO),
    agentId: readStoredAgentId(),
  }
}

const saveRange = (range: FormInterface) => {
  // Persiste filtros aplicados.
  if (range.validFrom) {
    localStorage.setItem(STORAGE_FROM, range.validFrom.toISOString())
  } else {
    localStorage.removeItem(STORAGE_FROM)
  }

  if (range.validTo) {
    localStorage.setItem(STORAGE_TO, range.validTo.toISOString())
  } else {
    localStorage.removeItem(STORAGE_TO)
  }

  localStorage.setItem(STORAGE_AGENT, String(range.agentId))
}

const safeTime = (value: string | null): number => {
  if (!value) return 0

  const ts = new Date(value).getTime()

  return Number.isNaN(ts) ? 0 : ts
}

const toApiState = (filter: Filter): string => {
  return filter === "all" ? "" : filter
}

const getFilterStatus = (filter: Filter): ConversationDto["status"] | null => {
  switch (filter) {
    case "waiting":
      return "Waiting"
    case "bot":
      return "Bot"
    case "human":
      return "Human"
    case "closed":
      return "Closed"
    case "incomplete":
      return "Incomplete"
    case "paused":
      return "Paused"
    default:
      return null
  }
}

export function useConversations(
  filter: Filter = "all",
  searchConversation: string
): UseConversationsResult {
  const isAdmin = useSelector(selectIsAdmin)
  const userId = useSelector(selectUserId)

  const requestIdRef = useRef(0)

  const [form, setForm] = useState<FormInterface>(initialRange())
  const [appliedRange, setAppliedRange] = useState<FormInterface>(initialRange())
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: DEFAULT_PAGE_SIZE,
  })

  const {
    onConversationCreated,
    offConversationCreated,
    onConversationUpdated,
    offConversationUpdated,
    onNewMessage,
    offNewMessage,
    onNewHumanRequest,
    offNewHumanRequest,
  } = useSignalR()

  const activityTs = useCallback((conversation: ConversationDto) => {
    return Math.max(
      safeTime(conversation.lastActivity ?? null),
      safeTime(conversation.updatedAt ?? null),
      safeTime(conversation.clientLastMessageAt ?? null),
      safeTime(conversation.agentLastMessageAt ?? null),
      safeTime(conversation.createdAt ?? null)
    )
  }, [])

  const sortByActivity = useCallback(
    (list: ConversationDto[]) => {
      return [...list].sort((a, b) => activityTs(b) - activityTs(a))
    },
    [activityTs]
  )

  const normalizeConversation = useCallback(
    (conversation: ConversationDto): ConversationDto => {
      return {
        ...conversation,
        lastActivity:
          conversation.lastActivity ??
          conversation.clientLastMessageAt ??
          conversation.agentLastMessageAt ??
          conversation.updatedAt ??
          conversation.createdAt,
        unreadCount: conversation.unreadCount ?? 0,
      }
    },
    []
  )

  const dedupeByClientKeepNewest = useCallback(
    (list: ConversationDto[]) => {
      const map = new Map<number, ConversationDto>()

      for (const conversation of list) {
        const key = Number(
          conversation.clientContactId ?? conversation.conversationId ?? 0
        )

        const current = map.get(key)

        if (!current || activityTs(conversation) >= activityTs(current)) {
          map.set(key, conversation)
        }
      }

      return sortByActivity(Array.from(map.values()))
    },
    [activityTs, sortByActivity]
  )

  const matchesFilter = useCallback(
    (conversation: ConversationDto) => {
      const expectedStatus = getFilterStatus(filter)

      if (!expectedStatus) return true

      return conversation.status === expectedStatus
    },
    [filter]
  )

  const mergeConversation = useCallback(
    (current: ConversationDto | null, updated: ConversationDto): ConversationDto => {
      // Conserva datos previos cuando SignalR envía payload parcial.
      const merged = {
        ...current,
        ...updated,

        assignedAgentId:
          updated.assignedAgentId ?? current?.assignedAgentId ?? 0,

        assignedByUserId:
          updated.assignedByUserId ?? current?.assignedByUserId ?? 0,

        clientContactId:
          updated.clientContactId ?? current?.clientContactId ?? 0,

        lastActivity:
          updated.lastActivity ??
          updated.clientLastMessageAt ??
          updated.agentLastMessageAt ??
          updated.updatedAt ??
          current?.lastActivity ??
          current?.clientLastMessageAt ??
          current?.agentLastMessageAt ??
          current?.updatedAt ??
          current?.createdAt ??
          updated.createdAt,

        contactClassificationName:
          updated.contactClassificationName ??
          current?.contactClassificationName,

        contactClassificationBgColor:
          updated.contactClassificationBgColor ??
          current?.contactClassificationBgColor,

        unreadCount: updated.unreadCount ?? current?.unreadCount ?? 0,
        unreadForAgent: updated.unreadForAgent ?? current?.unreadForAgent ?? 0,
        unreadForAssigner:
          updated.unreadForAssigner ?? current?.unreadForAssigner ?? 0,
      } as ConversationDto

      return normalizeConversation(merged)
    },
    [normalizeConversation]
  )

  const handleHumanRequest = useCallback(
    (payload: { conversationId: number }) => {
      setConversations((prev) => {
        const next = prev.map((conversation) => {
          if (conversation.conversationId !== payload.conversationId) {
            return conversation
          }

          return normalizeConversation({
            ...conversation,
            status: "Human",
            lastActivity:
              conversation.lastActivity ??
              conversation.updatedAt ??
              conversation.clientLastMessageAt ??
              conversation.createdAt,
          })
        })

        return sortByActivity(next)
      })
    },
    [normalizeConversation, sortByActivity]
  )

  const handleUpdatedConvo = useCallback(
    (updated: ConversationDto) => {
      const normalizedUpdated = normalizeConversation(updated)

      setConversations((prev) => {
        const current =
          prev.find(
            (conversation) =>
              conversation.conversationId === normalizedUpdated.conversationId
          ) ?? null

        const mergedConversation = mergeConversation(current, normalizedUpdated)

        void joinConversation(mergedConversation.conversationId)

        const base = prev.filter(
          (conversation) =>
            conversation.conversationId !== mergedConversation.conversationId &&
            conversation.clientContactId !== mergedConversation.clientContactId
        )

        const merged = matchesFilter(mergedConversation)
          ? [mergedConversation, ...base]
          : base

        return dedupeByClientKeepNewest(merged)
      })
    },
    [
      dedupeByClientKeepNewest,
      matchesFilter,
      mergeConversation,
      normalizeConversation,
    ]
  )

  const handleNewMessage = useCallback(
    (payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
      const message = payload.message

      setConversations((prev) => {
        const exists = prev.some(
          (conversation) =>
            conversation.conversationId === message.conversationId
        )

        if (!exists) return prev

        const updated = prev.map((conversation) => {
          if (conversation.conversationId !== message.conversationId) {
            return conversation
          }

          const isAssignedToMe =
            Number(conversation.assignedAgentId ?? 0) === Number(userId)

          const senderIsUser = Number(message.senderUserId ?? 0) > 0

          const unreadForAgent =
            senderIsUser || !isAssignedToMe
              ? conversation.unreadForAgent ?? 0
              : (conversation.unreadForAgent ?? 0) + 1

          const unreadForAssigner =
            senderIsUser || isAssignedToMe
              ? conversation.unreadForAssigner ?? 0
              : (conversation.unreadForAssigner ?? 0) + 1

          return normalizeConversation({
            ...conversation,
            totalMessages: (conversation.totalMessages ?? 0) + 1,
            updatedAt: message.sentAt ?? conversation.updatedAt,
            lastActivity:
              message.sentAt ??
              conversation.lastActivity ??
              conversation.updatedAt ??
              conversation.createdAt,
            clientLastMessageAt: senderIsUser
              ? conversation.clientLastMessageAt
              : message.sentAt ?? conversation.clientLastMessageAt,
            agentLastMessageAt: senderIsUser
              ? message.sentAt ?? conversation.agentLastMessageAt
              : conversation.agentLastMessageAt,
            unreadCount: (conversation.unreadCount ?? 0) + 1,
            unreadForAgent,
            unreadForAssigner,
          })
        })

        return dedupeByClientKeepNewest(updated)
      })
    },
    [dedupeByClientKeepNewest, normalizeConversation, userId]
  )

  const handleNewConvo = useCallback(
    (newConversation: ConversationDto) => {
      const normalized = normalizeConversation(newConversation)

      if (!matchesFilter(normalized)) return

      void joinConversation(normalized.conversationId)

      setConversations((prev) => {
        const base = prev.filter(
          (conversation) =>
            conversation.clientContactId !== normalized.clientContactId
        )

        return dedupeByClientKeepNewest([normalized, ...base])
      })
    },
    [dedupeByClientKeepNewest, matchesFilter, normalizeConversation]
  )

  const handleDate = useCallback((field: DateField, date: Date | null) => {
    setForm((current) => ({
      ...current,
      [field]: date,
    }))
  }, [])

  const handleAgentChange = useCallback((agentId: number) => {
    setForm((current) => ({
      ...current,
      agentId,
    }))
  }, [])

  const applyDateFilter = useCallback(() => {
    const nextRange: FormInterface = {
      validFrom: form.validFrom ? new Date(form.validFrom) : null,
      validTo: form.validTo ? new Date(form.validTo) : null,
      agentId: form.agentId,
    }

    saveRange(nextRange)

    setAppliedRange(nextRange)
    setConversations([])
    setPage(1)
  }, [form])

  const clearFilter = useCallback(() => {
    const cleanRange: FormInterface = {
      validFrom: null,
      validTo: null,
      agentId: 0,
    }

    saveRange(cleanRange)

    setForm(cleanRange)
    setAppliedRange(cleanRange)
    setConversations([])
    setPage(1)
  }, [])

useEffect(() => {
  setPage(1)
}, [filter, searchConversation])

  useEffect(() => {
    const requestId = ++requestIdRef.current
    let cancelled = false

    setLoading(true)
    setError(null)

    ConversationService.getConversationsByRole(
      appliedRange.agentId,
      appliedRange.validFrom,
      appliedRange.validTo,
      searchConversation,
      page,
      pageSize,
      toApiState(filter)
    )
      .then((res) => {
        // Evita que una respuesta vieja sobrescriba la lista actual.
        if (cancelled || requestId !== requestIdRef.current) return

        const items = res.items.map((conversation) =>
          normalizeConversation({
            ...conversation,
            unreadCount: conversation.unreadCount ?? 0,
          })
        )

        setPagination({
          currentPage: res.meta.currentPage,
          totalPages: res.meta.totalPages,
          totalItems: res.meta.totalCount,
          itemsPerPage: res.meta.pageSize,
        })

        setConversations((prev) => {
          const base = page === 1 ? [] : prev
          const merged = [...base, ...items]

          return dedupeByClientKeepNewest(merged)
        })

        items.forEach((conversation) => {
          void joinConversation(conversation.conversationId)
        })
      })
      .catch((err: Error) => {
        if (cancelled || requestId !== requestIdRef.current) return

        setError(err.message || "No se pudieron cargar las conversaciones.")
      })
      .finally(() => {
        if (cancelled || requestId !== requestIdRef.current) return

        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    appliedRange.agentId,
    appliedRange.validFrom,
    appliedRange.validTo,
    dedupeByClientKeepNewest,
    filter,
    normalizeConversation,
    page,
    pageSize,
    searchConversation,
  ])

  useEffect(() => {
    if (isAdmin) onConversationCreated(handleNewConvo)

    onConversationUpdated(handleUpdatedConvo)
    onNewMessage(handleNewMessage)
    onNewHumanRequest(handleHumanRequest)

    return () => {
      if (isAdmin) offConversationCreated(handleNewConvo)

      offConversationUpdated(handleUpdatedConvo)
      offNewMessage(handleNewMessage)
      offNewHumanRequest(handleHumanRequest)
    }
  }, [
    handleHumanRequest,
    handleNewConvo,
    handleNewMessage,
    handleUpdatedConvo,
    isAdmin,
    offConversationCreated,
    offConversationUpdated,
    offNewHumanRequest,
    offNewMessage,
    onConversationCreated,
    onConversationUpdated,
    onNewHumanRequest,
    onNewMessage,
  ])

  const onPageChange = useCallback((newPage: number) => {
    setPage((currentPage) => {
      if (newPage <= currentPage) return currentPage

      return newPage
    })
  }, [])

  const onPageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setConversations([])
    setPage(1)
  }, [])

  return {
    conversations,
    loading,
    error,
    form,
    appliedRange,
    handleDate,
    handleAgentChange,
    applyDateFilter,
    clearFilter,
    page,
    pageSize,
    pagination,
    onPageChange,
    onPageSizeChange,
  }
}