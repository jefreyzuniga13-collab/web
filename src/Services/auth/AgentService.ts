import api from '@/Utils/ApiConfig';
import type { AgentDto } from '@/Interfaces/Chat/ChatInterfaces';
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface';

export function getAgents() {
  return api.get<{ data: AgentDto[] }>('/Users/agents?role=Support');
}

class AgentServi {
  async getAgentsAsync(): Promise<AgentDto[]> {
    const {data} = await api.get<ApiResponse<AgentDto[]>>('/Users/agents?role=Support');
    return data.data;
  }

  async agentOnlineAsync(): Promise<AgentDto[]> {
    const {data} = await api.get<ApiResponse<AgentDto[]>>('/Users/agentOnline');
    return data.data;
  }

}

export const AgentService = new AgentServi();