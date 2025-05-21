import api from '@/Utils/ApiConfig';
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';

export function getConversationsByRole() {
  return api.get<{ data: ConversationDto[] }>('/Conversations/getByRole');
}

export function getConversation(id: number) {
  return api.get<{ data: ConversationDto }>(`/Conversations/${id}`);
}

export function getPendingConversations() {
  return api.get<{ data: ConversationDto[] }>('/Conversations/pending');
}

// export function startConversation(payload: { /* tu DTO */ }) {
//   return api.post<{ data: ConversationDto }>('/Conversations', payload);
// }

export function assignAgent(
  conversationId: number,
  agentUserId: string,
  status: string
) {
  return api.put(
    `/Conversations/${conversationId}/assign`,
    null,
    { params: { agentUserId, status } }
  );
}

export function closeConversation(conversationId: number) {
  return api.put(`/Conversations/${conversationId}/close`);
}

export function updateConversationTags(
  conversationId: number,
  tagIds: number[]
) {
  return api.put(
    `/Conversations/${conversationId}`,
    { TagIds: tagIds },
    { params: { } }
  )
}