import * as React from 'react'
import { BarChart } from '@mui/x-charts/BarChart'
import type { AverageAssignmentTimeResponseDto } from '@/Interfaces/Dashboard/DashboardInterfaces'

interface Props {
  title:    string
  subtitle: string
  data:     AverageAssignmentTimeResponseDto[] | null
}

export default function CustomBarChart({ title, subtitle, data }: Props) {
  if (!data || data.length === 0) {
    return <div>No hay datos para mostrar.</div>
  }

  // 1) Extraigo las etiquetas para el eje X (puedes usar agentName en lugar de agentId)
  const xLabels = data.map(item => item.agentName ?? String(item.agentId))

  // 2) Preparo la serie de datos
  const series = [
    {
      data:  data.map(item => item.averageSeconds),      // valores de altura de cada barra
      label: 'Tiempo promedio (s)',                      // leyenda de la serie
    },
  ]

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>{title}</h2>
      <p>{subtitle}</p>

      <BarChart
        height={300}
        series={series}
        xAxis={[{ data: xLabels }]}
        yAxis={[{ width: 50 }]}
      />
    </div>
  )
}