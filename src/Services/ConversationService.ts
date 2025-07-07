import api from "@/Utils/ApiConfig";
import type {
  ConversationDto,
  UpdateConversationRequest,
  ConversationHistoryDto,
} from "@/Interfaces/Chat/ChatInterfaces";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { AverageAssignmentTimeResponseDto, ConversationStatusCountResponseDto } from "@/Interfaces/Dashboard/DashboardInterfaces";

export function getConversationsByRole() {
  return api.get<{ data: ConversationDto[] }>("/Conversations/getByRole");
}

export function getConversation(id: number) {
  return api.get<{ data: ConversationDto }>(`/Conversations/${id}`);
}

export async function getConversationToneAsync(id: number) {
  const data = await api.get<ApiResponse<number>>(`/Conversations/${id}/tone`);
  return data.data.data;
}

export function getPendingConversations() {
  return api.get<{ data: ConversationDto[] }>("/Conversations/pending");
}

export function assignAgent(
  conversationId: number,
  agentUserId: string,
  status: string
) {
  return api.put(`/Conversations/${conversationId}/assign`, null, {
    params: { agentUserId, status },
  });
}

export function closeConversation(conversationId: number) {
  return api.put(`/Conversations/${conversationId}/close`);
}

export function getAssignedCount(agentUserId: number) {
  return api.get<number>(`/Conversations/${agentUserId}/assigned-count`);
}
export function updateConversation(
  conversationId: number,
  payload: Partial<UpdateConversationRequest>
) {
  return api.put(`/Conversations/${conversationId}`, payload);
}

export function updateTag(conversationId: number, payload: string[]) {
  return api.put(`/Conversations/tags/${conversationId}`, payload);
}

/**
 * Trae todas las conversaciones + mensajes + attachments de un contacto
 */
export function getHistoryByContact(contactId: number) {
  console.log("Contactos Id: ", contactId);
  return api.get<{ data: ConversationHistoryDto[] }>(
    `/Conversations/${contactId}/history`
  );
}

export function summarizeAllByContact(contactId: number) {
  return api.post<{ data: string }>(`/Conversations/${contactId}/summary`);
}

//Update conversation assigment status by id
export function updateConversationState(payload: {
  conversationId: number;
  assignmentStatus: "Assigned" | "Rejected";
  justification?: string;
}) {
  return api.put(`/Conversations/assignment`, payload);
}

export function respondAssignment(
  conversationId: number,
  accepted: boolean,
  comment?: string
) {
  return api.post(`/Conversations/${conversationId}/respond`, {
    accepted,
    comment,
  });
}

export function forceAssign(
  conversationId: number,
  forced: boolean,
  assignmentComment: string
) {
  return api.post(`/Conversations/${conversationId}/force`, {
    forced,
    assignmentComment,
  });
}

export function markConversationRead(conversationId: number) {
  return api.post<void>(`/Conversations/${conversationId}/mark-read`);
}

class ConversationServ {

  async getByDateRange(
    from: Date,
    to:   Date
  ): Promise<ConversationStatusCountResponseDto[]> {
    const { data } = await api.get<ApiResponse<ConversationStatusCountResponseDto[]>>(
      "/Conversations/dateRange",
      {
        params: {
          from: from.toISOString(),
          to:   to.toISOString(),
        },
      }
    );

    return data.data;
  }

  
  async getAverageAssignmentTime(
  ): Promise<AverageAssignmentTimeResponseDto[]> {
    const { data } = await api.get<ApiResponse<AverageAssignmentTimeResponseDto[]>>("/Conversations/agentAverage");

    return data.data;
  }
}

export const ConversationService = new ConversationServ();
