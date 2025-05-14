
import React, { createContext, useContext, type ReactNode, useState, useEffect } from 'react';
import { dashboardService } from '@/Services/DashboardService';
import type { DateCountItem, MessagesSentReceived } from '@/Interfaces/Dashboard/DashboardInterfaces';

interface DashboardContextType {
  activeConversations: number | null;
  newConversations: number | null;
  onlineAgentsCount: number | null;
  conversationsPerDay: DateCountItem[] | null;
  messagesSentReceived: MessagesSentReceived | null;
  activeUsersPerDay: DateCountItem[] | null;
  dateRange: {
    from: Date;
    to: Date;
  };
  setDateRange: (from: Date, to: Date) => void;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [activeConversations, setActiveConversations] = useState<number | null>(null);
  const [newConversations, setNewConversations] = useState<number | null>(null);
  const [onlineAgentsCount, setOnlineAgentsCount] = useState<number | null>(null);
  const [conversationsPerDay, setConversationsPerDay] = useState<DateCountItem[] | null>(null);
  const [messagesSentReceived, setMessagesSentReceived] = useState<MessagesSentReceived | null>(null);
  const [activeUsersPerDay, setActiveUsersPerDay] = useState<DateCountItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default to last 7 days
  const [dateRange, setDateRangeState] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  const setDateRange = (from: Date, to: Date) => {
    setDateRangeState({ from, to });
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [
        activeConversationsData,
        newConversationsData,
        onlineAgentsCountData,
        conversationsPerDayData,
        messagesSentReceivedData,
        activeUsersPerDayData
      ] = await Promise.all([
        dashboardService.getActiveConversations(),
        dashboardService.getNewConversations(new Date()),
        dashboardService.getOnlineAgentsCount(),
        dashboardService.getConversationsPerDay(dateRange.from, dateRange.to),
        dashboardService.getMessagesSentReceived(dateRange.from, dateRange.to),
        dashboardService.getActiveUsersPerDay(dateRange.from, dateRange.to)
      ]);
      
      setActiveConversations(activeConversationsData);
      setNewConversations(newConversationsData);
      setOnlineAgentsCount(onlineAgentsCountData);
      setConversationsPerDay(conversationsPerDayData);
      setMessagesSentReceived(messagesSentReceivedData);
      setActiveUsersPerDay(activeUsersPerDayData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del dashboard');
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to]);

  const value = {
    activeConversations,
    newConversations,
    onlineAgentsCount,
    conversationsPerDay,
    messagesSentReceived,
    activeUsersPerDay,
    dateRange,
    setDateRange,
    loading,
    error,
    refreshData
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};