
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MessagesSentReceived } from '@/Interfaces/Dashboard/DashboardInterfaces';

interface MessageComparisonChartProps {
  data: MessagesSentReceived | null;
}

const MessageComparisonChart: React.FC<MessageComparisonChartProps> = ({ data }) => {
  if (!data || (!data.sent.length && !data.received.length)) {
    return <div className="chart-content">No hay datos disponibles</div>;
  }

  // Combine sent and received data by date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const combinedData: any[] | undefined = [];
  const dateMap = new Map();

  // Process sent data
  data.sent.forEach(item => {
    const date = new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    dateMap.set(date, { date, sent: item.count, received: 0 });
  });

  // Process received data
  data.received.forEach(item => {
    const date = new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    if (dateMap.has(date)) {
      const existingData = dateMap.get(date);
      dateMap.set(date, { ...existingData, received: item.count });
    } else {
      dateMap.set(date, { date, sent: 0, received: item.count });
    }
  });

  // Convert map to array
  dateMap.forEach(value => {
    combinedData.push(value);
  });

  // Sort by date
  combinedData.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('/'));
    const dateB = new Date(b.date.split('/').reverse().join('/'));
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Mensajes Enviados vs. Recibidos</h3>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={combinedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip labelFormatter={(value) => `Fecha: ${value}`} />
            <Legend />
            <Bar dataKey="sent" name="Enviados" fill="#0d6efd" />
            <Bar dataKey="received" name="Recibidos" fill="#198754" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MessageComparisonChart;