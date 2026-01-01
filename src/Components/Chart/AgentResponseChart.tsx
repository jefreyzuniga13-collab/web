import { useEffect, useState } from 'react';
import type { ResponseAgentAverageClienteDataResponseDto, FilterForm } from '@/Interfaces/Dashboard/DashboardInterfaces';
import { BarChart } from '@mui/x-charts/BarChart';
import { ConversationService } from '@/Services/chat/ConversationService';
import { formatoNicaragua } from '@/Utils/LocalDateFormat';
import '@/Styles/Dashboard/CustomBarChart.css';

import { useUsers } from '@/Hooks/Auth/useUsers';

const getInitialFilters = (): FilterForm => {
  const saved = localStorage.getItem('dashboardFilters');
  if (saved) return JSON.parse(saved) as FilterForm;

  const fmt = formatoNicaragua(new Date());

  return {
    from: fmt,
    to: fmt,
    startTime: null,
    endTime: null,
    agentId: null,
    agentName: null,
    adminUserId: null,
    adminUserName: null,
    companiesId: null,
      contactId: null,
  contactName:  null,
  clientId:  null,
  clientName:  null,
    today: false,
    yesterday: false,
    tomorrow: false,
  };
};

export default function AgentResponseChart({subtitle }: { title: string; subtitle: string }) {
  const [chartFilters, setChartFilters] = useState<FilterForm>(getInitialFilters);
  const [data, setData] = useState<ResponseAgentAverageClienteDataResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const { agents, getAgents } = useUsers();

 useEffect(() => {
  getAgents();
}, [getAgents]);


  useEffect(() => {
    if (!chartFilters.agentId) return;
    const fetchData = async () => {
      setLoading(true);
      const response = await ConversationService.responseAgentAverageAsync(chartFilters);
      setData(response.clienteData || []);
      setLoading(false);
    };
    fetchData();
  }, [chartFilters.agentId]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    const selectedAgent = agents.find(a => a.userId === selectedId);
    setChartFilters(prev => ({
      ...prev,
      agentId: selectedId || null,
      agentName: selectedAgent?.fullName || null,
    }));
  };

  const formatTime = (value: number | null) => {
    if (value == null) return '';
    const secs = Math.floor(value);
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const totalClients = data.length;
  const totalSeconds = data.reduce((sum, d) => sum + (d.averageSeconds ?? 0), 0);
  const globalAvgSeconds = totalClients ? totalSeconds / totalClients : 0;

  const top3 = [...data]
    .sort((a, b) => (b.averageSeconds ?? 0) - (a.averageSeconds ?? 0))
    .slice(0, 10)
    .map(d => ({
      name: d.clientName ?? `#${d.clienteId}`,
      value: d.averageSeconds ?? 0,
    }));

  return (
    <div style={{ textAlign: 'center' }} className='barChart__Container'>
      <h2 className='custom__barChart-title'>Respuesta de {chartFilters.agentName ?? 'Agente'}</h2>
      {/* {title && <h3 className="chart-title">{title}</h3>} */}
      {subtitle && <p className="chart-subtitle">{subtitle}</p>}

      <div style={{ marginBottom: 16 }}>
        <select onChange={handleSelectChange} value={chartFilters.agentId ?? ''} className='custom__barChart-select'>
          <option value="" className='custom-barChart-select__option__header'>Seleccione un agente</option>
          {agents?.map(agent => (
            <option key={agent.userId} value={agent.userId} className='custom-barChart-select__option'>
              {agent.fullName}
            </option>
          ))}
        </select>
      </div>

      {!chartFilters.agentId && <div>Seleccione un agente para ver el gráfico.</div>}
      {loading && <div>Cargando datos...</div>}
      {!loading && chartFilters.agentId && !data.length && <div>No hay datos para mostrar.</div>}

      {!loading && data.length > 0 && (
        <>
          <p className='custom__barChart-subtitle'>
            Promedio global: <strong>{formatTime(globalAvgSeconds)}</strong> (<em>{totalClients} contactos</em>)
          </p>

          <BarChart
            height={300}
            series={[{
              data: top3.map(i => i.value),
              label: 'Tiempo de respuesta',
              valueFormatter: formatTime,
            }]}
            xAxis={[{
              data: top3.map(i => i.name),
            }]}
            yAxis={[{ width: 60, valueFormatter: formatTime }]}
            slotProps={{
              tooltip: {
                trigger: 'axis'
              }
            }}
          />
        </>
      )}
    </div>
  );
}