/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import { getConversationsByRole } from '@/Services/ConversationService'
import { useSignalR } from '@/Context/SignalRContext'
import type {
  ConversationDto,
  MessageDto,
  AttachmentDto,
} from '@/Interfaces/Chat/ChatInterfaces'

export type Filter = 'all' | 'new' | 'bot' | 'waiting' | 'human'
export type filterInactiveConv = 'all' | 'closed' | 'incomplete'

interface JwtPayload {
  role: string
}

export interface UseConversationsResult {
  conversations: ConversationDto[]
  conversationsHistory: ConversationDto[]
  loading: boolean
  error?: string
  reload: () => void
}

export function useConversations(
  filter: Filter = 'all',
  filterInactiveConv: filterInactiveConv = 'all'
): UseConversationsResult {
  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken } = JSON.parse(authRaw) as { accessToken: string }
  const { role } = jwtDecode<JwtPayload>(accessToken)
  const isAdmin = role.toLowerCase() === 'admin'

  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [conversationsHistory, setConversationsHistory] = useState<ConversationDto[]>([])
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

  const matchesFilter = useCallback(
    (c: ConversationDto) => {
      if (!isAdmin && c.status === 'Bot') return false
      switch (filter) {
        case 'all':
          return c.status !== 'Closed' && c.status !== 'Incomplete'
        case 'waiting':
          return c.status === 'Waiting'
        case 'bot':
          return c.status === 'Bot'
        case 'human':
          return c.status === 'Human'
        default:
          return true
      }
    },
    [filter, isAdmin]
  )

  const matchesFilterHistory = useCallback(
    (c: ConversationDto) => {
      switch (filterInactiveConv) {
        case 'all':
          return c.status === 'Closed' || c.status === 'Incomplete'
        case 'closed':
          return c.status === 'Closed'
        case 'incomplete':
          return c.status === 'Incomplete'
        default:
          return false
      }
    },
    [filterInactiveConv]
  )

  const sortByActivity = (list: ConversationDto[]) =>
    list.sort(
      (a, b) =>
        new Date(b.lastActivity || b.createdAt).getTime() -
        new Date(a.lastActivity || a.createdAt).getTime()
    )

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

  const handleNewConvo = useCallback(
    (newConvo: ConversationDto) => {
      const active = matchesFilter(newConvo)
      const inactive = matchesFilterHistory(newConvo)

      if (active) {
        setConversations(prev => sortByActivity([newConvo, ...prev]))
      } else if (inactive) {
        setConversationsHistory(prev => sortByActivity([newConvo, ...prev]))
      }
    },
    [matchesFilter, matchesFilterHistory]
  )

  const handleUpdatedConvo = useCallback(
    (updated: ConversationDto) => {
      setConversations(prev => {
        const exists = prev.some(c => c.conversationId === updated.conversationId)
        const ok = matchesFilter(updated)

        let next: ConversationDto[]

        if (exists) {
          next = ok
            ? prev.map(c =>
                c.conversationId === updated.conversationId ? updated : c
              )
            : prev.filter(c => c.conversationId !== updated.conversationId)
        } else {
          next = ok ? [...prev, updated] : prev
        }

        return sortByActivity(next)
      })

      setConversationsHistory(prev => {
        const exists = prev.some(c => c.conversationId === updated.conversationId)
        const ok = matchesFilterHistory(updated)

        let next: ConversationDto[]

        if (exists) {
          next = ok
            ? prev.map(c =>
                c.conversationId === updated.conversationId ? updated : c
              )
            : prev.filter(c => c.conversationId !== updated.conversationId)
        } else {
          next = ok ? [...prev, updated] : prev
        }

        return sortByActivity(next)
      })
    },
    [matchesFilter, matchesFilterHistory]
  )

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

  const reload = useCallback(async () => {
    setLoading(true)
    setError(undefined)

    try {
      const res = await getConversationsByRole()
      const convsData = res.data.data.map(conv => ({
        ...conv,
        lastActivity: conv.lastActivity || conv.updatedAt || conv.createdAt,
        unreadCount: conv.unreadCount || 0,
      }))

      const convs = convsData.filter(matchesFilter)
      const convsHistory = convsData.filter(matchesFilterHistory)

      setConversations(sortByActivity(convs))
      setConversationsHistory(sortByActivity(convsHistory))
    } catch (err: any) {
      setError(err.message || 'Error cargando conversaciones')
    } finally {
      setLoading(false)
    }
  }, [matchesFilter, matchesFilterHistory])

  useEffect(() => {
    reload()

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

  return { conversations, conversationsHistory, loading, error, reload }
}