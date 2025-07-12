import React, { useMemo } from "react";
import CustomPieChart from "@/Components/Chart/CustomPieChart";
import { useConversationChart } from "@/Hooks/Chart/useChart";
import Spinner from "@/Components/Common/Spinner";
import { MdFilterListAlt } from "react-icons/md";
import CustomBarChart from "@/Components/Chart/CustomBarChart";
import Button from "@/Components/Common/Button";
import DashboardFilterModal from "@/Components/Dashboard/DashboardFilter";
import "@/Styles/Dashboard/Dashboard.css";
import AgentResponseChart from "@/Hooks/Chart/AgentResponseChart";
import { ListComponent, type Column } from "@/Components/Chart/ListComponent";
import { HiRefresh } from "react-icons/hi";
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";
import type { WaitingClientResponseDto } from "@/Interfaces/Dashboard/DashboardInterfaces";

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
    handleApply,
    handleRefresh,
    waitingPage,
    waitingPageSize,
    totalCountWaiting,
    setWaitingPage,
    setWaitingPageSize,
    filters,
    loadingWaiting
  } = useConversationChart();

const formatTime = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toTimeString().slice(0,5);
};

const filterSummary = useMemo(() => {
  const parts: string[] = [];

  if (filters.from && filters.to) {
    parts.push(`Fecha: ${filters.from} – ${filters.to}`);
  }
  if (filters.startTime && filters.endTime) {
    parts.push(`Hora: ${formatTime(filters.startTime)} – ${formatTime(filters.endTime)}`);
  }
  if (filters.agentId != null) {
    parts.push(`Agente: ${filters.agentId}`);
  }
  if (filters.adminUserId != null) {
    parts.push(`Admin: ${filters.adminUserId}`);
  }
  if (filters.customerId != null) {
    parts.push(`Cliente: ${filters.customerId}`);
  }

  return parts.length > 0 ? parts.join(", ") : "Todos los registros";
}, [filters]);

  const columnsWaitingClient = useMemo<Column<WaitingClientResponseDto>[]>(() => [
      { field: "agentName", headerName: "Agente" },
      { field: "clientName", headerName: "Contacto" },
      { field: "clienteLastMessage", headerName: "Cliente Ult. Mensaje" },
      { field: "averageTime", headerName: "Tiempo de espera" },
  
  ], [])

  const columns = useMemo<Column<ConversationDto>[]>(() => [
    { field: "clientContactName", headerName: "Contacto" },
    { field: "contactNumber", headerName: "Teléfono" },
    {
      field: "createdAt",
      headerName: "Creado",
      render: c => new Date(c.createdAt).toLocaleString("es-NI")
    },
    {
      field: "requestedAgentAt",
      headerName: "Solicitud agente",
      render: c =>
        c.requestedAgentAt
          ? new Date(c.requestedAgentAt).toLocaleString("es-NI")
          : "-"
    },
    {
      field: "clientLastMessageAt",
      headerName: "Últ. Mensaje Cliente",
      render: c =>
        c.clientLastMessageAt
          ? new Date(c.clientLastMessageAt).toLocaleString("es-NI")
          : "-"
    },
    {
      field: "assignedAt",
      headerName: "Asignación agente",
      render: c =>
        c.assignedAt
          ? new Date(c.assignedAt).toLocaleString("es-NI")
          : "-"
    },
    { field: "assignedAgentName", headerName: "Agente Asignado" },
    {
      field: "agentLastMessageAt",
      headerName: "Últ. Mensaje Agente",
      render: c =>
        c.agentLastMessageAt
          ? new Date(c.agentLastMessageAt).toLocaleString("es-NI")
          : "-"
    },
    {
      field: "closedAt",
      headerName: "Cierre conversación",
      render: c =>
        c.closedAt
          ? new Date(c.closedAt).toLocaleString("es-NI")
          : "-"
    },
    {
      field: "incompletedAt",
      headerName: "Incompleta a",
      render: c =>
        c.incompletedAt
          ? new Date(c.incompletedAt).toLocaleString("es-NI")
          : "-"
    },
    {
      field: "duration",
      headerName: "Duración",
      render: c => {
        const start = new Date(c.createdAt);
        const end = c.closedAt
          ? new Date(c.closedAt)
          : c.incompletedAt
            ? new Date(c.incompletedAt)
            : new Date();
        const diff = Math.floor((end.getTime() - start.getTime()) / 1000);
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        return `${m}m ${s}s`;
      }
    }
  ], []);

  const handleOpenFilterModal = () => setIsFilterOpen(true);

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
              <Button
                onClick={handleRefresh}
                variant="destructive"
                disabled={loadingCharts}
              >
                <HiRefresh size={14} /> Refrescar
              </Button>
            </div>
            <div className="dashboard-header-btn">
              <Button onClick={handleOpenFilterModal} disabled={loadingCharts}>
                <MdFilterListAlt size={14} /> Filtros
              </Button>
            </div>
          </section>
        </header>

        {!loadingCharts && !error && (
          <section className="dashboard__chart-containers">
            <CustomPieChart
              data={statusData}
              title="Conversaciones Por Estado"
              subtitle={`Porcentaje de conversaciones por estado actual (${filterSummary})`}
            />

            <CustomBarChart
              data={adminAvgAssignmentTime}
              title="Promedio de Asignación"
              subtitle="Tiempo promedio de asignación agente por administradora."
            />

            <CustomBarChart
              data={averageAssignmentTime}
              title="Promedio de Aceptación"
              subtitle={`Tiempo promedio de asignación agente por administradora (${filterSummary})`}
            />

            <div className="conversationList">
               <h4 className="list-title">Conversaciones recientes de contactos</h4>
                <p className="list-subtitle">{filterSummary}</p>
              {loadingList ? (
                <Spinner size={24} text="Cargando lista..." />
              ) : conversationClient && conversationClient.length > 0 ? (
                <ListComponent<ConversationDto>
                  rows={conversationClient}
                  columns={columns}
                  filterField="clientContactName"
                  filterLabel="Filtrar por cliente"
                  page={page}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  setPage={setPage}
                  setPageSize={setPageSize}
                  maxHeight={400}
                />
              ) : (
                <p className="empty__dashboard-list">
                  Lista de conversaciones del cliente
                </p>
              )}
            </div>

            {/* <CustomBarChart
              data={waitingClient}
              title="Clientes críticos"
              subtitle={`Clientes sin gestión y con ≥ ${threshold} min en espera`}
              threshold={threshold}
              onThresholdChange={setThreshold}
            /> */}

            <div className="dashboard-waiting__container">
              <h3 className="dashboard-waiting__title">Clientes críticos</h3>
              <p className="dashboard-waiting__subtitle">
                {filterSummary}, Clientes sin gestión y con ≥ {threshold} min en espera
              </p>
            
            {loadingWaiting ? (
              <Spinner size={24} text="Cargando clientes críticos..." />
            ) : waitingClient.length > 0 ? (
              <ListComponent
                rows={waitingClient}
                columns={columnsWaitingClient}
                filterField="clientName"
                filterLabel="Filtrar por cliente"
                threshold={threshold}
                onThresholdChange={setThreshold}
                page={waitingPage}
                pageSize={waitingPageSize}
                totalCount={totalCountWaiting}
                setPage={setWaitingPage}
                setPageSize={setWaitingPageSize}
                maxHeight={400}
              />
            ) : (
              <p>No hay clientes críticos para mostrar.</p>
            )}
            </div>

            {responseAgentAverage ? (
              <AgentResponseChart
                data={responseAgentAverage.clienteData!}
                agentName={responseAgentAverage.agentName!}
                title="Tiempo de respuesta por agente"
                subtitle={`Top 10 promedio de respuesta a clientes. Filtrador por ${filterSummary}`}
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