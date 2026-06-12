import React, { useMemo } from "react";
import {
  MdFilterListAlt,
  MdOutlineRefresh,
  MdPersonSearch,
} from "react-icons/md";
import { FaRegCalendarAlt } from "react-icons/fa";
import usePerformanceDashboard from "@/Hooks/Dashboard/usePerformanceDashboard";
import MetricCardsGrid from "@/Components/Dashboard/MetricCardsGrid";
import AgentIndicatorsChart from "@/Components/Dashboard/AgentIndicatorsChart";
import ClassificationDonutChart from "@/Components/Dashboard/ClassificationDonutChart";
import WaitingClientsTable from "@/Components/Dashboard/WaitingClientsTable";
import TopClientsResponseTable from "@/Components/Dashboard/TopClientsResponseTable";
import AssignmentResponseTable from "@/Components/Dashboard/AssignmentResponseTable";
import RatingSummary from "@/Components/Dashboard/RatingSummary";
import type { FilterDashboard } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";
import Button from "@/Components/Common/Button";

const formatDateInput = (value?: string | Date | null) => {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getFilterSummary = (filters: FilterDashboard, selectedAgentId: number | null) => {
  const parts: string[] = [];

  if (filters.from && filters.to) {
    parts.push(`Fecha: ${formatDateInput(filters.from)} - ${formatDateInput(filters.to)}`);
  }

  if (filters.startTime && filters.endTime) {
    parts.push(`Hora: ${String(filters.startTime)} - ${String(filters.endTime)}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Todos los registros";
};

const PerformanceDashboardPage: React.FC = () => {
  const {
    filters,
    setFilters,
    clearFilters,
    criticalMinutes,
    setCriticalMinutes,
    selectedAgentId,
    setSelectedAgentId,
    indicatorsGlobal,
    indicatorsByAgent,
    indicatorsAgentDetail,
    ratingGlobal,
    ratingByAgent,
    waitingClientsGlobal,
    waitingClientsByAgent,
    assignmentResponseTimeGlobal,
    assignmentResponseTimeByAdmin,
    topClientsByAgent,
    loading,
    fetching,
    error,
    refreshAll,
  } = usePerformanceDashboard({
    topClientsLimit: 20,
    waitingStatus: 1,
    humanStatus: 2,
  });

  const activeIndicators = selectedAgentId ? indicatorsAgentDetail : indicatorsGlobal;
  const waitingClients = selectedAgentId ? waitingClientsByAgent : waitingClientsGlobal;

  const filterSummary = useMemo(() => {
    return getFilterSummary(filters, selectedAgentId);
  }, [filters, selectedAgentId]);

  const handleDateChange = (field: "from" | "to", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handleTimeChange = (field: "startTime" | "endTime", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handleAgentChange = (value: string) => {
    const agentId = Number(value);

    if (!value || !Number.isFinite(agentId) || agentId <= 0) {
      setSelectedAgentId(null);
      setFilters((prev) => ({
        ...prev,
        agentId: null,
        agentName: null,
      }));
      return;
    }

    const agent = indicatorsByAgent.find((item) => item.agentId === agentId);

    setSelectedAgentId(agentId);
    setFilters((prev) => ({
      ...prev,
      agentId,
      agentName: agent?.agentName ?? null,
    }));
  };

  const totalRating = ratingGlobal?.totalConversations ?? 0;

  return (
    <main className="performance-dashboard">
      <header className="performance-dashboard__header">
        <div>
          <h1 className="performance-dashboard__title">Dashboard de rendimiento</h1>
          <p className="performance-dashboard__subtitle">
            {fetching ? "Actualizando información..." : filterSummary}
          </p>
        </div>

        <div className="performance-dashboard__actions">
          <button
            type="button"
            className="performance-dashboard__button performance-dashboard__button--ghost"
            onClick={clearFilters}
            disabled={fetching}
          >
            <MdFilterListAlt />
            Limpiar
          </button>

          <Button
            type="button"
            variant="primary"
            className="performance-dashboard__button"
            onClick={refreshAll}
            disabled={fetching}
          >
            <MdOutlineRefresh />
            Refrescar
          </Button>
        </div>
      </header>

      <section className="performance-dashboard__filters">
        <div className="performance-filter">
          <label>
            <FaRegCalendarAlt />
            Desde
          </label>
          <input
            type="date"
            value={formatDateInput(filters.from)}
            onChange={(event) => handleDateChange("from", event.target.value)}
          />
        </div>

        <div className="performance-filter">
          <label>
            <FaRegCalendarAlt />
            Hasta
          </label>
          <input
            type="date"
            value={formatDateInput(filters.to)}
            onChange={(event) => handleDateChange("to", event.target.value)}
          />
        </div>

        <div className="performance-filter">
          <label>Hora inicio</label>
          <input
            type="time"
            value={filters.startTime ? String(filters.startTime).slice(0, 5) : ""}
            onChange={(event) => handleTimeChange("startTime", event.target.value)}
          />
        </div>

        <div className="performance-filter">
          <label>Hora fin</label>
          <input
            type="time"
            value={filters.endTime ? String(filters.endTime).slice(0, 5) : ""}
            onChange={(event) => handleTimeChange("endTime", event.target.value)}
          />
        </div>

        <div className="performance-filter">
          <label>
            <MdPersonSearch />
            Agente
          </label>
          <select
            value={selectedAgentId ?? ""}
            onChange={(event) => handleAgentChange(event.target.value)}
          >
            <option value="">Todos los agentes</option>
            {indicatorsByAgent.map((agent) => (
              <option key={agent.agentId} value={agent.agentId}>
                {agent.agentName}
              </option>
            ))}
          </select>
        </div>

        <div className="performance-filter performance-filter--small">
          <label>Crítico</label>
          <input
            type="number"
            min={1}
            value={criticalMinutes}
            onChange={(event) => setCriticalMinutes(Number(event.target.value))}
          />
        </div>
      </section>

      {error && (
        <section className="performance-dashboard__error">
          {error.message || "Ocurrió un error al cargar el dashboard."}
        </section>
      )}

      <MetricCardsGrid indicators={activeIndicators} loading={loading} />

      <section className="performance-dashboard__grid">
        <AgentIndicatorsChart
          data={indicatorsByAgent}
          loading={loading}
        />

        <ClassificationDonutChart
          indicators={activeIndicators}
          loading={loading}
        />
      </section>

      <section className="performance-dashboard__grid performance-dashboard__grid--three">
        <RatingSummary
          globalRating={ratingGlobal}
          byAgent={ratingByAgent}
          loading={loading}
        />

        <AssignmentResponseTable
          rows={assignmentResponseTimeByAdmin}
          loading={loading}
        />

        <TopClientsResponseTable
          rows={topClientsByAgent}
          loading={loading || !selectedAgentId}
        />
      </section>

      <section className="performance-dashboard__grid">
        <WaitingClientsTable
          rows={waitingClients}
          loading={loading}
          title={
            selectedAgentId
              ? "Clientes esperando respuesta del agente"
              : "Clientes esperando respuesta global"
          }
        />

        <section className="dashboard-panel">
          <header className="dashboard-panel__header">
            <div>
              <h3>Resumen adicional</h3>
              <p>Lectura rápida de indicadores generales</p>
            </div>
          </header>

          <div className="dashboard-panel__body">
            <div className="dashboard-summary-list">
              <div className="dashboard-summary-item">
                <span>Total calificaciones</span>
                <strong>{totalRating}</strong>
              </div>

              <div className="dashboard-summary-item">
                <span>Promedio asignación global</span>
                <strong>
                  {assignmentResponseTimeGlobal?.averageMinutes
                    ? `${assignmentResponseTimeGlobal.averageMinutes.toFixed(1)} min`
                    : "0 min"}
                </strong>
              </div>

              <div className="dashboard-summary-item">
                <span>Clientes críticos</span>
                <strong>{waitingClients.length}</strong>
              </div>

              <div className="dashboard-summary-item">
                <span>Agentes evaluados</span>
                <strong>{indicatorsByAgent.length}</strong>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
};

export default PerformanceDashboardPage;