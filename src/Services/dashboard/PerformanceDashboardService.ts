import api from "@/Utils/ApiConfig";
import type { ApiResponse } from "@/Interfaces/Auth/UserInterfaces";
import type {
  DashboardAgentAverageResponseByAgentProj,
  DashboardAgentAverageResponseTopClientProj,
  DashboardAssignmentResponseTimeByAdminProj,
  DashboardAssignmentResponseTimeGlobalProj,
  DashboardIndicatorsByAgentProj,
  DashboardIndicatorsProj,
  DashboardRatingByAgentProj,
  DashboardRatingGlobalProj,
  DashboardWaitingClientProj,
  FilterDashboard,
} from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";

class PerformanceDashboardService {
  private readonly baseUrl = "/PerformaceDashboard";

  private buildFilterParams(filters?: FilterDashboard) {
    return {
      from: filters?.from ?? null,
      to: filters?.to ?? null,
      agentId: filters?.agentId ?? null
    };
  }

  async getDashboardIndicatorsGlobal(
    filters: FilterDashboard
  ): Promise<DashboardIndicatorsProj | null> {
    const { data } = await api.get<ApiResponse<DashboardIndicatorsProj | null>>(
      `${this.baseUrl}/getDashboardIndicatorsGlobal`,
      {
        params: this.buildFilterParams(filters),
      }
    );

    return data.data;
  }

  async getDashboardIndicatorsByAgent(
    filters: FilterDashboard
  ): Promise<DashboardIndicatorsByAgentProj[]> {
    const { data } = await api.get<ApiResponse<DashboardIndicatorsByAgentProj[]>>(
      `${this.baseUrl}/getDashboardIndicatorsByAgent`,
      {
        params: this.buildFilterParams(filters),
      }
    );

    return data.data;
  }

  async getDashboardIndicatorsAgentDetail(
    filters: FilterDashboard,
    agentId: number
  ): Promise<DashboardIndicatorsByAgentProj | null> {
    const { data } = await api.get<ApiResponse<DashboardIndicatorsByAgentProj | null>>(
      `${this.baseUrl}/getDashboardIndicatorsAgentDetail`,
      {
        params: {
          ...this.buildFilterParams(filters),
          agentId,
        },
      }
    );

    return data.data;
  }

  async getDashboardConversationRatingGlobal(
    filters: FilterDashboard
  ): Promise<DashboardRatingGlobalProj | null> {
    const { data } = await api.get<ApiResponse<DashboardRatingGlobalProj | null>>(
      `${this.baseUrl}/getDashboardConversationRatingGlobal`,
      {
        params: this.buildFilterParams(filters),
      }
    );

    return data.data;
  }

  async getDashboardConversationRatingByAgent(
    filters: FilterDashboard,
    agentId = 0
  ): Promise<DashboardRatingByAgentProj[]> {
    const { data } = await api.get<ApiResponse<DashboardRatingByAgentProj[]>>(
      `${this.baseUrl}/getDashboardConversationRatingByAgent`,
      {
        params: {
          ...this.buildFilterParams(filters),
          agentId,
        },
      }
    );

    return data.data;
  }

  async getDashboardWaitingClientsGlobal(
    criticalMinutes: number,
    waitingStatus: number,
    humanStatus: number
  ): Promise<DashboardWaitingClientProj[]> {
    const { data } = await api.get<ApiResponse<DashboardWaitingClientProj[]>>(
      `${this.baseUrl}/getDashboardWaitingClientsGlobal`,
      {
        params: {
          criticalMinutes,
          waitingStatus,
          humanStatus,
        },
      }
    );

    return data.data;
  }

  async getDashboardWaitingClientsByAgent(
    agentId: number,
    criticalMinutes: number,
    waitingStatus: number,
    humanStatus: number
  ): Promise<DashboardWaitingClientProj[]> {
    const { data } = await api.get<ApiResponse<DashboardWaitingClientProj[]>>(
      `${this.baseUrl}/getDashboardWaitingClientsByAgent`,
      {
        params: {
          agentId,
          criticalMinutes,
          waitingStatus,
          humanStatus,
        },
      }
    );

    return data.data;
  }

  async getDashboardAssignmentResponseTimeGlobal(
    filters: FilterDashboard
  ): Promise<DashboardAssignmentResponseTimeGlobalProj | null> {
    const { data } = await api.get<ApiResponse<DashboardAssignmentResponseTimeGlobalProj | null>>(
      `${this.baseUrl}/getDashboardAssignmentResponseTimeGlobal`,
      {
        params: this.buildFilterParams(filters),
      }
    );

    return data.data;
  }

  async getDashboardAssignmentResponseTimeByAdmin(
    filters: FilterDashboard
  ): Promise<DashboardAssignmentResponseTimeByAdminProj[]> {
    const { data } = await api.get<ApiResponse<DashboardAssignmentResponseTimeByAdminProj[]>>(
      `${this.baseUrl}/getDashboardAssignmentResponseTimeByAdmin`,
      {
        params: this.buildFilterParams(filters),
      }
    );

    return data.data;
  }

  async getDashboardAgentAverageResponseTopClients(
    agentId: number,
    top = 10
  ): Promise<DashboardAgentAverageResponseTopClientProj[]> {
    const { data } = await api.get<ApiResponse<DashboardAgentAverageResponseTopClientProj[]>>(
      `${this.baseUrl}/getDashboardAgentAverageResponseTopClients`,
      {
        params: {
          agentId,
          top,
        },
      }
    );

    return data.data;
  }
  async getDashboardAgentAverageResponseByAgent(
  filters: FilterDashboard
): Promise<DashboardAgentAverageResponseByAgentProj[]> {
  const { data } = await api.get<
    ApiResponse<DashboardAgentAverageResponseByAgentProj[]>
  >(`${this.baseUrl}/getDashboardAgentAverageResponseByAgent`, {
    params: this.buildFilterParams(filters),
  });

  console.log("getDashboardAgentAverageResponseByAgent", data)
  return data.data ?? [];
}
}

export const performanceDashboardService = new PerformanceDashboardService();