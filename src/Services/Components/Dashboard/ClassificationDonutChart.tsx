import React, { useMemo } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import DashboardPanel from "./DashboardPanel";
import type { DashboardIndicatorsProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";
import { formatNumber } from "@/Utils/ECommerce/formatters";

interface ClassificationDonutChartProps {
  indicators: DashboardIndicatorsProj | null;
  loading?: boolean;
}

interface ClassificationItem {
  id: number;
  label: string;
  value: number;
  color: string;
}

const COLORS = {
  potential: "#f59e0b",
  tracking: "#0070B4",
  sale: "#10b981",
};

const formatPercent = (value: number, total: number) => {
  if (!total) return "0.0%";

  return `${new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format((value * 100) / total)}%`;
};

const ClassificationDonutChart: React.FC<ClassificationDonutChartProps> = ({
  indicators,
  loading = false,
}) => {
  const data = useMemo<ClassificationItem[]>(() => {
    return [
      {
        id: 1,
        label: "Potencial",
        value: indicators?.clientePotencialCantidad ?? 0,
        color: COLORS.potential,
      },
      {
        id: 2,
        label: "Seguimiento",
        value: indicators?.clienteSeguimientoCantidad ?? 0,
        color: COLORS.tracking,
      },
      {
        id: 3,
        label: "En venta",
        value: indicators?.clienteVentaCantidad ?? 0,
        color: COLORS.sale,
      },
    ];
  }, [indicators]);

  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  return (
    <DashboardPanel
      title="Clientes por clasificación"
      subtitle="Distribución actual de contactos clasificados"
    >
      {loading ? (
        <div className="dashboard-chart-empty">Cargando clasificación...</div>
      ) : total === 0 ? (
        <div className="dashboard-chart-empty">No hay datos para mostrar.</div>
      ) : (
        <div className="dashboard-mui-pie-layout">
          <div className="dashboard-mui-pie">
            <PieChart
              width={300}
              height={300}
              hideLegend
              series={[
                {
                  data,
                  innerRadius: 55,
                  outerRadius: 105,
                  paddingAngle: 1,
                  cornerRadius: 0,
                  startAngle: 0,
                  endAngle: 360,
                  cx: 150,
                  cy: 150,
                  valueFormatter: (item) =>
                    `${formatNumber(item.value)} (${formatPercent(
                      item.value,
                      total
                    )})`,
                },
              ]}
            />

            <div className="dashboard-mui-pie__center">
              <span>Total: </span>
              <strong>{formatNumber(total)}</strong>
            </div>
          </div>

          <div className="dashboard-mui-pie-legend">
            {data.map((item) => (
              <div key={item.id} className="dashboard-mui-pie-legend__item">
                <span
                  className="dashboard-mui-pie-legend__color"
                  style={{ backgroundColor: item.color }}
                />

                <span>{item.label}</span>

                <strong>
                  {formatNumber(item.value)}
                  <small>{formatPercent(item.value, total)}</small>
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
};

export default ClassificationDonutChart;