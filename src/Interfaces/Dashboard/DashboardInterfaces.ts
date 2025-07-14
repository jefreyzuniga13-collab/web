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
  | 'Closed'
  | "Waiting"
  | "Incompleted"
  | "Human";

export interface ConversationStatusCountResponseDto {
  status: ConversationStatus ;
  count: number;
}

export interface statusMapColor {
  status: ConversationStatus;
  color: string;
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
  agentName: string | null;
  adminUserId: number | null;
  adminUserName:string | null;
  companiesId?: number | null;
  customerId: number | null;
  customerName:string | null;
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
  id?: number;
  clientName?: string;
  name?: string;
  clienteLastMessage?: string;
  averageTime?: number | null;
}

export interface ResponseAgentAverageClienteDataResponseDto{
  clienteId?: number;
  clientName?: string;
  averageSeconds?: number;
  conversationCount?: number;
}

export interface ResponseAgentAverageResponseDto{
  id: number;
  name?: string;
  clienteData?: ResponseAgentAverageClienteDataResponseDto [];
}