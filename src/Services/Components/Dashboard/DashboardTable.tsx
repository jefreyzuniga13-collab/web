import React from "react";
import "@/Styles/Dashboard/PerformanceDashboard.css";

export interface DashboardTableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  className?: string;
}

interface DashboardTableProps<T> {
  columns: DashboardTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
  loadingText?: string;
  rowKey?: (row: T, index: number) => React.Key;
  className?: string;
  compact?: boolean;
}

const getValue = <T,>(row: T, key: keyof T | string) => {
  if (typeof row !== "object" || row === null) return "-";

  const value = (row as Record<string, unknown>)[String(key)];

  if (value === null || value === undefined || value === "") return "-";

  return String(value);
};

function DashboardTable<T>({
  columns,
  rows,
  loading = false,
  emptyText = "No hay datos para mostrar.",
  loadingText = "Cargando información...",
  rowKey,
  className = "",
  compact = false,
}: DashboardTableProps<T>) {
  if (loading) {
    return <div className="dashboard-table-empty">{loadingText}</div>;
  }

  if (!rows.length) {
    return <div className="dashboard-table-empty">{emptyText}</div>;
  }

  return (
    <div className={`dashboard-table-wrap ${className}`}>
      <table className={`dashboard-table ${compact ? "dashboard-table--compact" : ""}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`text-${column.align ?? "left"} ${column.className ?? ""}`}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowKey ? rowKey(row, rowIndex) : rowIndex}>
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`text-${column.align ?? "left"} ${column.className ?? ""}`}
                >
                  {column.render
                    ? column.render(row, rowIndex)
                    : getValue(row, column.key)}
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