
import React from 'react';
import { DashboardProvider } from '@/Context/DashboardContext';
import { useDashboard } from '@/Hooks/useDashboard';
import KpiCards from '@/Components/Dashboard/KpiCards';
import ConversationsChart from '@/Components/Dashboard/ConversationsChart';
import MessageComparisonChart from '@/Components/Dashboard/MessageComparisonChart';
import ActiveUsersChart from '@/Components/Dashboard/ActiveUsersChart';
import DashboardMenu from '@/Components/Dashboard/DashboardMenu';
import Spinner from '@/Components/Common/Spinner';
import { RefreshCw } from 'lucide-react';
import '@/Styles/Dashboard/Dashboard.css';

const DashboardContent = () => {
  const { 
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
  } = useDashboard();

  const handleRefresh = () => {
    refreshData();
  };

  const handleDateChange = (from: Date, to: Date) => {
    setDateRange(from, to);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="dashboard-controls">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 16px',
                borderRadius: '4px',
                background: '#ffffff',
                border: '1px solid #ced4da',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>
        </div>

        {loading && !activeConversations && (
          <div className="loading-indicator">
            <Spinner size={40} text="Cargando datos del dashboard..." />
          </div>
        )}

        {error && (
          <div className="error-message">
            Error al cargar los datos: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <KpiCards 
              activeConversations={activeConversations} 
              newConversations={newConversations}
              onlineAgents={onlineAgentsCount}
            />

            <div className="chart-grid">
              <ConversationsChart data={conversationsPerDay} />
              <MessageComparisonChart data={messagesSentReceived} />
            </div>
            
            <ActiveUsersChart data={activeUsersPerDay} />
          </>
        )}
      </div>
      
      <DashboardMenu
        from={dateRange.from}
        to={dateRange.to}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

const DashboardPresentation: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
};

export default DashboardPresentation;