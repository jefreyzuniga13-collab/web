import { useEffect, useState, useCallback } from 'react'
import { getMessages } from '@/Utils/ApiConfig'
import { useSignalR } from '@/Context/SignalRContext'
import type { MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces'

export default function useMessages(conversationId?: number): MessageDto[] {
  const [messages, setMessages] = useState<MessageDto[]>([])
  const { joinConversation, leaveConversation, onReceiveMessage, offReceiveMessage } = useSignalR()

  const receiveHandler = useCallback(
    (payload: { Message: MessageDto; Attachments: AttachmentDto[] }) => {
      if (payload.Message.conversationId !== conversationId) return
      setMessages(prev => [
        ...prev,
        { ...payload.Message, attachments: payload.Attachments }
      ])
    },
    [conversationId]
  )

  useEffect(() => {
    if (conversationId == null) {
      setMessages([])      // limpia al cambiar o cerrar conversación
      return
    }

    let mounted = true

    // 1) Suscríbir antes de unirte
    onReceiveMessage(receiveHandler)

    // 2) Únete al grupo SignalR
    joinConversation(conversationId)

    // 3) Carga histórico
    ;(async () => {
      try {
        const res = await getMessages(conversationId)
        if (mounted) setMessages(res.data.data)
      } catch (err) {
        console.error(err)
      }
    })()

    return () => {
      mounted = false
      // 4) Abandona el grupo
      leaveConversation(conversationId)
      // 5) Cancela la suscripción al handler
      offReceiveMessage(receiveHandler)
    }
  }, [
    conversationId,
    onReceiveMessage,
    offReceiveMessage,
    receiveHandler,
    joinConversation,
    leaveConversation
  ])

  return messages
}