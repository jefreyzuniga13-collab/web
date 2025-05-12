import type { AgentDto, AttachmentDto, ConversationDto, MessageDto } from '@/Interfaces/Chat/ChatInterfaces'
import axios, { type AxiosInstance } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? 'http://pcgadmin-001-site3.ntempurl.com/'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 50_000,
})


export function getConversations() {
  return api.get<{ data: ConversationDto[] }>('/conversations')
}

export function getConversation(id: number) {
  return api.get<{ data: ConversationDto }>(`/conversations/${id}`)
}


export function getMessages(conversationId: number) {
  return api.get<{ data: MessageDto[] }>(`/conversations/${conversationId}/messages`)
}

export function sendText(
  conversationId: number,
  to: string,
  body: string
) {
  return api.post<{ data: string }> (
    `/WhatsappWebhook/${conversationId}/send`,
    { to, body }
  )
}

export function sendMedia(
  conversationId: number,
  to: string,
  mediaId: string,
  mimeType: string,
  caption?: string
) {
  return api.post<{ data: string }>(
    `/WhatsappWebhook/${conversationId}/send`,
    { to, mediaId, mimeType, caption }
  )
}

export function uploadAttachment(form: FormData) {
  return api.post<{ data: unknown }>('/Attachments', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function getAttachments(messageId: number) {
  return api.get<{ data: AttachmentDto[] }>(`/Attachments/message/${messageId}`)
}

// Agentes (filtrado por rol "Support")
export function getAgents() {
  return api.get<{ data: AgentDto[] }>('/Users/agents?role=Support')
}

// Asignar agente
export function assignAgent(
  conversationId: number,
  agentUserId: string,
  status: string = 'Human'      // o 'WaitingHuman' según tu lógica
) {
  return api.patch(`/conversations/${conversationId}`, null, {
    params: { agentUserId, status }
  })
}

// Compañías
export function getCompanies() {
  return api.get<{ data: { companyId: number; name: string }[] }>('/companies')
}

export default api