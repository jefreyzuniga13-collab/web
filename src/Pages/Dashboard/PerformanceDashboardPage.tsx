import React, { useMemo } from "react";
import {MdFilterListAlt, MdOutlineRefresh, MdPersonSearch} from "react-icons/md";
import { FaRegCalendarAlt } from "react-icons/fa";
import usePerformanceDashboard from "@/Hooks/Dashboard/usePerformanceDashboard";
import MetricCardsGrid from "@/Components/Dashboard/MetricCardsGrid";
import ClassificationDonutChart from "@/Components/Dashboard/ClassificationDonutChart";
import WaitingClientsTable from "@/Components/Dashboard/WaitingClientsTable";
import AssignmentResponseTable from "@/Components/Dashboard/AssignmentResponseTable";
import RatingSummary from "@/Components/Dashboard/RatingSummary";
import RecentConversationsTable from "@/Components/Dashboard/RecentConversationsTable";
import AgentConversationsChart from "@/Components/Dashboard/AgentConversationsChart";
import AgentProformasChart from "@/Components/Dashboard/AgentProformasChart.tsx";
import AgentServiceLevelChart from "@/Components/Dashboard/AgentServiceLevelChart";
import AgentAverageResponseChart from "@/Components/Dashboard/AgentAverageResponseChart.tsx";
import CustomPieChart from "@/Components/Chart/CustomPieChart";
import Button from "@/Components/Common/Button";
import type { FilterDashboard } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";
import { formatDateInput, formatMinutes, formatNumber } from "@/Utils/ECommerce/formatters";

const getFilterSummary = (
  filters: FilterDashboard,
  selectedAgentId: number | null,
  selectedAgentName?: string | null
) => {
  const parts: string[] = [];

  if (filters.from && filters.to) {
    parts.push(
      `Fecha: ${formatDateInput(filters.from)} - ${formatDateInput(filters.to)}`
    );
  }

  if (selectedAgentId) {
    parts.push(`Agente: ${selectedAgentName || selectedAgentId}`);
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
    recentPage,
    setRecentPage,
    recentPageSize,
    setRecentPageSize,
    recentTotalCount,
    statusData,
    indicatorsGlobal,
    indicatorsByAgent,
    indicatorsAgentDetail,
    ratingGlobal,
    ratingByAgent,
    waitingClientsGlobal,
    waitingClientsByAgent,
    assignmentResponseTimeGlobal,
    assignmentResponseTimeByAdmin,
    agentAverageResponseByAgent,
    recentConversations,
    loading,
    fetching,
    error,
    refreshAll,
    queries,
  } = usePerformanceDashboard({
    topClientsLimit: 50,
    waitingStatus: 1,
    humanStatus: 2,
    initialPageSize: 50,
  });

  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;

    return (
      indicatorsByAgent.find((agent) => agent.agentId === selectedAgentId) ??
      null
    );
  }, [indicatorsByAgent, selectedAgentId]);

  const activeIndicators = selectedAgentId
    ? indicatorsAgentDetail
    : indicatorsGlobal;

  const waitingClients = selectedAgentId
    ? waitingClientsByAgent
    : waitingClientsGlobal;

  const filterSummary = useMemo(() => {
    return getFilterSummary(
      filters,
      selectedAgentId,
      selectedAgent?.agentName ?? null
    );
  }, [filters, selectedAgentId, selectedAgent]);

  const totalRating = ratingGlobal?.totalConversations ?? 0;
  const totalCriticalClients = waitingClients.length;
  const totalAgents = indicatorsByAgent.length;

  const handleDateChange = (field: "from" | "to", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || null,
    }));

    setRecentPage(1);
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

      setRecentPage(1);
      return;
    }

    const agent = indicatorsByAgent.find((item) => item.agentId === agentId);

    setSelectedAgentId(agentId);

    setFilters((prev) => ({
      ...prev,
      agentId,
      agentName: agent?.agentName ?? null,
    }));

    setRecentPage(1);
  };

  const handleCriticalMinutesChange = (value: string) => {
    const nextValue = Number(value);

    setCriticalMinutes(
      Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1
    );
  };

  return (
    <main className="performance-dashboard">
      <header className="performance-dashboard__header">
        <div>
          <h1 className="performance-dashboard__title">Dashboard</h1>

          <p className="performance-dashboard__subtitle">
            {fetching
              ? "Actualizando información..."
              : `Filtro: ${filterSummary}`}
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

      </section>

      {error && (
        <section className="performance-dashboard__error">
          {error.message || "Ocurrió un error al cargar el dashboard."}
        </section>
      )}

      <MetricCardsGrid indicators={activeIndicators} loading={loading} />

      <section className="performance-dashboard__grid">
        <section className="dashboard-panel">
          <header className="dashboard-panel__header">
            <div>
              <h3>Conversaciones Por Estado</h3>
              <p>Porcentaje de conversaciones por estado actual</p>
            </div>
          </header>

          <div className="dashboard-panel__body">
            {queries.statusData?.isLoading ? (
              <div className="dashboard-chart-empty">
                Cargando conversaciones por estado...
              </div>
            ) : statusData.length > 0 ? (
              <CustomPieChart data={statusData} typePieChart="status" />
            ) : (
              <div className="dashboard-chart-empty">
                No hay datos para mostrar.
              </div>
            )}
          </div>
        </section>

        <ClassificationDonutChart
          indicators={activeIndicators}
          loading={loading}
        />
      </section>

      <section className="performance-dashboard__grid">
        <AgentConversationsChart
          rows={indicatorsByAgent}
          loading={queries.indicatorsByAgent.isLoading}
        />

        <AgentProformasChart
          rows={indicatorsByAgent}
          loading={queries.indicatorsByAgent.isLoading}
        />
      </section>

      <section className="performance-dashboard__grid">
        <AgentServiceLevelChart
          rows={indicatorsByAgent}
          loading={queries.indicatorsByAgent.isLoading}
        />

        <AgentAverageResponseChart
          rows={agentAverageResponseByAgent}
          loading={queries.agentAverageResponseByAgent.isLoading}
        />
      </section>

      <RecentConversationsTable
        rows={recentConversations}
        loading={queries.recentConversations.isLoading}
        page={recentPage}
        pageSize={recentPageSize}
        totalCount={recentTotalCount}
        setPage={setRecentPage}
        setPageSize={setRecentPageSize}
      />

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
        <div className="performance-filter performance-filter__critico">
          <div className="performance-filter performance-filter--small">
          <label>Tiempo de Espera del Cliente (TEC)</label>

          <input
            type="number"
            min={1}
            value={criticalMinutes}
            onChange={(event) =>
              handleCriticalMinutesChange(event.target.value)
            }
          />
        </div>
        
        <WaitingClientsTable
          rows={waitingClients}
          loading={loading}
          title={
            selectedAgentId
              ? "Clientes esperando respuesta del agente"
              : "Clientes esperando respuesta global"
          }
        />
        </div>
      </section>

      <section className="performance-dashboard__grid">
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
                <strong>{formatNumber(totalRating)}</strong>
              </div>

              <div className="dashboard-summary-item">
                <span>Promedio asignación global</span>
                <strong>
                  {formatMinutes(assignmentResponseTimeGlobal?.averageMinutes)}
                </strong>
              </div>

              <div className="dashboard-summary-item">
                <span>Clientes críticos</span>
                <strong>{formatNumber(totalCriticalClients)}</strong>
              </div>

              <div className="dashboard-summary-item">
                <span>Agentes evaluados</span>
                <strong>{formatNumber(totalAgents)}</strong>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
};

export default PerformanceDashboardPage;