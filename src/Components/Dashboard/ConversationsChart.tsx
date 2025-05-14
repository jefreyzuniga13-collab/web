
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DateCountItem } from '@/Interfaces/Dashboard/DashboardInterfaces';

interface ConversationsChartProps {
  data: DateCountItem[] | null;
}

const ConversationsChart: React.FC<ConversationsChartProps> = ({ data }) => {
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
        <h3 className="chart-title">Conversaciones por Día</h3>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip labelFormatter={(value) => `Fecha: ${value}`} />
            <Line
              type="monotone"
              dataKey="count"
              name="Conversaciones"
              stroke="#0d6efd"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConversationsChart;