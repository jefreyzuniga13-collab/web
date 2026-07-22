import {useState,useEffect, useCallback, useRef,} from "react"
import { useSelector } from "react-redux"
import { selectIsAdmin,selectIsRoot,selectUserId} from "@/Context/Slices/Auth/authSlice"
import { useSignalR } from "@/Context/SignalRContext"
import type {ConversationDto,MessageDto,AttachmentDto} from "@/Interfaces/Chat/ChatInterfaces"
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

  handleDate: (
    field: DateField,
    date: Date | null
  ) => void

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

  return Number.isNaN(date.getTime())
    ? null
    : date
}

const readStoredAgentId = (): number => {
  const value = Number(
    localStorage.getItem(STORAGE_AGENT) ?? 0
  )

  return Number.isFinite(value)
    ? value
    : 0
}

const initialRange = (): FormInterface => {
  return {
    validFrom: readStoredDate(STORAGE_FROM),
    validTo: readStoredDate(STORAGE_TO),
    agentId: readStoredAgentId(),
  }
}

const saveRange = (range: FormInterface): void => {
  if (range.validFrom) {
    localStorage.setItem(
      STORAGE_FROM,
      range.validFrom.toISOString()
    )
  } else {
    localStorage.removeItem(STORAGE_FROM)
  }

  if (range.validTo) {
    localStorage.setItem(
      STORAGE_TO,
      range.validTo.toISOString()
    )
  } else {
    localStorage.removeItem(STORAGE_TO)
  }

  localStorage.setItem(
    STORAGE_AGENT,
    String(range.agentId)
  )
}

const safeTime = (value: string | null): number => {
  if (!value) return 0

  const timestamp = new Date(value).getTime()

  return Number.isNaN(timestamp)
    ? 0
    : timestamp
}

const toApiState = (filter: Filter): string => {
  return filter === "all"
    ? ""
    : filter
}

