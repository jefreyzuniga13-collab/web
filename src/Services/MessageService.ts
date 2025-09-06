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
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      messageType: 'Text',
      externalId: message.externalId,
      repliedParentMessageId: message.repliedParentMessageId
    }
  );
}

export function sendMedia(
  conversationId: number,
  file: File,
  caption?: string,
  externalId?: string | null,
  repliedParentMessageId?: number | null
) {
  const form = new FormData()
  form.append('file', file)
  if (caption) form.append('caption', caption)
  if (externalId) form.append('externalId', externalId)

    //el endpoint espera un int de c#
  if (repliedParentMessageId) form.append('repliedParentMessageId', repliedParentMessageId.toString())//Pasar como number

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

export async function DownloadMedia(
  fileName: string
){
  const response = await api.get(`Media/${fileName}`, {
        responseType: 'blob',
      })
      return response;
}