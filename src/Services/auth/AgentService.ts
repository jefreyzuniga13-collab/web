import api from '@/Utils/ApiConfig'

import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { AgentDto } from '@/Interfaces/Chat/ChatInterfaces'
import type { AssignableAgent } from '@/Interfaces/Chat/BulkAssignmentInterface'

export function getAgents() {
  return api.get<{ data: AgentDto[] }>(
    '/Users/agents?role=Support'
  )
}

class AgentServi {
  async getAgentsAsync(): Promise<AgentDto[]> {
    const { data } = await api.get<
      ApiResponse<AgentDto[]>
    >('/Users/agents?role=Support')

    return data.data
  }

  async agentOnlineAsync(): Promise<AgentDto[]> {
    const { data } = await api.get<
      ApiResponse<AgentDto[]>
    >('/Users/agentOnline')

    return data.data
  }

  async getAssignableAgentsAsync(): Promise<
    AssignableAgent[]
  > {
    const { data } = await api.get<
      ApiResponse<AgentDto[]>
    >('/Users/agents?role=Support')

    return (data.data ?? []).map(agent => ({
      id: agent.userId,
      name: agent.fullName,
      email: agent.email,
      imageUrl: agent.imageUrl,
      isOnline: agent.isOnline ?? false,
      isActive: agent.isActive ?? true,
    }))
  }
}

export const AgentService = new AgentServi()