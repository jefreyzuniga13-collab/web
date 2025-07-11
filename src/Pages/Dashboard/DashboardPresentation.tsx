
import React from "react";
import CustomPieChart from "@/Components/Chart/CustomPieChart";
import { useConversationChart } from "@/Hooks/Chart/useChart";
import Spinner from "@/Components/Common/Spinner";
import { MdFilterListAlt } from "react-icons/md";
import CustomBarChart from "@/Components/Chart/CustomBarChart";
import Button from "@/Components/Common/Button";
import DashboardFilterModal from "@/Components/Dashboard/DashboardFilter";
import "@/Styles/Dashboard/Dashboard.css";
import AgentResponseChart from "@/Hooks/Chart/AgentResponseChart";
import { ListComponent } from "@/Components/Chart/ListComponent";

const DashboardPresentation: React.FC = () => {
  const {
    statusData,
    averageAssignmentTime,
    adminAvgAssignmentTime,
    waitingClient,
    responseAgentAverage,
    conversationClient,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    threshold,
    setThreshold,
    loadingCharts,
    loadingList,
    error,
    isFilterOpen,
    setIsFilterOpen,
    handleApply
  } = useConversationChart();

  const handleOpenFilterModal = () => {
    setIsFilterOpen(true);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-header-title">Dashboard</h1>
            <p className="dashboard-header-subtitle">
              Resumen general de rendimiento y análisis de información.
            </p>
          </div>
          <section className="dashboard-filter">
            <div className="dashboard-header-btn">
              <Button onClick={handleOpenFilterModal} disabled={loadingCharts}>
                <MdFilterListAlt size={14} /> Filtros
              </Button>
            </div>
          </section>
        </header>

        {loadingCharts && <Spinner size={40} text="Cargando datos..." />}

        {!loadingCharts && !error && (
          <section className="dashboard__chart-containers">
            <CustomPieChart
              data={statusData}
              title="Conversaciones Por Estado"
              subtitle="Porcentaje de conversaciones por estado actual."
            />

            <div className="conversationList">
              {loadingList ? (
                <Spinner size={24} text="Cargando lista..." />
              ) : conversationClient && conversationClient.length > 0 ? (
                <ListComponent
                  conversation={conversationClient}
                  page={page}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  setPage={setPage}
                  setPageSize={setPageSize}
                />
              ) : (
                <p className="empty__dashboard-list">
                  Lista de conversaciones del cliente
                </p>
              )}
            </div>

            <CustomBarChart
              data={averageAssignmentTime}
              title="Promedia de Aceptación"
              subtitle="Tiempo promedio de aceptación de conversación por agente"
            />

            <CustomBarChart
              data={adminAvgAssignmentTime}
              title="Promedio de Asignación"
              subtitle="Tiempo promedio de asignación agente por administradora."
            />

            <CustomBarChart
              data={waitingClient}
              title="Clientes críticos"
              subtitle={`Clientes sin gestión y con ≥ ${threshold} min en espera`}
              threshold={threshold}
              onThresholdChange={setThreshold}
            />

            {responseAgentAverage ? (
              <AgentResponseChart
                data={responseAgentAverage.clienteData!}
                agentName={responseAgentAverage.agentName!}
              />
            ) : (
              <p className="empty-dashboard">
                Agente sin mensajes de respuesta
              </p>
            )}
          </section>
        )}
      </div>

      <DashboardFilterModal
        onClosed={() => setIsFilterOpen(false)}
        isFilterOpen={isFilterOpen}
        handleApply={handleApply}
      />
    </div>
  );
};

export default DashboardPresentation;