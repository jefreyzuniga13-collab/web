import React, { useMemo } from "react";
import DashboardPanel from "@/Components/Dashboard/DashboardPanel";
import DashboardTable, {
  type DashboardTableColumn,
} from "@/Components/Dashboard/DashboardTable";
import type { DashboardAgentAverageResponseTopClientProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface TopClientsResponseTableProps {
  rows: DashboardAgentAverageResponseTopClientProj[];
  loading?: boolean;
}

const formatNumber = (value?: number | null) => {
  return new Intl.NumberFormat("es-NI", {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
};

const formatResponseTime = (seconds?: number | null) => {
  const totalSeconds = Math.floor(seconds ?? 0);

  if (totalSeconds <= 0) return "0s";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (days === 0 && hours === 0 && secs > 0) parts.push(`${secs}s`);

  return parts.join(" ") || "0s";
};

const getResponseSeverityClass = (seconds?: number | null) => {
  const value = seconds ?? 0;

  if (value >= 3600) return "dashboard-badge--danger";
  if (value >= 1800) return "dashboard-badge--warning";

  return "dashboard-badge--success";
};

const TopClientsResponseTable: React.FC<TopClientsResponseTableProps> = ({
  rows,
  loading = false,
}) => {
  const sortedRows = useMemo(() => {
    return [...(rows ?? [])].sort(
      (a, b) => (b.conversationCount ?? 0) - (a.conversationCount ?? 0)
    );
  }, [rows]);

  const columns = useMemo<
    DashboardTableColumn<DashboardAgentAverageResponseTopClientProj>[]
  >(
    () => [
      {
        key: "clientName",
        title: "Cliente",
        render: (row, index) => (
          <div className="dashboard-table-main-cell">
            <strong>
              #{index + 1} {row.clientName || "-"}
            </strong>
            <span>{row.agentName || "Agente no disponible"}</span>
          </div>
        ),
      },
      {
        key: "conversationCount",
        title: "Conversaciones",
        align: "right",
        render: (row) => formatNumber(row.conversationCount),
      },
      {
        key: "averageSeconds",
        title: "Promedio respuesta",
        align: "right",
        render: (row) => (
          <span
            className={`dashboard-badge ${getResponseSeverityClass(
              row.averageSeconds
            )}`}
          >
            {formatResponseTime(row.averageSeconds)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <DashboardPanel
      title="Top clientes por tiempo de respuesta"
      subtitle="Clientes más frecuentes del agente seleccionado"
    >
      <DashboardTable
        rows={sortedRows}
        columns={columns}
        loading={loading}
        emptyText="Seleccione un agente para ver esta información."
        compact
        rowKey={(row, index) =>
          `${row.agentId ?? "agent"}-${row.clienteId ?? row.clientName ?? "client"}-${index}`
        }
      />
    </DashboardPanel>
  );
};

export default TopClientsResponseTable;