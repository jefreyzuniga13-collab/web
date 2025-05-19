
import type { AgentDto, ConversationDto, MessageDto, SentMessage } from '@/Interfaces/Chat/ChatInterfaces';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:7108/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 50_000,
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getConversations() {
  return api.get<{ data: ConversationDto[] }>('/Conversations');
}

export function getPendingConversations() {
  return api.get<{ data: ConversationDto[] }>('/Conversations/pending');
}

export function getConversation(id: number) {
  return api.get<{ data: ConversationDto }>(`/Conversations/${id}`);
}

export function getMessages(conversationId: number) {
  return api.get<{ data: MessageDto[] }>(`/Conversations/${conversationId}/Messages`);
}

export function sendText(message: SentMessage) {
  return api.post<{ data: string }>(
    `/WhatsappWebhook/${message.conversationId}/send`,
    message
  );
}

export function uploadAttachment(form: FormData) {
  return api.post<{ data: unknown }>('/Attachments', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function getAttachments(messageId: number) {
  return api.get<{ data: MessageDto[] }>(`/Attachments/message/${messageId}`);
}

export function sendMediaMessage(conversationId: number, file: File, caption?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversationId', conversationId.toString());
  if (caption) formData.append('caption', caption);

  return api.post<{ data: string }>(
    `/WhatsappWebhook/${conversationId}/send-media`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

export function getAgents() {
  return api.get<{ data: AgentDto[] }>('/Users/agents?role=Support');
}

export function assignAgent(conversationId: number, agentUserId: string, status: string = 'Human') {
  return api.put(`/Conversations/${conversationId}/assign`, null, {
    params: { agentUserId, status }
  });
}

export function closeConversation(conversationId: number) {
  return api.put(`/Conversations/${conversationId}/close`);
}

export function getCompanies() {
  return api.get<{ data: { companyId: number; name: string }[] }>('/Companies');
}

export function getNotifications(page = 1, pageSize = 10) {
  return api.get(`/Notifications?PageNumber=${page}&PageSize=${pageSize}`);
}

export function getUnreadNotificationsCount() {
  return api.get<{ data: number }>('/Notifications/unread-count');
}

export function markNotificationAsRead(recipientId: number) {
  return api.put(`/Notifications/${recipientId}/read`);
}

export default api;
