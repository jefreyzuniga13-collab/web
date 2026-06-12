import React, { useMemo } from "react";
import DashboardPanel from "./DashboardPanel";
import DashboardTable, { type DashboardTableColumn } from "./DashboardTable";
import type { DashboardAssignmentResponseTimeByAdminProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface AssignmentResponseTableProps {
  rows: DashboardAssignmentResponseTimeByAdminProj[];
  loading?: boolean;
}

const AssignmentResponseTable: React.FC<AssignmentResponseTableProps> = ({
  rows,
  loading,
}) => {
  const columns = useMemo<DashboardTableColumn<DashboardAssignmentResponseTimeByAdminProj>[]>(() => [
    {
      key: "name",
      title: "Administrador",
    },
    {
      key: "averageMinutes",
      title: "Promedio",
      align: "right",
      render: (row) => `${row.averageMinutes.toFixed(1)} min`,
    },
  ], []);

  return (
    <DashboardPanel
      title="Tiempo respuesta a asignación"
      subtitle="Promedio por administrador"
    >
      <DashboardTable
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows={rows as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        columns={columns as any}
        loading={loading}
        emptyText="No hay datos de asignación."
      />
    </DashboardPanel>
  );
};

export default AssignmentResponseTable;