import type { ResponseAgentAverageClienteDataResponseDto } from '@/Interfaces/Dashboard/DashboardInterfaces';
import { BarChart } from '@mui/x-charts/BarChart';
import '@/Styles/Dashboard/CustomBarChart.css'
interface Props {
  data: ResponseAgentAverageClienteDataResponseDto[];
  agentName: string;
  title: string;
  subtitle: string;
}

export default function AgentResponseChart({ data, agentName, title, subtitle }: Props) {
  if (!data?.length) return <div>No hay datos para mostrar.</div>;

  // 1. Datos completos
  const totalClients = data.length;
  const totalSeconds = data.reduce((sum, d) => sum + (d.averageSeconds ?? 0), 0);
  const globalAvgSeconds = totalSeconds / totalClients;

  // 2. Top 10 por orden descendente
  const top10 = [...data]
    .sort((a, b) => (b.averageSeconds ?? 0) - (a.averageSeconds ?? 0))
    .slice(0, 10)
    .map(d => ({
      name: d.clientName ?? `#${d.clienteId}`,
      value: d.averageSeconds ?? 0,
    }));

  // 3. Formateador de tiempo
  const formatTime = (value: number | null) => {
    if (value == null) return '';
    const secs = Math.floor(value);
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div style={{ textAlign: 'center' }} className='barChart__Container'>
      <h2 className='custom__barChart-title'>Respuesta de {agentName}</h2>
      {title && <h3 className="chart-title">{title}</h3>}
      {subtitle && <p className="chart-subtitle">{subtitle}</p>}
     <p className='custom__barChart-subtitle'>
        Promedio global: <strong>{formatTime(globalAvgSeconds)}</strong> (<em>{totalClients} clientes</em>)
      </p>

      <BarChart
        height={300}
        series={[
          {
            data: top10.map(i => i.value),
            label: 'Tiempo de respuesta',
            valueFormatter: formatTime,
          },
        ]}
        xAxis={[{ data: top10.map(i => i.name), scaleType: 'band' }]}
        yAxis={[{ width: 60, valueFormatter: formatTime }]}
        slotProps={{
          tooltip: { trigger: 'item' },
        }}
      />
    </div>
  );
}