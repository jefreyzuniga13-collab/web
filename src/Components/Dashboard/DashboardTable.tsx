import React from "react";
import "@/Styles/Dashboard/PerformanceDashboard.css";

export interface DashboardTableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

interface DashboardTableProps<T> {
  columns: DashboardTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
}

function DashboardTable<T extends Record<string, unknown>>({
  columns,
  rows,
  loading,
  emptyText = "No hay datos para mostrar.",
}: DashboardTableProps<T>) {
  if (loading) {
    return <div className="dashboard-table-empty">Cargando información...</div>;
  }

  if (!rows.length) {
    return <div className="dashboard-table-empty">{emptyText}</div>;
  }

  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className={`text-${column.align ?? "left"}`}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={String(column.key)} className={`text-${column.align ?? "left"}`}>
                  {column.render
                    ? column.render(row)
                    : String(row[column.key as keyof T] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DashboardTable;