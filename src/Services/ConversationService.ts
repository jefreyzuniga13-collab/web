import api from "@/Utils/ApiConfig";
import type {
  ConversationDto,
  UpdateConversationRequest,
  ConversationHistoryDto,
} from "@/Interfaces/Chat/ChatInterfaces";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { AdminAsigmentResponseTimeResponseDto, AverageAssignmentTimeResponseDto, ConversationStatusCountResponseDto, FilterForm, ResponseAgentAverageResponseDto, WaitingClientResponseDto } from "@/Interfaces/Dashboard/DashboardInterfaces";
import type { PagedResponse } from "@/Interfaces/GlobalInterface";
// import { formatoNicaragua } from "@/Utils/LocalDateFormat";

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

//Por que no se enviand siempre todas las propiedades
//Filtrar en base a todos los campos
class ConversationServ {
  private normalizeFilters(filters: FilterForm) {
    return Object.entries(filters).reduce((acc, [key, val]) => {
      acc[key] = val == null ? "" : val;
      return acc;
    }, {} as Record<string, string | number | boolean>);
  }

  async getByDateRange(
    filters: FilterForm
  ): Promise<ConversationStatusCountResponseDto[]> {
    const params = this.normalizeFilters(filters);
    const { data } = await api.get<ApiResponse<ConversationStatusCountResponseDto[]>>(
      "/Conversations/dateRange",
      { params }
    );
    return data.data;
  }

  async getAverageAssigmentAdminTime(
    filters: FilterForm
  ): Promise<AdminAsigmentResponseTimeResponseDto[]> {
    filters.customerId = null;
    filters.startTime = null;
    filters.endTime = null;
    const params = this.normalizeFilters(filters);
    const { data } = await api.get<ApiResponse<AdminAsigmentResponseTimeResponseDto[]>>(
      "/Conversations/adminAverage",
      { params }
    );
    return data.data;
  }

  async getAverageAssignmentTime(
    filters: FilterForm
  ): Promise<AverageAssignmentTimeResponseDto[]> {
    filters.adminUserId = null;
    const params = this.normalizeFilters(filters);
    const { data } = await api.get<ApiResponse<AverageAssignmentTimeResponseDto[]>>(
      "/Conversations/agentAverage",
      { params }
    );
    return data.data;
  }

  async getByState(
    state: string,
    filters: FilterForm,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ConversationDto>> {
    const params = {
      ...this.normalizeFilters(filters),
      PageNumber: page,
      PageSize: pageSize
    };
    const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
      `/Conversations/${encodeURIComponent(state)}/getByState`,
      { params }
    );
    return data.data;
  }

  async getByStateWithOut(
    stateWithOut: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ConversationDto>> {
    const params = {
      PageNumber: page,
      PageSize: pageSize
    };
    const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
      `/Conversations/${encodeURIComponent(stateWithOut)}/getBystateWithout`,
      { params }
    );
    return data.data;
  }

  async getWaitingClient(
    filters: FilterForm,
    page: number,
    pageSize: number,
    criticalMinutes: number
  ): Promise<PagedResponse<WaitingClientResponseDto>> {
    filters.adminUserId = null;
    const params = {
      ...this.normalizeFilters(filters),
      criticalMinutes,
      PageNumber: page,
      PageSize: pageSize
    };
    const { data } = await api.get<ApiResponse<PagedResponse<WaitingClientResponseDto>>>(
      "/Conversations/getClientWaiting",
      { params }
    );
    return data.data;
  }

  async responseAgentAverageAsync(
    filters: FilterForm
  ): Promise<ResponseAgentAverageResponseDto> {
    filters.adminUserId = null;
    const params = this.normalizeFilters(filters);
    const { data } = await api.get<ApiResponse<ResponseAgentAverageResponseDto>>(
      "/Conversations/responseAgentAverageAsync",
      { params }
    );
    return data.data;
  }

  async getConversationByClient(
    filters: FilterForm,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ConversationDto>> {
    const params = {
      ...this.normalizeFilters(filters),
      PageNumber: page,
      PageSize: pageSize
    };
    const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
      "/Conversations/getConversationByClient",
      { params }
    );
    return data.data;
  }
}

export const ConversationService = new ConversationServ();