const getFilterStatus = (
  filter: Filter
): ConversationDto["status"] | null => {
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
  const isRoot = useSelector(selectIsRoot)
  const userId = useSelector(selectUserId)

  const requestIdRef = useRef(0)

  const [form, setForm] =
    useState<FormInterface>(initialRange)

  const [appliedRange, setAppliedRange] =
    useState<FormInterface>(initialRange)

  const [conversations, setConversations] =
    useState<ConversationDto[]>([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [page, setPage] =
    useState(1)

  const [pageSize, setPageSize] =
    useState(DEFAULT_PAGE_SIZE)

  const [pagination, setPagination] =
    useState<PaginationInfo>({
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

  /*
   * Cuando existe un filtro aplicado, la lista representa
   * una consulta específica de la API.
   *
   * SignalR no debe insertar, actualizar ni reordenar elementos
   * mientras se esté mostrando ese resultado filtrado.
   */
  const hasAppliedListFilter =
    appliedRange.validFrom !== null ||
    appliedRange.validTo !== null ||
    appliedRange.agentId > 0 ||
    searchConversation.trim().length > 0

  const canReceiveCreatedConversation =
    isAdmin || isRoot

  const activityTs = useCallback(
    (conversation: ConversationDto): number => {
      return Math.max(
        safeTime(conversation.lastActivity ?? null),
        safeTime(conversation.updatedAt ?? null),
        safeTime(
          conversation.clientLastMessageAt ?? null
        ),
        safeTime(
          conversation.agentLastMessageAt ?? null
        ),
        safeTime(conversation.createdAt ?? null)
      )
    },
    []
  )

  const sortByActivity = useCallback(
    (
      list: ConversationDto[]
    ): ConversationDto[] => {
      return [...list].sort(
        (a, b) => activityTs(b) - activityTs(a)
      )
    },
    [activityTs]
  )

  const normalizeConversation = useCallback(
    (
      conversation: ConversationDto
    ): ConversationDto => {
      return {
        ...conversation,

        lastActivity:
          conversation.lastActivity ??
          conversation.clientLastMessageAt ??
          conversation.agentLastMessageAt ??
          conversation.updatedAt ??
          conversation.createdAt,

        unreadCount:
          conversation.unreadCount ?? 0,
      }
    },
    []
  )

  const dedupeByClientKeepNewest = useCallback(
    (
      list: ConversationDto[]
    ): ConversationDto[] => {
      const map =
        new Map<number, ConversationDto>()

      for (const conversation of list) {
        const key = Number(
          conversation.clientContactId ??
            conversation.conversationId ??
            0
        )

        const current = map.get(key)

        if (
          !current ||
          activityTs(conversation) >=
            activityTs(current)
        ) {
          map.set(key, conversation)
        }
      }

      return sortByActivity(
        Array.from(map.values())
      )
    },
    [activityTs, sortByActivity]
  )

  const matchesFilter = useCallback(
    (conversation: ConversationDto): boolean => {
      const expectedStatus =
        getFilterStatus(filter)

      if (!expectedStatus) return true

      return conversation.status === expectedStatus
    },
    [filter]
  )

  const mergeConversation = useCallback(
    (
      current: ConversationDto | null,
      updated: ConversationDto
    ): ConversationDto => {
      const merged = {
        ...current,
        ...updated,

        assignedAgentId:
          updated.assignedAgentId ??
          current?.assignedAgentId ??
          0,

        assignedByUserId:
          updated.assignedByUserId ??
          current?.assignedByUserId ??
          0,

        clientContactId:
          updated.clientContactId ??
          current?.clientContactId ??
          0,

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

        unreadCount:
          updated.unreadCount ??
          current?.unreadCount ??
          0,

        unreadForAgent:
          updated.unreadForAgent ??
          current?.unreadForAgent ??
          0,

        unreadForAssigner:
          updated.unreadForAssigner ??
          current?.unreadForAssigner ??
          0,
      } as ConversationDto

      return normalizeConversation(merged)
    },
    [normalizeConversation]
  )

  const handleHumanRequest = useCallback(
    (
      payload: {
        conversationId: number
      }
    ): void => {
      /*
       * No modificar una consulta histórica o filtrada
       * debido a una señal recibida en tiempo real.
       */
      if (hasAppliedListFilter) return

      setConversations((previous) => {
        const next = previous.map(
          (conversation) => {
            if (
              conversation.conversationId !==
              payload.conversationId
            ) {
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
          }
        )

        return sortByActivity(next)
      })
    },
    [
      hasAppliedListFilter,
      normalizeConversation,
      sortByActivity,
    ]
  )


  const handleUpdatedConvo = useCallback(
  (updated: ConversationDto): void => {
    /*
     * Si se está mostrando una consulta filtrada,
     * SignalR no debe actualizar ni reordenar la lista.
     */
    if (hasAppliedListFilter) return

    const normalizedUpdated =
      normalizeConversation(updated)

    const assignedAgentId = Number(
      normalizedUpdated.assignedAgentId ?? 0
    )

    const currentUserId = Number(userId ?? 0)

    /*
     * Si la conversación fue reasignada a otro agente,
     * se elimina de la lista del agente anterior.
     *
     * Admin y Root siempre conservan la conversación.
     */
    const shouldRemoveConversation =
      !isAdmin &&
      !isRoot &&
      assignedAgentId > 0 &&
      assignedAgentId !== currentUserId

    setConversations((previous) => {
      if (shouldRemoveConversation) {
        return previous.filter(
          (conversation) =>
            conversation.conversationId !==
            normalizedUpdated.conversationId
        )
      }

      const current =
        previous.find(
          (conversation) =>
            conversation.conversationId ===
            normalizedUpdated.conversationId
        ) ?? null

      const mergedConversation =
        mergeConversation(
          current,
          normalizedUpdated
        )

      void joinConversation(
        mergedConversation.conversationId
      )

      const base = previous.filter(
        (conversation) =>
          conversation.conversationId !==
            mergedConversation.conversationId &&
          conversation.clientContactId !==
            mergedConversation.clientContactId
      )

      const merged = matchesFilter(
        mergedConversation
      )
        ? [mergedConversation, ...base]
        : base

      return dedupeByClientKeepNewest(merged)
    })
  },
  [
    hasAppliedListFilter,
    userId,
    isAdmin,
    isRoot,
    dedupeByClientKeepNewest,
    matchesFilter,
    mergeConversation,
    normalizeConversation,
  ]
)

  const handleNewMessage = useCallback(
    (
      payload: {
        message: MessageDto
        attachments: AttachmentDto[]
      }
    ): void => {
      /*
       * Un mensaje recibido hoy no debe cambiar una lista
       * que está filtrada por ayer u otro rango.
       */
      if (hasAppliedListFilter) return

      const message = payload.message

      setConversations((previous) => {
        const exists = previous.some(
          (conversation) =>
            conversation.conversationId ===
            message.conversationId
        )

        if (!exists) return previous

        const updated = previous.map(
          (conversation) => {
            if (
              conversation.conversationId !==
              message.conversationId
            ) {
              return conversation
            }

            const isAssignedToMe =
              Number(
                conversation.assignedAgentId ?? 0
              ) === Number(userId)

            const senderIsUser =
              Number(message.senderUserId ?? 0) > 0

            const unreadForAgent =
              senderIsUser || !isAssignedToMe
                ? conversation.unreadForAgent ?? 0
                : (
                    conversation.unreadForAgent ?? 0
                  ) + 1

            const unreadForAssigner =
              senderIsUser || isAssignedToMe
                ? conversation.unreadForAssigner ??
                  0
                : (
                    conversation.unreadForAssigner ??
                    0
                  ) + 1

            return normalizeConversation({
              ...conversation,

              totalMessages:
                (
                  conversation.totalMessages ?? 0
                ) + 1,

              updatedAt:
                message.sentAt ??
                conversation.updatedAt,

              lastActivity:
                message.sentAt ??
                conversation.lastActivity ??
                conversation.updatedAt ??
                conversation.createdAt,

              clientLastMessageAt:
                senderIsUser
                  ? conversation.clientLastMessageAt
                  : message.sentAt ??
                    conversation.clientLastMessageAt,

              agentLastMessageAt:
                senderIsUser
                  ? message.sentAt ??
                    conversation.agentLastMessageAt
                  : conversation.agentLastMessageAt,

              unreadCount:
                (
                  conversation.unreadCount ?? 0
                ) + 1,

              unreadForAgent,
              unreadForAssigner,
            })
          }
        )

        return dedupeByClientKeepNewest(updated)
      })
    },
    [
      hasAppliedListFilter,
      dedupeByClientKeepNewest,
      normalizeConversation,
      userId,
    ]
  )

  const handleNewConvo = useCallback(
    (
      newConversation: ConversationDto
    ): void => {
      /*
       * Una conversación nueva no debe introducirse
       * dentro de una consulta histórica o filtrada.
       */
      if (hasAppliedListFilter) return

      const normalized =
        normalizeConversation(newConversation)

      if (!matchesFilter(normalized)) return

      void joinConversation(
        normalized.conversationId
      )

      setConversations((previous) => {
        const base = previous.filter(
          (conversation) =>
            conversation.clientContactId !==
            normalized.clientContactId
        )

        return dedupeByClientKeepNewest([
          normalized,
          ...base,
        ])
      })
    },
    [
      hasAppliedListFilter,
      dedupeByClientKeepNewest,
      matchesFilter,
      normalizeConversation,
    ]
  )

  const handleDate = useCallback(
    (
      field: DateField,
      date: Date | null
    ): void => {
      setForm((current) => ({
        ...current,
        [field]: date,
      }))
    },
    []
  )

  const handleAgentChange = useCallback(
    (agentId: number): void => {
      setForm((current) => ({
        ...current,
        agentId,
      }))
    },
    []
  )

  const applyDateFilter = useCallback((): void => {
    const nextRange: FormInterface = {
      validFrom: form.validFrom
        ? new Date(form.validFrom)
        : null,

      validTo: form.validTo
        ? new Date(form.validTo)
        : null,

      agentId: form.agentId,
    }

    saveRange(nextRange)

    setAppliedRange(nextRange)
    setConversations([])
    setPage(1)
  }, [form])

  const clearFilter = useCallback((): void => {
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

  /*
   * Al cambiar estado o búsqueda se reinicia
   * la paginación.
   */
  useEffect(() => {
    setPage(1)
    setConversations([])
  }, [filter, searchConversation])

  /*
   * Obtiene las conversaciones desde la API.
   */
  useEffect(() => {
    const requestId =
      ++requestIdRef.current

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
      .then((response) => {
        /*
         * Evita que una respuesta antigua sobrescriba
         * el resultado de una solicitud más reciente.
         */
        if (
          cancelled ||
          requestId !== requestIdRef.current
        ) {
          return
        }

        const items = response.items.map(
          (conversation) =>
            normalizeConversation({
              ...conversation,

              unreadCount:
                conversation.unreadCount ?? 0,
            })
        )

        setPagination({
          currentPage:
            response.meta.currentPage,

          totalPages:
            response.meta.totalPages,

          totalItems:
            response.meta.totalCount,

          itemsPerPage:
            response.meta.pageSize,
        })

        setConversations((previous) => {
          const base =
            page === 1
              ? []
              : previous

          return dedupeByClientKeepNewest([
            ...base,
            ...items,
          ])
        })

        items.forEach((conversation) => {
          void joinConversation(
            conversation.conversationId
          )
        })
      })
      .catch((caughtError: unknown) => {
        if (
          cancelled ||
          requestId !== requestIdRef.current
        ) {
          return
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudieron cargar las conversaciones."

        setError(message)
      })
      .finally(() => {
        if (
          cancelled ||
          requestId !== requestIdRef.current
        ) {
          return
        }

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

  /*
   * Suscripciones SignalR.
   *
   * Admin y Root pueden recibir conversaciones creadas.
   * Los handlers ignoran las señales cuando existe
   * una consulta filtrada.
   */
  useEffect(() => {
    if (canReceiveCreatedConversation) {
      onConversationCreated(handleNewConvo)
    }

    onConversationUpdated(handleUpdatedConvo)
    onNewMessage(handleNewMessage)
    onNewHumanRequest(handleHumanRequest)

    return () => {
      if (canReceiveCreatedConversation) {
        offConversationCreated(handleNewConvo)
      }

      offConversationUpdated(handleUpdatedConvo)
      offNewMessage(handleNewMessage)
      offNewHumanRequest(handleHumanRequest)
    }
  }, [
    canReceiveCreatedConversation,
    handleHumanRequest,
    handleNewConvo,
    handleNewMessage,
    handleUpdatedConvo,
    offConversationCreated,
    offConversationUpdated,
    offNewHumanRequest,
    offNewMessage,
    onConversationCreated,
    onConversationUpdated,
    onNewHumanRequest,
    onNewMessage,
  ])

  const onPageChange = useCallback(
    (newPage: number): void => {
      setPage((currentPage) => {
        if (newPage <= currentPage) {
          return currentPage
        }

        return newPage
      })
    },
    []
  )

  const onPageSizeChange = useCallback(
    (newSize: number): void => {
      setPageSize(newSize)
      setConversations([])
      setPage(1)
    },
    []
  )

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