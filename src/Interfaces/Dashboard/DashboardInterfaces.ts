
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