import React from "react";
import { FaRegFaceFrown, FaRegFaceMeh, FaRegFaceSmile } from "react-icons/fa6";
import DashboardPanel from "./DashboardPanel";
import type {
  DashboardRatingByAgentProj,
  DashboardRatingGlobalProj,
} from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface RatingSummaryProps {
  globalRating: DashboardRatingGlobalProj | null;
  byAgent: DashboardRatingByAgentProj[];
  loading?: boolean;
}

const RatingSummary: React.FC<RatingSummaryProps> = ({
  globalRating,
  byAgent,
  loading,
}) => {
  return (
    <DashboardPanel
      title="Calificaciones de conversaciones"
      subtitle="Resumen de experiencia del cliente"
    >
      {loading ? (
        <div className="dashboard-chart-empty">Cargando calificaciones...</div>
      ) : (
        <div className="rating-summary">
          <div className="rating-summary__cards">
            <div className="rating-box rating-box--good">
              <FaRegFaceSmile />
              <span>Excelente</span>
              <strong>{globalRating?.excelentRatings ?? 0}</strong>
            </div>

            <div className="rating-box rating-box--regular">
              <FaRegFaceMeh />
              <span>Regular</span>
              <strong>{globalRating?.regularRatings ?? 0}</strong>
            </div>

            <div className="rating-box rating-box--bad">
              <FaRegFaceFrown />
              <span>Negativa</span>
              <strong>{globalRating?.negativeRatings ?? 0}</strong>
            </div>
          </div>

          <div className="rating-summary__agents">
            {byAgent.slice(0, 5).map((agent) => (
              <div key={agent.agentId} className="rating-agent-row">
                <span>{agent.agentName}</span>
                <strong>{agent.totalConversations}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
};

export default RatingSummary;