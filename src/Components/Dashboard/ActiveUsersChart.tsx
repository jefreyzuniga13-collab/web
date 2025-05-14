
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DateCountItem } from '@/Interfaces/Dashboard/DashboardInterfaces';

interface ActiveUsersChartProps {
  data: DateCountItem[] | null;
}

const ActiveUsersChart: React.FC<ActiveUsersChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="chart-content">No hay datos disponibles</div>;
  }

  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  }));

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Usuarios Activos por Día</h3>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip labelFormatter={(value) => `Fecha: ${value}`} />
            <Area 
              type="monotone" 
              dataKey="count" 
              name="Usuarios Activos"
              stroke="#fd7e14" 
              fill="rgba(253, 126, 20, 0.2)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActiveUsersChart;