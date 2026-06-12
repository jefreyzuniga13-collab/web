import React from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardPanel from "@/Components/Dashboard/DashboardPanel";
import type { DashboardIndicatorsByAgentProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface AgentIndicatorsChartProps {
  data: DashboardIndicatorsByAgentProj[];
  loading?: boolean;
}

const AgentIndicatorsChart: React.FC<AgentIndicatorsChartProps> = ({ data, loading }) => {
  return (
    <DashboardPanel
      title="Indicadores por agente"
      subtitle="Comparativo de conversaciones, servicio, respuesta y ventas"
      className="dashboard-panel--large"
    >
      {loading ? (
        <div className="dashboard-chart-empty">Cargando indicadores...</div>
      ) : data.length === 0 ? (
        <div className="dashboard-chart-empty">No hay datos para mostrar.</div>
      ) : (
        <div className="dashboard-chart">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="conversacionesCantidad"
                name="Conversaciones"
                radius={[8, 8, 0, 0]}
                fill="#3b82f6"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="nivelServicio"
                name="Nivel servicio (%)"
                stroke="#22c55e"
                strokeWidth={3}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tiempoPrimeraRespuestaMinutos"
                name="Respuesta (min)"
                stroke="#9333ea"
                strokeWidth={3}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ventaTotal"
                name="Ventas"
                stroke="#f59e0b"
                strokeWidth={3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardPanel>
  );
};

export default AgentIndicatorsChart;