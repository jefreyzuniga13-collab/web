import api from '@/Utils/ApiConfig';
import type { MessageDto, SendInteractiveMessajeRequestDto, SentMessage, SendMediaFromUrlDto } from '@/Interfaces/Chat/ChatInterfaces';
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
    `/Webhook/${message.conversationId}/send`,
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
    `/Webhook/sendInterctiveMessage`, req
  );
}

export function SendMediaECommerceFromUrlAsync(
  conversationId: number,
  payload: SendMediaFromUrlDto
) {
  return api.post(
    `/Webhook/${conversationId}/sendEcommerce/media-from-url`,
    payload
  )
}

export function sendMediaEcommerce(
  conversationId: number,
  file: File,
  caption?: string,
  externalId?: string | null,
  repliedParentMessageId?: number | null
) {
  const form = new FormData()
  form.append("file", file)
  if (caption) form.append("caption", caption)
  if (externalId) form.append("externalId", externalId)
  if (repliedParentMessageId != null)
    form.append("repliedParentMessageId", String(repliedParentMessageId))

  return api.post(
    `/Webhook/${conversationId}/sendEcommerce/media`,
    form,
    {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  )
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
    `/Webhook/${conversationId}/send/media`,
    form,
    {
      headers: {
        // obligamos a multipart/form-data con boundary
        'Content-Type': 'multipart/form-data'
      }
    }
  )
}

export function blockWhatsapp(waId: string) {
  return api.post(
    `/Webhook/blocks/${encodeURIComponent(waId)}`
  );
}

export function unblockWhatsapp(waId: string) {
  return api.delete(
    `/Webhook/blocks/${encodeURIComponent(waId)}`
  );
}

// export function getWhatsappBlocks() {
//   return api.get<{ data: string[] }>(
//     `/Webhook/blocks`
//   );
// }

export function blockMessenger(psid: string) {
  return api.post(
    `/Webhook/messenger/blocks/${encodeURIComponent(psid)}`
  );
}

export function unblockMessenger(psid: string) {
  return api.delete(
    `/Webhook/messenger/blocks/${encodeURIComponent(psid)}`
  );
}

export function moveMessengerToSpam(psid: string) {
  return api.post(
    `/Webhook/messenger/spam/${encodeURIComponent(psid)}`
  );
}

export function blockInstagram(instagramScopedId: string) {
  return api.post(
    `/Webhook/instagram/blocks/${encodeURIComponent(instagramScopedId)}`
  );
}

export function unblockInstagram(instagramScopedId: string) {
  return api.delete(
    `/Webhook/instagram/blocks/${encodeURIComponent(instagramScopedId)}`
  );
}

export function moveInstagramToSpam(instagramScopedId: string) {
  return api.post(
    `/Webhook/instagram/spam/${encodeURIComponent(instagramScopedId)}`
  );
}

export async function DownloadMedia(
  fileName: string
) {
  const response = await api.get(`Media/${fileName}`, {
    responseType: 'blob',
  })
  return response;
}