import api from "@/Utils/ApiConfig";
import type {
  ConversationDto,
  UpdateConversationRequest,
  ConversationHistoryDto,
} from "@/Interfaces/Chat/ChatInterfaces";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { AdminAsigmentResponseTimeResponseDto, AverageAssignmentTimeResponseDto, ConversationStatusCountResponseDto, FilterForm, ResponseAgentAverageResponseDto, WaitingClientResponseDto } from "@/Interfaces/Dashboard/DashboardInterfaces";
import type { PagedResponse } from "@/Interfaces/GlobalInterface";
import { formatoNicaragua } from "@/Utils/LocalDateFormat";

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
    form: FilterForm
  ): Promise<ConversationStatusCountResponseDto[]> {
    const { data } = await api.get<ApiResponse<ConversationStatusCountResponseDto[]>>(
      "/Conversations/dateRange",
      {
        params: {
          from: form.from,
          to:   form.to,
        },
      }
    );

    return data.data;
  }
  
  async getAverageAssigmentAdminTime(
    form: FilterForm
  ): Promise<AdminAsigmentResponseTimeResponseDto[]>{
    const {data} = await api.get<ApiResponse<AdminAsigmentResponseTimeResponseDto[]>>
    ("conversations/adminAverage", {
      params:{
         from: form.from,
          to:   form.to,
      }
    })
    return data.data;
  }


  async getAverageAssignmentTime(
    form: FilterForm
  ): Promise<AverageAssignmentTimeResponseDto[]> {
    const { data } = await api.get<ApiResponse<AverageAssignmentTimeResponseDto[]>>("/Conversations/agentAverage",
            {
        params: {
          from: form.from,
          to:   form.to,
        },
      }
    );

    return data.data;
  }

  async getByState(
    state: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ConversationDto>> {
    const { data } = await api.get<
      ApiResponse<PagedResponse<ConversationDto>>
    >(
      `/Conversations/${encodeURIComponent(state)}/getByState`,
      {
        params: {
          PageNumber: page,
          PageSize: pageSize,
        },
      }
    );
    return data.data;
  }
  
  async getWaitingClient(
  filters: FilterForm
  ): Promise<WaitingClientResponseDto[]> {
  const normalized = {
    ...filters,
    from: typeof filters.from === 'string' ? filters.from : formatoNicaragua(filters.from as Date),
    to:   typeof filters.to   === 'string' ? filters.to   : formatoNicaragua(filters.to   as Date)
  }
  const { data } = await api.get<ApiResponse<WaitingClientResponseDto[]>>(
    `/Conversations/getClientWaiting`,
    { params: normalized }
  )
  return data.data
}

  async responseAgentAverageAsync(
    filters: FilterForm
    ): Promise<ResponseAgentAverageResponseDto> {
    const normalized = {
      ...filters,
      from: typeof filters.from === 'string' ? filters.from : formatoNicaragua(filters.from as Date),
      to:   typeof filters.to   === 'string' ? filters.to   : formatoNicaragua(filters.to   as Date)
    }
    const { data } = await api.get<ApiResponse<ResponseAgentAverageResponseDto>>(
      `/Conversations/responseAgentAverageAsync`,
      { params: normalized }
    )
    return data.data
  }
}

export const ConversationService = new ConversationServ();
