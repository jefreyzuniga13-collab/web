import { useEffect, useState, useCallback } from 'react'
import { getMessages } from '@/Utils/ApiConfig'
import { useSignalR } from '@/Context/SignalRContext'
import type { MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces'

export default function useMessages(conversationId?: number): MessageDto[] {
  const [messages, setMessages] = useState<MessageDto[]>([])
  const { joinConversation, leaveConversation, onNewMessage, offNewMessage } = useSignalR()

  const receiveHandler = useCallback(
    (payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
      if (payload.message.conversationId !== conversationId) return
      setMessages(prev => [
        ...prev,
        { ...payload.message, attachments: payload.attachments }
      ])
    },
    [conversationId]
  )

  useEffect(() => {
    if (conversationId == null) {
      setMessages([])
      return
    }

    let mounted = true

    onNewMessage(receiveHandler)
    joinConversation(conversationId)

    getMessages(conversationId)
      .then(res => mounted && setMessages(res.data.data))
      .catch(() => {})

    return () => {
      mounted = false
      leaveConversation(conversationId)
      offNewMessage(receiveHandler)
    }
  }, [
    conversationId,
    receiveHandler,
    onNewMessage,
    offNewMessage,
    joinConversation,
    leaveConversation
  ])

  return messages
}