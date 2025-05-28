// src/Services/chatService.ts

import api from '@/Utils/ApiConfig';
import type { MessageDto, SentMessage } from '@/Interfaces/Chat/ChatInterfaces';

export function getMessages(conversationId: number) {
  return api.get<{ data: MessageDto[] }>(
    `/conversations/${conversationId}/messages`
  );
}

export function sendText(message: SentMessage) {
  console.log("El id de conversacion el servicio: ", message.conversationId)
  console.log("El id de sender el servicio: ", message.senderId)
  return api.post<{ data: MessageDto }>(
    `/WhatsappWebhook/${message.conversationId}/send`,
    {
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      messageType: 'Text'
    }
  );
}

export function sendMedia(
  conversationId: number,
  file: File,
  caption?: string
) {
  const form = new FormData()
  form.append('file', file)
  if (caption) form.append('caption', caption)

  return api.post<{ data: MessageDto }>(
    `/WhatsappWebhook/${conversationId}/send/media`,
    form,
    {
      headers: {
        // obligamos a multipart/form-data con boundary
        'Content-Type': 'multipart/form-data'
      }
    }
  )
}