import { useState, useEffect, useCallback } from 'react'
import { getConversationsByRole } from '@/Services/ConversationService'
import { useSignalR } from '@/Context/SignalRContext'
import type {
  ConversationDto,
  MessageDto,
  AttachmentDto,
} from '@/Interfaces/Chat/ChatInterfaces'

export type Filter = 'all' | 'new' | 'bot' | 'waiting' | 'human' | 'closed'

export interface UseConversationsResult {
  conversations: ConversationDto[]
  loading: boolean
  error?: string
  reload: () => void
}

export function useConversations(
  filter: Filter = 'all'
): UseConversationsResult {
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


  const handleNewConvo = useCallback((newConvo: ConversationDto) => {
    setConversations(prev => [newConvo, ...prev])
  }, [])

  
  const handleUpdatedConvo = useCallback((updated: ConversationDto) => {
    setConversations(prev =>
      prev
        .map(c =>
          c.conversationId === updated.conversationId ? updated : c
        )
        .sort(
          (a, b) =>
            new Date(b.lastActivity || b.createdAt).getTime() -
            new Date(a.lastActivity || a.createdAt).getTime()
        )
    )
  }, [])


  const handleNewMessage = useCallback(
    (payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
      const msg = payload.message
      setConversations(prev =>
        prev
          .map(c =>
            c.conversationId === msg.conversationId
              ? {
                  ...c,
                  totalMessages: (c.totalMessages || 0) + 1,
                  lastActivity: msg.sentAt?.toString(),
                  unreadCount: (c.unreadCount || 0) + 1,
                }
              : c
          )
          .sort(
            (a, b) =>
              new Date(b.lastActivity!).getTime() -
              new Date(a.lastActivity!).getTime()
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
      let convs = res.data.data.map(conv => ({
        ...conv,
        totalMessages: conv.totalMessages,
        lastActivity: conv.lastActivity || conv.updatedAt || conv.createdAt,
        duration: conv.duration,
        unreadCount: conv.unreadCount || 0,
      }))


      if (filter === 'new') {
        convs = convs.filter(c => c.status === 'Waiting')
      } else if (filter === 'bot') {
        convs = convs.filter(c => c.status === 'Bot')
      } else if (filter === 'waiting') {
        convs = convs.filter(c => c.status === 'Waiting')
      } else if (filter === 'human') {
        convs = convs.filter(c => c.status === 'Human')
      } else if (filter === 'closed') {
        convs = convs.filter(c => c.status === 'Closed')
      }

      convs.sort(
        (a, b) =>
          new Date(b.lastActivity!).getTime() -
          new Date(a.lastActivity!).getTime()
      )

      setConversations(convs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error cargando conversaciones')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    reload()

    onNewHumanRequest(handleHumanRequest)
    onConversationCreated(handleNewConvo)
    onConversationUpdated(handleUpdatedConvo) 
    onNewMessage(handleNewMessage)

    return () => {
      offNewHumanRequest(handleHumanRequest)
      offConversationCreated(handleNewConvo)
      offConversationUpdated(handleUpdatedConvo) 
      offNewMessage(handleNewMessage)
    }
  }, [
    reload,
    handleHumanRequest,
    handleNewConvo,
    handleUpdatedConvo,   
    handleNewMessage,
    onNewHumanRequest,
    offNewHumanRequest,
    onConversationCreated,
    offConversationCreated,
    onConversationUpdated,
    offConversationUpdated,
    onNewMessage,
    offNewMessage,
  ])

  return { conversations, loading, error, reload }
}