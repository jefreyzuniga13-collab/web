import React, { useMemo } from "react";
import DashboardPanel from "@/Components/Dashboard/DashboardPanel";
import DashboardTable, { type DashboardTableColumn } from "@/Components/Dashboard/DashboardTable";
import type { DashboardAgentAverageResponseTopClientProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface TopClientsResponseTableProps {
  rows: DashboardAgentAverageResponseTopClientProj[];
  loading?: boolean;
}

const TopClientsResponseTable: React.FC<TopClientsResponseTableProps> = ({
  rows,
  loading,
}) => {
  const columns = useMemo<DashboardTableColumn<DashboardAgentAverageResponseTopClientProj>[]>(() => [
    {
      key: "clientName",
      title: "Cliente",
      render: (row) => row.clientName ?? "-",
    },
    {
      key: "conversationCount",
      title: "Conversaciones",
      align: "right",
    },
    {
      key: "averageSeconds",
      title: "Promedio respuesta",
      align: "right",
      render: (row) => `${(row.averageSeconds / 60).toFixed(1)} min`,
    },
  ], []);

  return (
    <DashboardPanel
      title="Top clientes por tiempo de respuesta"
      subtitle="Clientes más frecuentes del agente seleccionado"
    >
      <DashboardTable
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows={rows as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any}
        loading={loading}
        emptyText="Seleccione un agente para ver esta información."
      />
    </DashboardPanel>
  );
};


export default TopClientsResponseTable;