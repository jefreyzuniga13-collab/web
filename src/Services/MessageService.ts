import api from '@/Utils/ApiConfig';
import type { MessageDto, SendInteractiveMessajeRequestDto, SentMessage } from '@/Interfaces/Chat/ChatInterfaces';
import { toZonedTime, format } from "date-fns-tz";

export function getMessages(conversationId: number,
  validFrom?: Date | null, validTo?: Date | null) {

  let from;
  if (validFrom != null) {
    const zone = "America/Managua";
    const fromNic = toZonedTime(validFrom, zone);
    from = format(fromNic, "yyyy-MM-dd", { timeZone: zone });

  }

  let to;
  if (validTo != null) {
    const zone = "America/Managua";
    const toNic = toZonedTime(validTo, zone);
    to = format(toNic, "yyyy-MM-dd", { timeZone: zone });
  }

  return api.get<{ data: MessageDto[] }>(
    `/conversations/${conversationId}/messages`,
    {
      params: {
        from,
        to
      }
    }
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


export function sendInterctiveMessage(req: SendInteractiveMessajeRequestDto) {
  return api.post<{ data: MessageDto }>(
    `/WhatsappWebhook/sendInterctiveMessage`, req
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
) {
  const response = await api.get(`Media/${fileName}`, {
    responseType: 'blob',
  })
  return response;
}