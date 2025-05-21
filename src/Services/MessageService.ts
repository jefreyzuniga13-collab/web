// src/Services/chatService.ts

import api from '@/Utils/ApiConfig';
import type { MessageDto, SentMessage } from '@/Interfaces/Chat/ChatInterfaces';

export function getMessages(conversationId: number) {
  return api.get<{ data: MessageDto[] }>(
    `/conversations/${conversationId}/messages`
  );
}

export function sendText(message: SentMessage) {
  return api.post<{ data: MessageDto }>(
    `/WhatsappWebhook/${message.conversationId}/send`,
    {
      senderId: message.senderId,
      content: message.content,
      messageType: 'Text'
    }
  );
}

export function sendMedia(
  conversationId: number,
  senderId: number,
  file: File,
  caption?: string
) {
  const form = new FormData();
  form.append('SenderId', senderId.toString());
  form.append('MessageType', 'Media');
  if (caption) form.append('Caption', caption);
  form.append('File', file);

  return api.post<{ data: MessageDto }>(
    `/conversations/${conversationId}/messages`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}