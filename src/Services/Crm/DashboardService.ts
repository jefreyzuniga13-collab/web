
import type { ApiResponse, DateCountItem, MessagesSentReceived } from '@/Interfaces/Dashboard/DashboardInterfaces';

const BASE_URL = 'https://localhost:7108/api/v1/Dashboard';

class DashboardService {
  async getActiveConversations(): Promise<number> {
    const response = await fetch(`${BASE_URL}/ActiveConversations`);
    const data = await response.json() as ApiResponse<number>;
    return data.data;
  }

  async getNewConversations(date: Date): Promise<number> {
    const formattedDate = date.toISOString();
    const response = await fetch(`${BASE_URL}/NewConversations?date=${encodeURIComponent(formattedDate)}`);
    const data = await response.json() as ApiResponse<number>;
    return data.data;
  }

  async getOnlineAgentsCount(): Promise<number> {
    const response = await fetch(`${BASE_URL}/OnlineAgentsCount`);
    const data = await response.json() as ApiResponse<number>;
    return data.data;
  }

  async getConversationsPerDay(from: Date, to: Date): Promise<DateCountItem[]> {
    const formattedFrom = from.toISOString();
    const formattedTo = to.toISOString();
    const response = await fetch(
      `${BASE_URL}/ConversationsPerDay?from=${encodeURIComponent(formattedFrom)}&to=${encodeURIComponent(formattedTo)}`
    );
    const data = await response.json() as ApiResponse<DateCountItem[]>;
    return data.data;
  }

  async getMessagesSentReceived(from: Date, to: Date): Promise<MessagesSentReceived> {
    const formattedFrom = from.toISOString();
    const formattedTo = to.toISOString();
    const response = await fetch(
      `${BASE_URL}/MessagesSentReceived?from=${encodeURIComponent(formattedFrom)}&to=${encodeURIComponent(formattedTo)}`
    );
    const data = await response.json() as ApiResponse<MessagesSentReceived>;
    return data.data;
  }

  async getActiveUsersPerDay(from: Date, to: Date): Promise<DateCountItem[]> {
    const formattedFrom = from.toISOString();
    const formattedTo = to.toISOString();
    const response = await fetch(
      `${BASE_URL}/ActiveUsersPerDay?from=${encodeURIComponent(formattedFrom)}&to=${encodeURIComponent(formattedTo)}`
    );
    const data = await response.json() as ApiResponse<DateCountItem[]>;
    return data.data;
  }
}

export const dashboardService = new DashboardService();