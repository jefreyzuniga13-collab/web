import React, { useMemo } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import DashboardPanel from "@/Services/Components/Dashboard/DashboardPanel";
import type { DashboardIndicatorsByAgentProj } from "@/Interfaces/Dashboard/PerformanceDashboardInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";
import { formatDecimal, formatNumber } from "@/Utils/ECommerce/formatters";

interface AgentIndicatorsChartProps {
  data: DashboardIndicatorsByAgentProj[];
  loading?: boolean;
}

const CHART_COLORS = {
  conversations: "#0070B4",
  proformas: "#4354f4",
  service: "#10b981",
  response: "#f59e0b",
};

const formatAgentName = (value?: string | null) => {
  if (!value) return "Sin agente";

  const clean = value.trim();

  if (clean.length <= 18) return clean;

  return `${clean.slice(0, 17)}…`;
};

const AgentIndicatorsChart: React.FC<AgentIndicatorsChartProps> = ({
  data,
  loading = false,
}) => {
  const chartData = useMemo(() => {
    return [...(data ?? [])]
      .filter((item) => item.agentId)
      .map((item) => ({
        agentName: item.agentName || "Sin agente",
        agentLabel: formatAgentName(item.agentName),
        conversacionesCantidad: item.conversacionesCantidad ?? 0,
        proformasEnviadas: item.proformasEnviadas ?? 0,
        nivelServicio: item.nivelServicio ?? 0,
        tiempoPrimeraRespuestaMinutos:
          item.tiempoPrimeraRespuestaMinutos ?? 0,
      }));
  }, [data]);

  const labels = useMemo(() => {
    return chartData.map((item) => item.agentLabel);
  }, [chartData]);

  const conversaciones = useMemo(() => {
    return chartData.map((item) => item.conversacionesCantidad);
  }, [chartData]);

  const proformas = useMemo(() => {
    return chartData.map((item) => item.proformasEnviadas);
  }, [chartData]);

  const nivelServicio = useMemo(() => {
    return chartData.map((item) => item.nivelServicio);
  }, [chartData]);

  const respuestaMinutos = useMemo(() => {
    return chartData.map((item) => item.tiempoPrimeraRespuestaMinutos);
  }, [chartData]);

  return (
    <DashboardPanel
      title="Indicadores por agente"
      subtitle="Comparativo de conversaciones, servicio y primera respuesta"
      className="dashboard-panel--large"
    >
      {loading ? (
        <div className="dashboard-chart-empty">Cargando indicadores...</div>
      ) : chartData.length === 0 ? (
        <div className="dashboard-chart-empty">No hay datos para mostrar.</div>
      ) : (
        <div className="dashboard-mui-chart">
          <BarChart
            height={330}
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
                data: conversaciones,
                label: "Conversaciones",
                color: CHART_COLORS.conversations,
                valueFormatter: (value: number | null) =>
                  formatNumber(value ?? 0),
              },
              {
                data: proformas,
                label: "Proformas",
                color: CHART_COLORS.proformas,
                valueFormatter: (value: number | null) =>
                  formatNumber(value ?? 0),
              },
              {
                data: nivelServicio,
                label: "Nivel servicio %",
                color: CHART_COLORS.service,
                valueFormatter: (value: number | null) =>
                  `${formatDecimal(value ?? 0)}%`,
              },
              {
                data: respuestaMinutos,
                label: "Respuesta min.",
                color: CHART_COLORS.response,
                valueFormatter: (value: number | null) =>
                  `${formatDecimal(value ?? 0)} min`,
              },
            ]}
            margin={{
              top: 35,
              right: 20,
              bottom: 35,
              left: 10,
            }}
          />
        </div>
      )}
    </DashboardPanel>
  );
};

export default AgentIndicatorsChart;