import api from "@/Utils/ApiConfig";

import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { AgentDto } from "@/Interfaces/Chat/ChatInterfaces";
import type { AssignableAgent } from "@/Interfaces/Chat/BulkAssignmentInterface";

/**
 * Se conserva por compatibilidad con los componentes
 * que consumen directamente la petición Axios.
 */
export function getAgents() {
  return api.get<ApiResponse<AgentDto[]>>(
    "/Users/agents?role=Support",
  );
}

class AgentServiceClass {
  async getAgentsAsync(): Promise<AgentDto[]> {
    const { data } = await api.get<ApiResponse<AgentDto[]>>(
      "/Users/agents?role=Support",
    );

    return data.data ?? [];
  }

  async agentOnlineAsync(): Promise<AgentDto[]> {
    const { data } = await api.get<ApiResponse<AgentDto[]>>(
      "/Users/agentOnline",
    );

    return data.data ?? [];
  }

  async getAssignableAgentsAsync(): Promise<AssignableAgent[]> {
    const [agents, onlineAgents] = await Promise.all([
      this.getAgentsAsync(),
      this.agentOnlineAsync(),
    ]);

    const onlineAgentIds = new Set(
      onlineAgents
        .map((agent) => Number(agent.userId))
        .filter((agentId) => agentId > 0),
    );

    return agents
      .filter((agent) => Number(agent.userId) > 0)
      .map((agent) => ({
        id: Number(agent.userId),
        name: agent.fullName?.trim() || `Agente ${agent.userId}`,
        email: agent.email?.trim() || null,
        imageUrl: agent.imageUrl?.trim() || null,
        isOnline: onlineAgentIds.has(Number(agent.userId)),

        /**
         * El endpoint /Users/agents?role=Support
         * devuelve los agentes disponibles del rol.
         */
        isActive: true,
      }));
  }
}

export const AgentService = new AgentServiceClass();