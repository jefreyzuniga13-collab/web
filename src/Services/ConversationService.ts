import api from "@/Utils/ApiConfig";
import type {
  ConversationDto,
  UpdateConversationRequest,
  ConversationHistoryDto,
  ConversationClientFilter,
} from "@/Interfaces/Chat/ChatInterfaces";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { AdminAsigmentResponseTimeResponseDto, AverageAssignmentTimeResponseDto, ConversationRatingByAgents, ConversationStatusCountResponseDto, FilterForm, ResponseAgentAverageResponseDto, WaitingClientResponseDto } from "@/Interfaces/Dashboard/DashboardInterfaces";
import type { PagedResponse } from "@/Interfaces/GlobalInterface";
import type { exportPDFArgs } from "@/Interfaces/Chat/ConversationInterface";

import {format} from 'date-fns'

const toPascal = (s: string) => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;


// function toISOStringSafe(value: string | Date | null | undefined): string | null {
//   if (!value) return null;
//   const d = value instanceof Date ? value : new Date(value);
//   return isNaN(d.getTime()) ? null : d.toISOString();
// }


export function getConversation(id: number) {
  return api.get<{ data: ConversationDto }>(`/Conversations/${id}`);
}

export async function getConversationToneAsync(id: number) {
  const data = await api.get<ApiResponse<number>>(`/Conversations/${id}/tone`);
  return data.data.data;
}
export async function SetHaltedConversation(id: number) {
  const data = await api.patch<ApiResponse<number>>(`/Conversations/SetHaltedConversation/${id}`);
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
export function getHistoryByContact(contactId: number, startDate: Date, endDate: Date) {

  return api.get<{ data: ConversationHistoryDto[] }>(
    `/Conversations/${contactId}/history`,
    {
      params: {
        startDate,
        endDate
      }
    }
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
  assignmentComment: string,
  assignedAgentName?: string
) {

  return api.post(`/Conversations/${conversationId}/force`, {
    forced,
    assignmentComment,
    assignedAgentName,
  });
}

export function markConversationRead(conversationId: number) {
  return api.post<void>(`/Conversations/${conversationId}/mark-read`);
}

class ConversationServ {
      private buildContactsQuery(contactsId: number[]) {
        const qs = new URLSearchParams();
        (contactsId ?? [])
          .filter(id => Number.isFinite(id))
          .forEach(id => qs.append("contactsId", String(id)));
        return qs.toString();
      }

      async getByContacts(
        contactsId: number[],
        page: number = 1,
        pageSize: number = 10,
        from?: Date,
        to?: Date,
        searchContent?: string
      ): Promise<PagedResponse<ConversationDto>> {
        const contactsQs = this.buildContactsQuery(contactsId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: Record<string, any> = {
          PageNumber: page,
          PageSize: pageSize
        };
        
        if (from) params.from = from.toISOString();
        if (to) params.to = to.toISOString();
        if (searchContent && searchContent.trim() !== "") {
          params.searchContent = searchContent.trim();
        }

        const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
          `/Conversations/getByContacts${contactsQs ? `?${contactsQs}` : ""}`,
          { params }
        );
        return data.data;
      }

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

  // async getByStateWithOut(
  //   stateWithOut: string,
  //   page: number,
  //   pageSize: number
  // ): Promise<PagedResponse<ConversationDto>> {
  //   const params = {
  //     PageNumber: page,
  //     PageSize: pageSize
  //   };
  //   const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
  //     `/Conversations/${encodeURIComponent(stateWithOut)}/getBystateWithout`,
  //     { params }
  //   );
  //   return data.data;
  // }

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

  async GetConversationByClientPaginationAsync(
    filters: ConversationClientFilter,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ConversationDto>> {
    const params = {
      ...filters, // incluye clientCode, from, to, searchConversation
      PageNumber: page,
      PageSize: pageSize,
    };

    const { data } =
      await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
        '/Conversations/getConversationByClientPag',
        { params }
      );

    return data.data;
  }

  async getConversationByDate(
    from: Date,
    to: Date,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ConversationDto>> {


    const { data } = await api.post<ApiResponse<PagedResponse<ConversationDto>>>(
      "/Conversations/getConversationByDate",
      {
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
          PageNumber: page,
          PageSize: pageSize
        }
      }
    );
    return data.data;
  }

  async getRatingConversation(
    page: number,
    pageSize: number,
    agentId?: number
  ): Promise<PagedResponse<ConversationDto>> {

    const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
      "/Conversations/ratingConversation",
      {
        params: {
          PageNumber: page,
          PageSize: pageSize,
          agentId: agentId || null
        }
      }
    );
    return data.data;
  }

  async getConversationRatingByAgents(
    agentId?: number
  ): Promise<ConversationRatingByAgents[]> {

    const { data } = await api.get<ApiResponse<ConversationRatingByAgents[]>>(
      "/Conversations/ratingByAgents",
      {
        params: {
          agentId: agentId || null
        }
      }
    );
    return data.data;
  }

  // async getConversationsByRole(
  //   from?: Date,
  //   to?: Date,
  //   page: number = 1,
  //   pageSize: number = 10
  // ): Promise<PagedResponse<ConversationDto>> {
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   const params: Record<string, any> = { pageNumber: page, pageSize }
  //   if (from) params.from = from.toISOString()
  //   if (to)   params.to   = to.toISOString()

  //   const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
  //     "/Conversations/getByRole",
  //     { params }
  //   )
  //   return data.data
  // }

  async getConversationsByRole(
    from?: Date,
    to?: Date,
    searchConversation?: string,
    page: number = 1,
    pageSize: number = 10,
    state?: string
  ): Promise<PagedResponse<ConversationDto>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = { pageNumber: page, pageSize };
    if (from) params.from = from.toISOString();
    if (to) params.to = to.toISOString();
    if (searchConversation != '') params.searchConversation = searchConversation;
    if (state && state !== 'all') params.state = toPascal(state);

    const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
      "/Conversations/getByRole", { params }
    );
    return data.data;
  }

  async getConversationsByContact(
    from?: Date,
    to?: Date,
    contactId?: number,
    q?: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PagedResponse<ConversationDto>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: Record<string, any> = { pageNumber: page, pageSize }
    if (from) params.from = from.toISOString()
    if (to) params.to = to.toISOString()
    if (contactId && contactId > 0) params.contactId = contactId
    if (q && q.trim() !== '') params.searchConversation = q.trim()

    const { data } = await api.get<ApiResponse<PagedResponse<ConversationDto>>>(
      '/Conversations/getByContact',
      { params }
    )
    return data.data
  }

}

