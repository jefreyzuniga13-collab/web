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
    loading,
    error,
    isFilterOpen,
    setIsFilterOpen,
    handleApply,
    waitingClient,
    responseAgentAverage,
    criticialClientTime,
    conversationClient,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount
  } = useConversationChart();

  const handleOpenFilterModal = () => {
    setIsFilterOpen(true);
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-header-title">Dashboard</h1>
            <p className="dashboard-header-subtitle">Resumen general de rendimiento y analisis de información.</p>
          </div>

          <section className="dashboard-filter">
            <div className="dashboard-header-btn">

              <Button onClick={() => handleOpenFilterModal()} disabled={loading}>
                <MdFilterListAlt size={14} /> Filtros
              </Button>
            </div>
          </section>
        </header>

        {(loading) && (
          <Spinner size={40} text="Cargando datos..." />
        )}

        {!loading && !error && (
          <section className="dashboard__chart-containers">
            <CustomPieChart
              data={statusData}
              title="Conversaciones Por Estado"
              subtitle="Porcentaje de conversaciones por estado actual."
            />

           {conversationClient != null ? (
             <div className="conversationList">
                <ListComponent 
              conversation={conversationClient!}
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              setPage={setPage}
              setPageSize={setPageSize}
            />
             </div>
           ): (
              <>
                <p className="empty__dashboard-list">Lista de convesaciones del cliente</p>
              </>
            )}

            <CustomBarChart
              data={averageAssignmentTime}
              title="Promedia de Aceptación"
              subtitle={`Tiempo promedio de aceptación de conversación por agente`}
            />

            <CustomBarChart
              data={adminAvgAssignmentTime}
              title="Promedio de Asignación"
              subtitle={`Tiempo promedio de asignación agente por administradora.`}
            />

            {!waitingClient || waitingClient.length !== 0 ? (
              <CustomBarChart
              data={waitingClient}
              title="Clientes criticos"
              subtitle={`Clientes sin ninguna gestión y con ${criticialClientTime} minuto en espera desde su último mensaje`}
            />
            ): (
              <>
                <p className="empty-dashboard"> No hay clientes con estado criticos</p>
              </>
            )}

            {responseAgentAverage != null ? (
              <AgentResponseChart
              data={responseAgentAverage!.clienteData!}
              agentName={responseAgentAverage!.agentName!}
            />
            ): (
              <>
                <p className="empty-dashboard">Agente sin mensajes de respuesta</p>
              </>
            )}

          </section>
        )}
      </div>

        <DashboardFilterModal
          onClosed={() => setIsFilterOpen(false)} isFilterOpen={isFilterOpen} handleApply={handleApply}/>
    </div>
  );
};

export default DashboardPresentation;