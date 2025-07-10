export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
}

export interface DateCountItem {
  date: string;
  count: number;
}

export interface MessagesSentReceived {
  sent: DateCountItem[];
  received: DateCountItem[];
}

export interface DashboardData {
  activeConversations: number;
  newConversations: number;
  onlineAgentsCount: number;
  conversationsPerDay: DateCountItem[];
  messagesSentReceived: MessagesSentReceived;
  activeUsersPerDay: DateCountItem[];
}

export type ConversationStatus = 
  | 'Bot'
  | 'Closed';

export interface ConversationStatusCountResponseDto {
  status: ConversationStatus ;
  count: number;
}

export interface AverageAssignmentTimeResponseDto{
  id: number;
   name: string;
   averageTime: number
}

export interface FilterForm {
  from: Date | null | string;
  to: Date | null | string;
  startTime: Date | null;
  endTime: Date | null;
  agentId: number | null;
  adminUserId: number | null;
  companiesId?: number | null;
  customerId: number | null;
  today?: boolean;
  yesterday?: boolean;
  tomorrow?: boolean;
}



export interface AdminAsigmentResponseTimeResponseDto{
    id: number;
   name: string;
   averageTime: number
}
export interface WaitingClientResponseDto{
  id: number;
  name: string;
  averageTime: number | null;
}

export interface ResponseAgentAverageClienteDataResponseDto{
  clienteId?: number;
  clientName?: string;
  averageSeconds?: number;
  conversationCount?: number;
}

export interface ResponseAgentAverageResponseDto{
  id: number;
  agentName?: string;
  clienteData?: ResponseAgentAverageClienteDataResponseDto [];
}