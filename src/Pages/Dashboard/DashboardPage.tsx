import React, { useMemo } from "react";
import CustomPieChart from "@/Components/Chart/CustomPieChart";
import { useConversationChart } from "@/Hooks/Chart/useChart";
import Spinner from "@/Components/Common/Spinner";
import { MdFilterListAlt } from "react-icons/md";
import CustomBarChart from "@/Components/Chart/CustomBarChart";
import Button from "@/Components/Common/Button";
import DashboardFilterModal from "@/Components/Dashboard/DashboardFilter";
import "@/Styles/Dashboard/Dashboard.css";
import AgentResponseChart from "@/Components/Chart/AgentResponseChart";
import { ListComponent, type Column } from "@/Components/Chart/ListComponent";
import { HiRefresh } from "react-icons/hi";
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";
import type { WaitingClientResponseDto } from "@/Interfaces/Dashboard/DashboardInterfaces";
import { format, toZonedTime } from "date-fns-tz";
import { parseISO, parse } from "date-fns";
import RatingStars from '@/Utils/ConvertToStarts'

const DashboardPage: React.FC = () => {
  const {
    statusData,
    averageAssignmentTime,
    adminAvgAssignmentTime,
    waitingClient,
    // responseAgentAverage,
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
    loadingWaiting,
    ratingConversationData,
    RatingConversation,
    loadingRatingConversation,
    ratingConversationPage,
    ratingConversationPageSize,
    ratingConversationPageTotalCount,
    setRatingConversationPage,
    setRatingConversationPageSize,
    selectedAgentId,
    setSelectedAgentId,
    fetchRatingByAgent,
    fetchWaiting
  } = useConversationChart();

  const formatTime = (d: Date | string) => {
    const date = typeof d === "string" ? parse(d, "HH:mm:ss", new Date()) : d;
    return date instanceof Date && !isNaN(date.getTime())
      ? date.toTimeString().slice(0, 5)
      : "";
  };

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    const zone = "America/Managua";

    if (filters.from && filters.to) {
      const fromDate =
        typeof filters.from === "string" ? parseISO(filters.from) : filters.from;
      const toDate =
        typeof filters.to === "string" ? parseISO(filters.to) : filters.to;
      if (
        fromDate instanceof Date &&
        !isNaN(fromDate.getTime()) &&
        toDate instanceof Date &&
        !isNaN(toDate.getTime())
      ) {
        const fromManagua = toZonedTime(fromDate, zone);
        const toManagua = toZonedTime(toDate, zone);
        parts.push(
          `Fecha: ${format(fromManagua, "dd-MM-yyyy", {
            timeZone: zone
          })} – ${format(toManagua, "dd-MM-yyyy", { timeZone: zone })}`
        );
      }
    }
    if (filters.startTime && filters.endTime) {
      const start = formatTime(filters.startTime);
      const end = formatTime(filters.endTime);
      if (start && end) {
        parts.push(`Hora: ${start} – ${end}`);
      }
    }
    if (filters.agentId != null) {
      parts.push(`Agente: ${filters.agentName}`);
    }
    if (filters.adminUserId != null) {
      parts.push(`Admin: ${filters.adminUserName}`);
    }
    if (filters.contactId != null) {
      parts.push(`Cliente: ${filters.contactName}`);
    }

    return parts.length > 0 ? parts.join(", ") : "Todos los registros";
  }, [filters]);

  
  const columnsRatingConversation = useMemo<Column<ConversationDto>[]>(() => [
    { field: "assignedAgentName", headerName: "Agente Asignado" },
    { field: "clientContactName", headerName: "Contacto" },
    {
      field: "systemDefinedCompanyName",
      headerName: "Cliente",
      render: c =>  c.systemDefinedCompanyName != null ? c.systemDefinedCompanyName :
      "-"
    },
    {field: "rating", headerName: "Calificación", render: c => {
      return <RatingStars value={c.rating ?? 0} />
    }},
    {
      field: "ratingReceivedAt",
      headerName: "Calificación Recibida",
      render: c =>
        c.ratingReceivedAt
          ? new Date(c.ratingReceivedAt).toLocaleString("es-NI")
          : "-"
    }
  ], []);

  const columnsWaitingClient = useMemo<Column<WaitingClientResponseDto>[]>(() => [
    { field: "name", headerName: "Agente" },
    { field: "contactName", headerName: "Contacto" },
        {
      field: "systemDefinedCompanyName",
      headerName: "Cliente",
      render: c =>  c.systemDefinedCompanyName != null ? c.systemDefinedCompanyName :
      "-"
    },
    {
      field: "clienteLastMessage",
      headerName: "Contacto Ult. Mensaje",
      render: c =>
        c.clienteLastMessage
          ? new Date(c.clienteLastMessage).toLocaleString("es-NI")
          : "-"
    },
    {
      field: "averageTime",
      headerName: "Tiempo de espera",
      render: c => {
       const totalSeconds = c.averageTime ?? 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds}s`;
      }
    }
  ], []);

  const columns = useMemo<Column<ConversationDto>[]>(() => [
    { field: "clientContactName", headerName: "Contacto" },
    //Si es null se muestra "-"
    {
      field: "systemDefinedCompanyName",
      headerName: "Cliente",
      render: c =>  c.systemDefinedCompanyName != null ? c.systemDefinedCompanyName :
      "-"
    },
    { field: "contactNumber", headerName: "Teléfono" },
    {
      field: "createdAt",
      headerName: "Creado",
      render: c => new Date(c.createdAt).toLocaleString("es-NI")
    },
    {
      field: "agentRequestAt",
      headerName: "Solicitud agente del contacto al admin",
      render: c =>
        c.agentRequestAt
          ? new Date(c.agentRequestAt).toLocaleString("es-NI")
          : "-"
    },
    {
      field: "requestedAgentAt",
      headerName: "Solicitud enviada de admin al agente",
      render: c =>
        c.requestedAgentAt
          ? new Date(c.requestedAgentAt).toLocaleString("es-NI")
          : "-"
    },
    {
      field: "clientLastMessageAt",
      headerName: "Últ. Mensaje contacto",
      render: c =>
        c.clientLastMessageAt
          ? new Date(c.clientLastMessageAt).toLocaleString("es-NI")
          : "-"
    },
    {
      field: "assignedAt",
      headerName: "Aceptación solicitud asignación por el agente  ",
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

          const diffMs = end.getTime() - start.getTime();
          const totalSeconds = Math.floor(diffMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds}s`;
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
             {filterSummary == null ?  "Resumen general de rendimiento y análisis de información."
             : "Filtro: " + filterSummary
             }
            </p>
          </div>

          <section className="dashboard-filter">
            <div className="dashboard-header-btn">
              <Button
                onClick={handleRefresh}
                variant="tertiary"
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
            
            <div>
              <h4 className="dashboard-waiting__title">
                Conversaciones Por Estado
              </h4>
              <p className="dashboard-waiting__subtitle">
                {`Porcentaje de conversaciones por estado actual`}
              </p>
              {statusData.length > 0 ? (
                <CustomPieChart data={statusData} typePieChart="status"/>
              ) : (
                <p className="empty__dashboard-list">
                  No hay conversaciones recientes hoy
                </p>
              )}
            </div>

            <CustomBarChart
              data={adminAvgAssignmentTime}
              title="Promedio de Asignación"
              subtitle="Tiempo promedio de asignación agente por administradora desde solicitud del contacto."
            />

            <CustomBarChart
              data={averageAssignmentTime}
              title="Promedio de Aceptación"
              subtitle={`Tiempo promedio de respuesta asignaciónes de conversación del administrador.`}
            />

            <div className="conversationList">
              <h4 className="dashboard-waiting__title">
                Conversaciones recientes de contactos
              </h4>
               <p className="dashboard-waiting__subtitle">
                {`Lista de las convesaiones mas recientes incluyendo el ciclo de desde la creación hasta el cierre o incompleta`}
              </p>
              {loadingList ? (
                <Spinner size={24} text="Cargando lista..." />
              ) : conversationClient.length > 0 ? (
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
                  maxHeight={700}
                  showAutoComplete={false}
                />
              ) : (
                <p className="empty__dashboard-list">
                  No hay conversaciones recientes hoy
                </p>
              )}
            </div>

            <div className="dashboard-waiting__container">
              <h3 className="dashboard-waiting__title">Contactos críticos</h3>
              <p className="dashboard-waiting__subtitle">
                Contactos sin gestión y con ≥ {threshold} min en espera (Sin mensaje de respuesta)
              </p>
              {loadingWaiting ? (
                <Spinner size={24} text="Cargando contactos críticos..." />
              ) : (
                <ListComponent<WaitingClientResponseDto>
                  rows={waitingClient}
                  columns={columnsWaitingClient}
                  filterField="contactName"
                  filterLabel="Filtrar por contacto"
                  threshold={threshold}
                  onThresholdChange={setThreshold}
                  page={waitingPage}
                  pageSize={waitingPageSize}
                  totalCount={totalCountWaiting}
                  setPage={setWaitingPage}
                  setPageSize={setWaitingPageSize}
                  maxHeight={700}
                  showAutoComplete= {false}
                  fetchWaiting={fetchWaiting}
                />
              )}
            </div>

            <div className="dashboard-waiting__container">
              <h4 className="dashboard-waiting__title">
                Calificaciones de conversaciones por agentes
              </h4>
              <p className="dashboard-waiting__subtitle">
                {`Porcentaje de conversaciones por calificación actual`}
              </p>

                <>
                  <CustomPieChart data={ratingConversationData} 
                  // enableNavigation={false} 
                  filterableByAgent={true}
                  selectedAgentId={selectedAgentId} setSelectedAgentId={setSelectedAgentId} 
                  fetchRatingByAgent={fetchRatingByAgent} typePieChart="rating"/>

                  {loadingRatingConversation ? (
                    <Spinner size={24} text="Cargando conversaciones calificadas..." />
                  ) : (
                    
                    <ListComponent<ConversationDto>
                      rows={RatingConversation}
                      columns={columnsRatingConversation}
                      filterField="assignedAgentName"
                      filterLabel="Filtrar por agente"
                      // threshold={threshold}/. Aqui se puede agregar un filtro de calificación
                      //onThresholdChange={setThreshold}
                      page={ratingConversationPage}
                      pageSize={ratingConversationPageSize}
                      totalCount={ratingConversationPageTotalCount}
                      setPage={setRatingConversationPage}
                      setPageSize={setRatingConversationPageSize}
                      maxHeight={700}
                      showAutoComplete= {false}
                    />
                  )}
                </>
            </div>

            <div>
              <h4 className="dashboard-waiting__title">Promedio respuestas agente por contacto mas frecuente.</h4>
              <p className="dashboard-waiting__subtitle">
                {`Promedio de respuesta a mensajes del clientes por agente. Seleccione un agente en el filtro.`}
              </p>

               <AgentResponseChart
                  title="Tiempo de respuesta por agente"
                  subtitle=""
                />
            </div>

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

export default DashboardPage;