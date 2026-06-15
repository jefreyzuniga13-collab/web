import React, { useMemo } from "react";
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

const formatNumber = (value?: number | null) => {
  return new Intl.NumberFormat("es-NI", {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
};

const formatPercent = (value: number, total: number) => {
  if (!total) return "0.0%";

  return `${new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format((value * 100) / total)}%`;
};

const RatingSummary: React.FC<RatingSummaryProps> = ({
  globalRating,
  byAgent,
  loading = false,
}) => {
  const totalConversations = globalRating?.totalConversations ?? 0;
  const excelentRatings = globalRating?.excelentRatings ?? 0;
  const regularRatings = globalRating?.regularRatings ?? 0;
  const negativeRatings = globalRating?.negativeRatings ?? 0;

  const ratingCards = useMemo(() => {
    return [
      {
        key: "excellent",
        label: "Excelente",
        value: excelentRatings,
        percent: formatPercent(excelentRatings, totalConversations),
        icon: <FaRegFaceSmile />,
        className: "rating-box--good",
      },
      {
        key: "regular",
        label: "Regular",
        value: regularRatings,
        percent: formatPercent(regularRatings, totalConversations),
        icon: <FaRegFaceMeh />,
        className: "rating-box--regular",
      },
      {
        key: "negative",
        label: "Negativa",
        value: negativeRatings,
        percent: formatPercent(negativeRatings, totalConversations),
        icon: <FaRegFaceFrown />,
        className: "rating-box--bad",
      },
    ];
  }, [
    excelentRatings,
    regularRatings,
    negativeRatings,
    totalConversations,
  ]);

  const topAgents = useMemo(() => {
    return [...(byAgent ?? [])]
      .filter((agent) => agent.agentId)
      .sort((a, b) => (b.totalConversations ?? 0) - (a.totalConversations ?? 0))
      .slice(0, 5);
  }, [byAgent]);

  const hasData = totalConversations > 0;

  return (
    <DashboardPanel
      title="Calificaciones de conversaciones"
      subtitle="Resumen de experiencia del cliente"
    >
      {loading ? (
        <div className="dashboard-chart-empty">Cargando calificaciones...</div>
      ) : !hasData ? (
        <div className="dashboard-chart-empty">
          No hay calificaciones para mostrar.
        </div>
      ) : (
        <div className="rating-summary rating-summary--clean">
          <div className="rating-summary__total">
            <span>Total conversaciones calificadas</span>
            <strong>{formatNumber(totalConversations)}</strong>
          </div>

          <div className="rating-summary__cards rating-summary__cards--clean">
            {ratingCards.map((item) => (
              <div
                key={item.key}
                className={`rating-box rating-box--clean ${item.className}`}
              >
                <div className="rating-box__icon">{item.icon}</div>

                <div className="rating-box__content">
                  <span>{item.label}</span>
                  <strong>{formatNumber(item.value)}</strong>
                  <small>{item.percent}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="rating-summary__agents rating-summary__agents--clean">
            <div className="rating-summary__section-title">
              <span>Agentes con más calificaciones</span>
              <small>Top {topAgents.length}</small>
            </div>

            {topAgents.length === 0 ? (
              <div className="rating-summary__empty">
                No hay datos por agente.
              </div>
            ) : (
              topAgents.map((agent) => {
                const total = agent.totalConversations ?? 0;
                const percent = formatPercent(total, totalConversations);

                return (
                  <div key={agent.agentId} className="rating-agent-row">
                    <div>
                      <span>{agent.agentName || "Sin agente"}</span>
                      <small>{percent} del total</small>
                    </div>

                    <strong>{formatNumber(total)}</strong>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
};

export default RatingSummary;