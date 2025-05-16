import { useEffect, useState, useCallback } from 'react'
import { getMessages } from '@/Utils/ApiConfig'
import { useSignalR } from '@/Context/SignalRContext'
import type { MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces'

export default function useMessages(conversationId?: number): MessageDto[] {
  const [messages, setMessages] = useState<MessageDto[]>([])
  const {
    joinConversation,
    leaveConversation,
    onNewMessage,
    offNewMessage,
    onMessageStatusChanged,
    offMessageStatusChanged
  } = useSignalR()

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

  const statusHandler = useCallback(
    (updated: MessageDto) => {
      if (updated.conversationId !== conversationId) return
      setMessages(prev =>
        prev.map(m =>
          m.messageId === updated.messageId
            ? { ...m, status: updated.status, deliveredAt: updated.deliveredAt, readAt: updated.readAt }
            : m
        )
      )
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
    onMessageStatusChanged(statusHandler)
    joinConversation(conversationId)

    getMessages(conversationId)
      .then(res => mounted && setMessages(res.data.data))
      .catch(() => {})

    return () => {
      mounted = false
      leaveConversation(conversationId)
      offNewMessage(receiveHandler)
      offMessageStatusChanged(statusHandler)
    }
  }, [
    conversationId,
    receiveHandler,
    statusHandler,
    onNewMessage,
    offNewMessage,
    onMessageStatusChanged,
    offMessageStatusChanged,
    joinConversation,
    leaveConversation
  ])

  return messages
}