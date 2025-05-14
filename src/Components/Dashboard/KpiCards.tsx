
import React from 'react';
import { MessageCircle, Users, BarChart2 } from 'lucide-react';

interface KpiCardsProps {
  activeConversations: number | null;
  newConversations: number | null;
  onlineAgents: number | null;
}

const KpiCards: React.FC<KpiCardsProps> = ({
  activeConversations,
  newConversations,
  onlineAgents
}) => {
  return (
    <div className="kpi-cards">
      <div className="kpi-card">
        <div className="kpi-card-header">
          <h3 className="kpi-card-title">Conversaciones Activas</h3>
          <div className="kpi-card-icon" style={{ backgroundColor: 'rgba(25, 135, 84, 0.1)', color: '#198754' }}>
            <MessageCircle size={16} />
          </div>
        </div>
        <div className="kpi-card-value">{activeConversations ?? '-'}</div>
        <p className="kpi-card-description">Conversaciones en curso actualmente</p>
      </div>

      <div className="kpi-card">
        <div className="kpi-card-header">
          <h3 className="kpi-card-title">Nuevas Conversaciones</h3>
          <div className="kpi-card-icon" style={{ backgroundColor: 'rgba(13, 110, 253, 0.1)', color: '#0d6efd' }}>
            <BarChart2 size={16} />
          </div>
        </div>
        <div className="kpi-card-value">{newConversations ?? '-'}</div>
        <p className="kpi-card-description">Conversaciones iniciadas hoy</p>
      </div>

      <div className="kpi-card">
        <div className="kpi-card-header">
          <h3 className="kpi-card-title">Agentes en Línea</h3>
          <div className="kpi-card-icon" style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>
            <Users size={16} />
          </div>
        </div>
        <div className="kpi-card-value">{onlineAgents ?? '-'}</div>
        <p className="kpi-card-description">Agentes disponibles ahora</p>
      </div>
    </div>
  );
};

export default KpiCards;