// Las fechas no llegan a ser aceptable por endpoint de asp net core web api, no acceptable me da
export  async function exportChatPdfByContact(  
  { contactId, from, to, title, subtitle }: exportPDFArgs
    ): Promise<void> {

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = {
        title,
        subtitle,
      };

      if (from) {
        const d = typeof from === "string" ? new Date(from) : from;
        body.from = format(d, "yyyy-MM-dd");
      }

      if (to) {
        const d = typeof to === "string" ? new Date(to) : to;
        body.to = format(d, "yyyy-MM-dd");
      }


  const res = await api.post<ArrayBuffer>(
    `/Conversations/export/pdf/chat/${encodeURIComponent(contactId)}`,
    body,
    {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/pdf',
        'Content-Type': 'application/json'
      },
      transformResponse: [(data) => data],
      validateStatus: (s) => s >= 200 && s < 300
    }
  );

  //convertir los byte en  archivo pdf
  const blob = new Blob([res.data], { type: 'application/pdf' });

  const cd = (res.headers['content-disposition'] ||
              res.headers['Content-Disposition']) as string | undefined;

  const suggested =
    (cd && /filename\*?=(?:UTF-8'')?"?([^";]+)"?/.exec(cd)?.[1]) ||
    `conversaciones_chat_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = decodeURIComponent(suggested);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const ConversationService = new ConversationServ();