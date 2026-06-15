import React, { useMemo } from "react";
import DashboardPanel from "./DashboardPanel";
import DashboardTable, {
  type DashboardTableColumn,
} from "./DashboardTable";
import type { DashboardAssignmentResponseTimeByAdminProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface AssignmentResponseTableProps {
  rows: DashboardAssignmentResponseTimeByAdminProj[];
  loading?: boolean;
}

const formatResponseTime = (
  seconds?: number | null,
  minutes?: number | null
) => {
  const totalSeconds =
    seconds !== null && seconds !== undefined
      ? Math.floor(seconds)
      : Math.floor((minutes ?? 0) * 60);

  if (totalSeconds <= 0) return "0s";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (days === 0 && hours === 0 && secs > 0) parts.push(`${secs}s`);

  return parts.join(" ") || "0s";
};

const getAssignmentSeverityClass = (seconds?: number | null) => {
  const value = seconds ?? 0;

  if (value >= 3600) return "dashboard-badge--danger";
  if (value >= 1800) return "dashboard-badge--warning";

  return "dashboard-badge--success";
};

const AssignmentResponseTable: React.FC<AssignmentResponseTableProps> = ({
  rows,
  loading = false,
}) => {
  const sortedRows = useMemo(() => {
    return [...(rows ?? [])].sort(
      (a, b) => (b.averageSeconds ?? 0) - (a.averageSeconds ?? 0)
    );
  }, [rows]);

  const columns = useMemo<
    DashboardTableColumn<DashboardAssignmentResponseTimeByAdminProj>[]
  >(
    () => [
      {
        key: "name",
        title: "Administrador",
        render: (row, index) => (
          <div className="dashboard-table-main-cell">
            <strong>
              #{index + 1} {row.name || "Desconocido"}
            </strong>
            <span>Promedio de respuesta a asignación</span>
          </div>
        ),
      },
      {
        key: "averageMinutes",
        title: "Promedio",
        align: "right",
        render: (row) => (
          <span
            className={`dashboard-badge ${getAssignmentSeverityClass(
              row.averageSeconds
            )}`}
          >
            {formatResponseTime(row.averageSeconds, row.averageMinutes)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <DashboardPanel
      title="Tiempo respuesta a asignación"
      subtitle="Promedio por administrador"
    >
      <DashboardTable
        rows={sortedRows}
        columns={columns}
        loading={loading}
        emptyText="No hay datos de asignación."
        compact
        rowKey={(row, index) => `${row.id ?? row.name ?? "admin"}-${index}`}
      />
    </DashboardPanel>
  );
};

export default AssignmentResponseTable;