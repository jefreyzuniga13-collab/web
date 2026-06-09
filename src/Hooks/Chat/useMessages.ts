import { useState, useEffect, useCallback } from 'react'
import { getMessages } from '@/Services/chat/MessageService'
import { useSignalR } from '@/Context/SignalRContext'
import type { MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces'
// import { notificationSound } from '@/Utils/sound'

const useMessages = (validFrom?: Date | null, validTo?: Date | null, conversationId?: number) => {

  const [messages, setMessages] = useState<MessageDto[]>([])
  const {
    joinConversation,
    leaveConversation,
    onNewMessage,
    offNewMessage,
    onMessageStatusChanged,
    offMessageStatusChanged
  } = useSignalR()

  // Cuando llega un mensaje por SignalR
  const receiveHandler = useCallback(
    async (payload: { message: MessageDto; attachments?: AttachmentDto[] }) => {
      const { message, attachments } = payload
      if (message.conversationId !== conversationId) return

      // 1) Si viene con attachments, lo añadimos directamente
      if (attachments && attachments.length > 0) {
        setMessages(prev => [...prev, { ...message, attachments }])
        return
      }

      // 2) Si es Text normal, sin attachments
      if (message.messageType === 'Text') {
        setMessages(prev => [...prev, { ...message, attachments: [] }])
        return
      }


      // 3) Si es media pero no vino con attachments -> recargamos todos los mensajes
      try {
        const res = await getMessages(conversationId!, validFrom, validTo)
        setMessages(res.data.data)
      } catch {
        // en caso de fallo, igual añadimos el mensaje sin media
        setMessages(prev => [...prev, { ...message, attachments: [] }])
      }
    },
    [conversationId, validFrom, validTo]
  )

  // Cuando cambia el status (delivered/read)
  const statusHandler = useCallback(
    (updated: MessageDto) => {
      if (updated.conversationId !== conversationId) return
      setMessages(prev =>
        prev.map(m =>
          m.messageId === updated.messageId
            ? { ...m, ...updated }
            : m
        )
      )
    },
    [conversationId]
  )

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    let mounted = true

    // 1) suscripciones SignalR
    onNewMessage(receiveHandler)
    onMessageStatusChanged(statusHandler)
    joinConversation(conversationId)

    // 2) carga inicial de mensajes
    getMessages(conversationId, validFrom, validTo)
      .then(res => {
        if (mounted) setMessages(res.data.data)
      })
      .catch(() => {})

    return () => {
      mounted = false
      leaveConversation(conversationId)
      offNewMessage(receiveHandler)
      offMessageStatusChanged(statusHandler)
    }
  }, [conversationId, receiveHandler, statusHandler, onNewMessage, offNewMessage, onMessageStatusChanged, offMessageStatusChanged, joinConversation, leaveConversation])

  return messages
}

export default useMessages