import React, { useMemo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import DashboardPanel from "./DashboardPanel";
import type { DashboardIndicatorsProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface ClassificationDonutChartProps {
  indicators: DashboardIndicatorsProj | null;
  loading?: boolean;
}

const COLORS = ["#f97316", "#0ea5e9", "#14b8a6"];

const ClassificationDonutChart: React.FC<ClassificationDonutChartProps> = ({
  indicators,
  loading = false,
}) => {
  const data = useMemo(() => {
    return [
      {
        name: "Potencial",
        value: indicators?.clientePotencialCantidad ?? 0,
      },
      {
        name: "Seguimiento",
        value: indicators?.clienteSeguimientoCantidad ?? 0,
      },
      {
        name: "En venta",
        value: indicators?.clienteVentaCantidad ?? 0,
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
        <div className="donut-layout">
          <div className="donut-chart">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value,
                    name,
                  ]}
                />

                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={4}
                >
                  {data.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="donut-center">
              <strong>{total}</strong>
              <span>Total clientes</span>
            </div>
          </div>

          <div className="donut-legend">
            {data.map((item, index) => {
              const percent =
                total > 0 ? ((item.value * 100) / total).toFixed(1) : "0.0";

              return (
                <div key={item.name} className="donut-legend__item">
                  <span
                    className="donut-legend__color"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />

                  <span>{item.name}</span>

                  <strong>
                    {item.value} ({percent}%)
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
};

export default ClassificationDonutChart;