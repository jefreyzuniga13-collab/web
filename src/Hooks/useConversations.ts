import { useEffect, useState, useCallback } from 'react'
import { getConversations } from '@/Utils/ApiConfig'
import { useSignalR } from '@/Context/SignalRContext'
import type { ConversationDto, MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces'

export function useConversations(): ConversationDto[] {
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const {
    onConversationCreated,
    offConversationCreated,
    onNewMessage,
    offNewMessage,
    onNewHumanRequest,
    offNewHumanRequest
  } = useSignalR()

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

  const handleNewConvo = useCallback(
    (newConvo: ConversationDto) => {
      setConversations(prev => [newConvo, ...prev])
    },
    []
  )

  const handleNewMessage = useCallback(
    (payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
      const msg = payload.message
      setConversations(prev =>
        prev
          .map(c =>
            c.conversationId === msg.conversationId
              ? {
                  ...c,
                  totalMensajes: c.totalMensajes + 1,
                  ultimaActividad: msg.createdAt
                }
              : c
          )
          .sort(
            (a, b) =>
              new Date(b.ultimaActividad).getTime() -
              new Date(a.ultimaActividad).getTime()
          )
      )
    },
    []
  )

  useEffect(() => {
    let mounted = true

    getConversations()
      .then(res => mounted && setConversations(res.data.data))
      .catch(console.error)

    onNewHumanRequest(handleHumanRequest)
    onConversationCreated(handleNewConvo)
    onNewMessage(handleNewMessage)

    return () => {
      mounted = false
      offNewHumanRequest(handleHumanRequest)
      offConversationCreated(handleNewConvo)
      offNewMessage(handleNewMessage)
    }
  }, [
    handleHumanRequest,
    handleNewConvo,
    handleNewMessage,
    onNewHumanRequest,
    onConversationCreated,
    onNewMessage,
    offNewHumanRequest,
    offConversationCreated,
    offNewMessage
  ])

  return conversations
}