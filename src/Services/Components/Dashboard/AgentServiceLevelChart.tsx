import React, { useMemo } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import DashboardPanel from "@/Services/Components/Dashboard/DashboardPanel";
import type { DashboardIndicatorsByAgentProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface AgentServiceLevelChartProps {
  rows: DashboardIndicatorsByAgentProj[];
  loading?: boolean;
}

const formatPercent = (value?: number | null) => {
  return `${new Intl.NumberFormat("es-NI", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value ?? 0)}%`;
};

const AgentServiceLevelChart: React.FC<AgentServiceLevelChartProps> = ({
  rows,
  loading = false,
}) => {
  const chartData = useMemo(() => {
    return [...rows]
      .filter((item) => item.agentId)
      .sort((a, b) => (b.nivelServicio ?? 0) - (a.nivelServicio ?? 0))
      .map((item) => ({
        agentName: item.agentName || `Agente ${item.agentId}`,
        value: item.nivelServicio ?? 0,
      }));
  }, [rows]);

  const labels = chartData.map((item) => item.agentName);
  const values = chartData.map((item) => item.value);

  return (
    <DashboardPanel
      title="Nivel de servicio por agente"
      subtitle="Porcentaje de conversaciones con gestión comercial"
      loading={loading}
      className="dashboard-chart-panel"
    >
      {chartData.length === 0 ? (
        <div className="dashboard-chart-empty">No hay datos para mostrar.</div>
      ) : (
        <BarChart
        
          height={320}
          xAxis={[
            {
              scaleType: "band",
              data: labels,
              tickLabelStyle: {
                fontSize: 12,
              },
            },
          ]}
          yAxis={[
            {
              width: 60,
              valueFormatter: (value: number | null) =>
                formatPercent(value ?? 0),
            },
          ]}
          series={[
            {
              data: values,
              label: "Nivel servicio",
              color: "#10b981",
              valueFormatter: (value: number | null) =>
                formatPercent(value ?? 0),
            },
          ]}
          margin={{
            top: 35,
            right: 20,
            bottom: 45,
            left: 10,
          }}
        />
      )}
    </DashboardPanel>
  );
};

export default AgentServiceLevelChart;