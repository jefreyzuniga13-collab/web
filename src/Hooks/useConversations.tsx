import { useEffect, useState, useCallback } from 'react'
import { getConversations } from '@/Utils/ApiConfig'
import { useSignalR } from '@/Context/SignalRContext'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'

export function useConversations(): ConversationDto[] {
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const {
    onNewHumanRequest,
    onConversationCreated,
    offConversationCreated,
  } = useSignalR()

  // 1) Actualiza estado cuando cambia a “WaitingHuman”
  const handleHumanRequest = useCallback(
    (payload: { conversationId: number; fromPhone: string }) => {
      setConversations(prev =>
        prev.map(c =>
          c.conversationId === payload.conversationId
            ? { ...c, status: 'WaitingHuman' }
            : c
        )
      )
    },
    []
  )

  // 2) Agrega al inbox la nueva conversación
  const handleNewConvo = useCallback(
    (newConvo: ConversationDto) => {
      setConversations(prev => [newConvo, ...prev])
    },
    []
  )

  useEffect(() => {
    let mounted = true

    // carga inicial
    getConversations()
      .then(res => mounted && setConversations(res.data.data))
      .catch(console.error)

    // suscripciones SignalR
    onNewHumanRequest(handleHumanRequest)
    onConversationCreated(handleNewConvo)

    return () => {
      mounted = false
      offConversationCreated(handleNewConvo)
    }
  }, [
    handleHumanRequest,
    handleNewConvo,
    onNewHumanRequest,
    onConversationCreated,
    offConversationCreated,
  ])

  return conversations
}