import type { ResponseAgentAverageClienteDataResponseDto } from '@/Interfaces/Dashboard/DashboardInterfaces';
import { BarChart } from '@mui/x-charts/BarChart';

interface Props {
  data: ResponseAgentAverageClienteDataResponseDto[];
  agentName: string;
}

export default function AgentResponseChart({ data, agentName }: Props) {
  if (!data ?.length) return <div>No hay datos para mostrar.</div>;

  const items = data.map(d => ({
    name: d.ClientName ?? `#${d.ClienteId}`,
    value: d.AverageSeconds ?? 0
  }));

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Respuesta de {agentName}</h2>
      <p>Segundos promedio por top 10 cliente</p>
      <BarChart
        height={300}
        series={[{ data: items.map(i => i.value), label: 'Segundos' }]}
        xAxis={[{ data: items.map(i => i.name) }]}
        yAxis={[{ width: 50 }]}
      />
    </div>
  );
}