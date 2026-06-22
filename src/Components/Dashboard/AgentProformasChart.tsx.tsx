import React, { useMemo } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import DashboardPanel from "@/Components/Dashboard/DashboardPanel";
import type { DashboardIndicatorsByAgentProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";
import { formatNumber } from "@/Utils/ECommerce/formatters";

interface AgentProformasChartProps {
  rows: DashboardIndicatorsByAgentProj[];
  loading?: boolean;
}

const AgentProformasChart: React.FC<AgentProformasChartProps> = ({
  rows,
  loading = false,
}) => {
  const chartData = useMemo(() => {
    return [...rows]
      .filter((item) => item.agentId)
      .sort((a, b) => (b.proformasEnviadas ?? 0) - (a.proformasEnviadas ?? 0))
      .map((item) => ({
        agentName: item.agentName || `Agente ${item.agentId}`,
        value: item.proformasEnviadas ?? 0,
      }));
  }, [rows]);

  const labels = chartData.map((item) => item.agentName);
  const values = chartData.map((item) => item.value);

  return (
    <DashboardPanel
      title="Proformas por agente"
      subtitle="Cantidad de proformas enviadas por agente"
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
                fontSize: 11,
              },
            },
          ]}
          yAxis={[
            {
              width: 60,
              valueFormatter: (value: number | null) =>
                formatNumber(value ?? 0),
            },
          ]}
          series={[
            {
              data: values,
              label: "Proformas",
              color: "#4354f4",
              valueFormatter: (value: number | null) =>
                formatNumber(value ?? 0),
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

export default AgentProformasChart;