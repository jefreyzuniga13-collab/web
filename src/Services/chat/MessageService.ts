import api from "@/Utils/ApiConfig"
import type {
  MessageDto,
  SendInteractiveMessajeRequestDto,
  SentMessage,
  SendMediaFromUrlDto,
} from "@/Interfaces/Chat/ChatInterfaces"
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface"
import type { PagedResponse } from "@/Interfaces/Common/GlobalInterface"
import { toZonedTime, format } from "date-fns-tz"

export type GetMessagesParams = {
  conversationId: number
  validFrom: Date | null
  validTo: Date | null
  agentId: number
  pageNumber?: number
  pageSize?: number
}

type MessageQueryParams = {
  agentId: number
  pageNumber: number
  pageSize: number
  from?: string
  to?: string
}

type MessageApiPayload = PagedResponse<MessageDto> | MessageDto[]

const TIME_ZONE = "America/Managua"

const formatDateToNicaragua = (date: Date | null): string | null => {
  if (date === null) return null

  const zonedDate = toZonedTime(date, TIME_ZONE)

  return format(zonedDate, "yyyy-MM-dd", { timeZone: TIME_ZONE })
}

const isPagedMessages = (
  payload: MessageApiPayload
): payload is PagedResponse<MessageDto> => {
  return !Array.isArray(payload) && Array.isArray(payload.items)
}

const buildFallbackPagedMessages = (
  items: MessageDto[],
  pageNumber: number,
  pageSize: number
): PagedResponse<MessageDto> => {
  return {
    items,
    meta: {
      currentPage: pageNumber,
      totalPages: 1,
      totalCount: items.length,
      pageSize,
    },
  }
}

export async function getMessages({
  conversationId,
  validFrom,
  validTo,
  agentId,
  pageNumber = 1,
  pageSize = 30,
}: GetMessagesParams): Promise<PagedResponse<MessageDto>> {
  const from = formatDateToNicaragua(validFrom)
  const to = formatDateToNicaragua(validTo)

  const params: MessageQueryParams = {
    agentId: agentId > 0 ? agentId : 0,
    pageNumber,
    pageSize,
  }

  // Aplica fecha inicial.
  if (from !== null) {
    params.from = from
  }

  // Aplica fecha final.
  if (to !== null) {
    params.to = to
  }

  const { data } = await api.get<ApiResponse<MessageApiPayload>>(
    `/conversations/${conversationId}/messages`,
    { params }
  )

  // Soporta API actual sin paginación.
  if (!isPagedMessages(data.data)) {
    return buildFallbackPagedMessages(data.data, pageNumber, pageSize)
  }

  return data.data
}

export function sendText(message: SentMessage) {
  return api.post<{ data: MessageDto }>(
    `/Webhook/${message.conversationId}/send`,
    {
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      messageType: "Text",
      externalId: message.externalId,
      repliedParentMessageId: message.repliedParentMessageId,
    }
  )
}

export function sendInterctiveMessage(req: SendInteractiveMessajeRequestDto) {
  return api.post<{ data: MessageDto }>(`/Webhook/sendInterctiveMessage`, req)
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

  if (caption) {
    form.append("caption", caption)
  }

  if (externalId) {
    form.append("externalId", externalId)
  }

  if (repliedParentMessageId !== null && repliedParentMessageId !== undefined) {
    form.append("repliedParentMessageId", String(repliedParentMessageId))
  }

  return api.post(`/Webhook/${conversationId}/sendEcommerce/media`, form, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
}

export function sendMedia(
  conversationId: number,
  file: File,
  caption?: string,
  externalId?: string | null,
  repliedParentMessageId?: number | null
) {
  const form = new FormData()

  form.append("file", file)

  if (caption) {
    form.append("caption", caption)
  }

  if (externalId) {
    form.append("externalId", externalId)
  }

  if (repliedParentMessageId !== null && repliedParentMessageId !== undefined) {
    form.append("repliedParentMessageId", String(repliedParentMessageId))
  }

  return api.post<{ data: MessageDto }>(
    `/Webhook/${conversationId}/send/media`,
    form,
    {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  )
}

export function blockWhatsapp(waId: string) {
  return api.post(`/Webhook/blocks/${encodeURIComponent(waId)}`)
}

export function unblockWhatsapp(waId: string) {
  return api.delete(`/Webhook/blocks/${encodeURIComponent(waId)}`)
}

export function blockMessenger(psid: string) {
  return api.post(`/Webhook/messenger/blocks/${encodeURIComponent(psid)}`)
}

export function unblockMessenger(psid: string) {
  return api.delete(`/Webhook/messenger/blocks/${encodeURIComponent(psid)}`)
}

export function moveMessengerToSpam(psid: string) {
  return api.post(`/Webhook/messenger/spam/${encodeURIComponent(psid)}`)
}

export function blockInstagram(instagramScopedId: string) {
  return api.post(
    `/Webhook/instagram/blocks/${encodeURIComponent(instagramScopedId)}`
  )
}

export function unblockInstagram(instagramScopedId: string) {
  return api.delete(
    `/Webhook/instagram/blocks/${encodeURIComponent(instagramScopedId)}`
  )
}

export function moveInstagramToSpam(instagramScopedId: string) {
  return api.post(
    `/Webhook/instagram/spam/${encodeURIComponent(instagramScopedId)}`
  )
}

export async function DownloadMedia(fileName: string) {
  const response = await api.get(`Media/${fileName}`, {
    responseType: "blob",
  })

  return response
}