import type { AgentDto, ConversationDto, MessageDto } from '@/Interfaces/Chat/ChatInterfaces';
import axios, { type AxiosInstance } from 'axios'

// Base URL limpia (quita cualquier ‘/’ al final)
const BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ||
  'http://localhost:7108/api/v1'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 50_000,
})

export default api


export function getConversations() {
  return api.get<{ data: ConversationDto[] }>('/conversations');
}

export function getConversation(id: number) {
  return api.get<{ data: ConversationDto }>(`/conversations/${id}`);
}

export function getMessages(id: number) {
  return api.get<{ data: MessageDto[] }>(`/conversations/${id}/messages`);
}

export function getAgents() {
  return api.get<{ data: AgentDto[] }>('/users?role=db_agent');
}

export function assignAgent(
  conversationId: number,
  agentId: string,
  status: string
) {
  return api.patch(`/conversations/${conversationId}`, {
    assignedAgent: agentId,
    status
  });
}

export function sendText(
  conversationId: number,
  senderId: string,
  content: string
) {
  const form = new FormData();
  form.append('senderId', senderId);
  form.append('content', content);
  form.append('messageType', 'Text');
  return api.post(`/conversations/${conversationId}/messages`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function sendFile(
  conversationId: number,
  senderId: string,
  file: File,
  caption?: string
) {
  const form = new FormData();
  form.append('senderId', senderId);
  form.append('file', file);
  form.append('messageType', 'Media');
  if (caption) form.append('caption', caption);
  return api.post(`/conversations/${conversationId}/messages`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}


export function getCompanies() {
  return api.get<{ data: { companyId: number; name: string }[] }>('/Companies');
}
