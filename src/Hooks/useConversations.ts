import { useState, useEffect, useCallback } from 'react'
import {jwtDecode} from 'jwt-decode'
import { getConversationsByRole } from '@/Services/ConversationService'
import { useSignalR } from '@/Context/SignalRContext'
import type {
  ConversationDto,
  MessageDto,
  AttachmentDto,
} from '@/Interfaces/Chat/ChatInterfaces'

export type Filter = 'all' | 'new' | 'bot' | 'waiting' | 'human' | 'closed'

interface JwtPayload {
  role: string
}

export interface UseConversationsResult {
  conversations: ConversationDto[]
  loading: boolean
  error?: string
  reload: () => void
}

export function useConversations(
  filter: Filter = 'all'
): UseConversationsResult {
  // -- detectamos rol desde el JWT --
  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken } = JSON.parse(authRaw) as { accessToken: string }
  const { role } = jwtDecode<JwtPayload>(accessToken)
  console.log("Roles", role);
  
  const isAdmin = role.toLowerCase() === 'admin'

  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

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

  // decide si entra según filtro y rol
  const matchesFilter = useCallback(
    (c: ConversationDto) => {
      // soporte NO ve bots
      if (!isAdmin && c.status === 'Bot') return false

      switch (filter) {
        case 'all':     return true
        case 'new':
        case 'waiting': return c.status === 'Waiting'
        case 'bot':     return c.status === 'Bot'
        case 'human':   return c.status === 'Human'
        // case 'closed':  return c.status === 'Closed'
        default:        return true
      }
    },
    [filter, isAdmin]
  )

  // util sorting
  const sortByActivity = (list: ConversationDto[]) =>
    list.sort(
      (a, b) =>
        new Date(b.lastActivity || b.createdAt).getTime() -
        new Date(a.lastActivity || a.createdAt).getTime()
    )

  // 1) chat humano solicitado → actualiza estado
  const handleHumanRequest = useCallback(
    (payload: { conversationId: number }) => {
      setConversations(prev =>
        prev.map(c =>
          c.conversationId === payload.conversationId
            ? { ...c, status: 'Human' }
            : c
        )
      )
    },
    []
  )

  // 2) nueva conversación → solo admins reciben este evento
  const handleNewConvo = useCallback((newConvo: ConversationDto) => {
    if (!matchesFilter(newConvo)) return
    setConversations(prev =>
      sortByActivity([newConvo, ...prev])
    )
  }, [matchesFilter])

  // 3) conversación actualizada → insert/reemplaza/remueve + sort
  const handleUpdatedConvo = useCallback((updated: ConversationDto) => {
    setConversations(prev => {
      const exists = prev.some(c => c.conversationId === updated.conversationId)
      const ok = matchesFilter(updated)
      let next = exists
        ? prev.map(c => c.conversationId === updated.conversationId ? updated : c)
        : ok ? [updated, ...prev] : prev

      if (!ok) {
        next = next.filter(c => c.conversationId !== updated.conversationId)
      }
      return sortByActivity(next)
    })
  }, [matchesFilter])

  // 4) nuevo mensaje → bump counters + lastActivity + sort
  const handleNewMessage = useCallback(
    (payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
      const msg = payload.message
      setConversations(prev =>
        sortByActivity(
          prev.map(c =>
            c.conversationId === msg.conversationId
              ? {
                  ...c,
                  totalMessages: (c.totalMessages || 0) + 1,
                  lastActivity: msg.sentAt?.toString(),
                  unreadCount: (c.unreadCount || 0) + 1,
                }
              : c
          )
        )
      )
    },
    []
  )

  // 5) carga inicial
  const reload = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      const res = await getConversationsByRole()
      let convs = res.data.data.map(conv => ({
        ...conv,
        lastActivity: conv.lastActivity || conv.updatedAt || conv.createdAt,
        unreadCount: conv.unreadCount || 0,
      }))
      
      const filterConv = convs.filter(e => e.status !== 'Closed')

      // aplicamos filtro + rol
      convs = convs.filter(matchesFilter)
      setConversations(sortByActivity(filterConv))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error cargando conversaciones')
    } finally {
      setLoading(false)
    }
  }, [matchesFilter])

  // suscripciones SignalR
  useEffect(() => {
    reload()

    // admin solo recibe creación
    if (isAdmin) {
      onConversationCreated(handleNewConvo)
    }
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
    reload,
    isAdmin,
    handleNewConvo,
    handleUpdatedConvo,
    handleNewMessage,
    handleHumanRequest,
    onConversationCreated,
    offConversationCreated,
    onConversationUpdated,
    offConversationUpdated,
    onNewMessage,
    offNewMessage,
    onNewHumanRequest,
    offNewHumanRequest,
  ])

  return { conversations, loading, error, reload }
}
