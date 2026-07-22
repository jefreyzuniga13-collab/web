import api from "@/Utils/ApiConfig"
import type {
  MessageDto,
  SendInteractiveMessajeRequestDto,
  SentMessage,
  SendMediaFromUrlDto,
} from "@/Interfaces/Chat/ChatInterfaces"
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface"
import type { PagedResponse } from "@/Interfaces/Common/GlobalInterface"
import { formatInTimeZone } from "date-fns-tz"

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

const TIME_ZONE = "America/Managua"

const formatDateToNicaragua = (date: Date | null): string | null => {
  if (!date) return null

  return formatInTimeZone(date, TIME_ZONE, "yyyy-MM-dd")
}

const normalizeNestedMessage = (
  message: MessageDto
): MessageDto => {
  return {
    ...message,
    attachments: Array.isArray(message.attachments)
      ? message.attachments
      : [],
    contact: Array.isArray(message.contact)
      ? message.contact
      : [],
    referral: message.referral ?? null,
  }
}

export const normalizeMessage = (
  message: MessageDto
): MessageDto => {
  return {
    ...normalizeNestedMessage(message),
    repliedMessage: message.repliedMessage
      ? normalizeNestedMessage(message.repliedMessage)
      : null,
  }
}

const normalizePagedMessages = (
  response: PagedResponse<MessageDto>
): PagedResponse<MessageDto> => {
  return {
    ...response,
    items: Array.isArray(response.items)
      ? response.items.map(normalizeMessage)
      : [],
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
  if (conversationId <= 0) {
    throw new Error("El conversationId debe ser mayor que cero.")
  }

  const from = formatDateToNicaragua(validFrom)
  const to = formatDateToNicaragua(validTo)

  const params: MessageQueryParams = {
    agentId: agentId > 0 ? agentId : 0,
    pageNumber: pageNumber > 0 ? pageNumber : 1,
    pageSize: Math.min(Math.max(pageSize, 1), 100),
  }

  if (from) params.from = from
  if (to) params.to = to

  const { data } = await api.get<
    ApiResponse<PagedResponse<MessageDto>>
  >(`/conversations/${conversationId}/messages`, { params })

  return normalizePagedMessages(data.data)
}

export function sendText(message: SentMessage) {
  return api.post<ApiResponse<MessageDto>>(
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

export function sendInteractiveMessage(
  request: SendInteractiveMessajeRequestDto
) {
  return api.post<ApiResponse<MessageDto>>(
    "/Webhook/sendInterctiveMessage",
    request
  )
}

// Compatibilidad con el nombre anterior.
export const sendInterctiveMessage = sendInteractiveMessage

export function sendMediaECommerceFromUrl(
  conversationId: number,
  payload: SendMediaFromUrlDto
) {
  return api.post<ApiResponse<MessageDto>>(
    `/Webhook/${conversationId}/sendEcommerce/media-from-url`,
    payload
  )
}

// Compatibilidad con el nombre anterior.
export const SendMediaECommerceFromUrlAsync =
  sendMediaECommerceFromUrl

export function sendMediaEcommerce(
  conversationId: number,
  file: File,
  caption?: string,
  externalId?: string | null,
  repliedParentMessageId?: number | null
) {
  const form = buildMediaForm(
    file,
    caption,
    externalId,
    repliedParentMessageId
  )

  return api.post<ApiResponse<MessageDto>>(
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
  const form = buildMediaForm(
    file,
    caption,
    externalId,
    repliedParentMessageId
  )

  return api.post<ApiResponse<MessageDto>>(
    `/Webhook/${conversationId}/send/media`,
    form,
    {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  )
}

const buildMediaForm = (
  file: File,
  caption?: string,
  externalId?: string | null,
  repliedParentMessageId?: number | null
): FormData => {
  const form = new FormData()

  form.append("file", file)

  if (caption?.trim()) {
    form.append("caption", caption)
  }

  if (externalId?.trim()) {
    form.append("externalId", externalId)
  }

  if (
    repliedParentMessageId !== null &&
    repliedParentMessageId !== undefined
  ) {
    form.append(
      "repliedParentMessageId",
      String(repliedParentMessageId)
    )
  }

  return form
}

export function blockWhatsapp(waId: string) {
  return api.post(
    `/Webhook/blocks/${encodeURIComponent(waId)}`
  )
}

export function unblockWhatsapp(waId: string) {
  return api.delete(
    `/Webhook/blocks/${encodeURIComponent(waId)}`
  )
}

export function blockMessenger(psid: string) {
  return api.post(
    `/Webhook/messenger/blocks/${encodeURIComponent(psid)}`
  )
}

export function unblockMessenger(psid: string) {
  return api.delete(
    `/Webhook/messenger/blocks/${encodeURIComponent(psid)}`
  )
}

export function moveMessengerToSpam(psid: string) {
  return api.post(
    `/Webhook/messenger/spam/${encodeURIComponent(psid)}`
  )
}

export function blockInstagram(instagramScopedId: string) {
  return api.post(
    `/Webhook/instagram/blocks/${encodeURIComponent(
      instagramScopedId
    )}`
  )
}

export function unblockInstagram(instagramScopedId: string) {
  return api.delete(
    `/Webhook/instagram/blocks/${encodeURIComponent(
      instagramScopedId
    )}`
  )
}

export function moveInstagramToSpam(
  instagramScopedId: string
) {
  return api.post(
    `/Webhook/instagram/spam/${encodeURIComponent(
      instagramScopedId
    )}`
  )
}

export async function downloadMedia(fileName: string) {
  return api.get<Blob>(
    `Media/${encodeURIComponent(fileName)}`,
    {
      responseType: "blob",
    }
  )
}

// Compatibilidad con el nombre anterior.
export const DownloadMedia = downloadMedia