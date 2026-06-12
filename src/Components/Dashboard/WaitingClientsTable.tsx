import React, { useMemo } from "react";
import DashboardPanel from "./DashboardPanel";
import DashboardTable, { type DashboardTableColumn } from "@/Components/Dashboard/DashboardTable";
import type { DashboardWaitingClientProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface WaitingClientsTableProps {
  rows: DashboardWaitingClientProj[];
  loading?: boolean;
  title?: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-NI");
};

const WaitingClientsTable: React.FC<WaitingClientsTableProps> = ({
  rows,
  loading,
  title = "Clientes esperando respuesta",
}) => {
  const columns = useMemo<DashboardTableColumn<DashboardWaitingClientProj>[]>(() => [
    {
      key: "contactName",
      title: "Cliente",
      render: (row) => row.contactName ?? "-",
    },
    {
      key: "agentName",
      title: "Agente",
      render: (row) => row.agentName ?? "Sin agente",
    },
    {
      key: "clientLastMessageAt",
      title: "Último mensaje",
      render: (row) => formatDate(row.clientLastMessageAt),
    },
    {
      key: "waitingMinutes",
      title: "Espera",
      align: "right",
      render: (row) => (
        <span className="dashboard-badge dashboard-badge--danger">
          {row.waitingMinutes} min
        </span>
      ),
    },
  ], []);

  return (
    <DashboardPanel
      title={title}
      subtitle="Contactos con tiempo crítico sin respuesta del agente"
    >
      <DashboardTable
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows={rows as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any}
        loading={loading}
        emptyText="No hay clientes esperando respuesta."
      />
    </DashboardPanel>
  );
};

export default WaitingClientsTable;