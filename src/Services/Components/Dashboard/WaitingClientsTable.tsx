import React, { useMemo } from "react";
import DashboardPanel from "./DashboardPanel";
import DashboardTable, {
  type DashboardTableColumn,
} from "@/Services/Components/Dashboard/DashboardTable";
import type { DashboardWaitingClientProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface WaitingClientsTableProps {
  rows: DashboardWaitingClientProj[];
  loading?: boolean;
  title?: string;
}

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatWaitingTime = (
  minutes?: number | null,
  seconds?: number | null
) => {
  const totalSeconds =
    seconds !== null && seconds !== undefined
      ? seconds
      : Math.floor((minutes ?? 0) * 60);

  if (!totalSeconds || totalSeconds <= 0) return "0m";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (days === 0 && hours === 0 && secs > 0) parts.push(`${secs}s`);

  return parts.join(" ") || "0m";
};

const getWaitingSeverityClass = (minutes?: number | null) => {
  const value = minutes ?? 0;

  if (value >= 60) return "dashboard-badge--danger";
  if (value >= 30) return "dashboard-badge--warning";

  return "dashboard-badge--soft-danger";
};

const WaitingClientsTable: React.FC<WaitingClientsTableProps> = ({
  rows,
  loading = false,
  title = "Clientes esperando respuesta",
}) => {
  const sortedRows = useMemo(() => {
    return [...(rows ?? [])].sort(
      (a, b) => (b.waitingMinutes ?? 0) - (a.waitingMinutes ?? 0)
    );
  }, [rows]);

  const columns = useMemo<DashboardTableColumn<DashboardWaitingClientProj>[]>(
    () => [
      {
        key: "contactName",
        title: "Contacto",
        render: (row) => (
          <div className="dashboard-table-main-cell">
            <strong>{row.contactName || "-"}</strong>
            <span>{row.systemDefinedCompanyName || "Cliente no definido"}</span>
          </div>
        ),
      },
      {
        key: "agentName",
        title: "Agente",
        render: (row) => row.agentName || "Sin agente",
      },
      {
        key: "clientLastMessageAt",
        title: "Último mensaje",
        render: (row) => formatDate(row.clientLastMessageAt),
      },
      {
        key: "waitingMinutes",
        title: "Tiempo espera",
        align: "right",
        render: (row) => (
          <span
            className={`dashboard-badge ${getWaitingSeverityClass(
              row.waitingMinutes
            )}`}
          >
            {formatWaitingTime(row.waitingMinutes, row.waitingSeconds)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <DashboardPanel
      title={title}
      subtitle="Contactos con tiempo crítico sin respuesta del agente"
    >
      <DashboardTable
        rows={sortedRows}
        columns={columns}
        loading={loading}
        emptyText="No hay clientes esperando respuesta."
        compact
        rowKey={(row, index) =>
          `${row.id ?? row.contactName ?? "waiting"}-${index}`
        }
      />
    </DashboardPanel>
  );
};

export default WaitingClientsTable;