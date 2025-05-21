import api from '@/Utils/ApiConfig';
import type { AgentDto } from '@/Interfaces/Chat/ChatInterfaces';

export function getAgents() {
  return api.get<{ data: AgentDto[] }>('/Users/agents?role=Support');
}