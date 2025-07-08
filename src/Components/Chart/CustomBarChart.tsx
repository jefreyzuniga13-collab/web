import { BarChart } from '@mui/x-charts/BarChart'
import type { AdminAsigmentResponseTimeResponseDto, AverageAssignmentTimeResponseDto,  } from '@/Interfaces/Dashboard/DashboardInterfaces'
import "@/Styles/Dashboard/CustomBarChart.css"
interface Props {
  title:    string
  subtitle: string
  data:     AverageAssignmentTimeResponseDto[] | AdminAsigmentResponseTimeResponseDto[] | null
}

export default function CustomBarChart({ title, subtitle, data }: Props) {
  if (!data || data.length === 0) {
    return <div>No hay datos para mostrar.</div>
  }

  const xLabels = data.map(item => item.name ?? String(item.id))

  const series = [
    {
      data:  data.map(item => item.averageTime),
      label: 'Tiempo promedio (s)',
    },
  ]

  return (
    <div style={{ textAlign: 'center' }} className='barChart__Container'>
      <h2 className='custom__barChart-title'>{title}</h2>
      <p className='custom__barChart-subtitle'>{subtitle}</p>

      <BarChart
        height={300}
        series={series}
        xAxis={[{ data: xLabels }]}
        yAxis={[{ width: 50 }]}
      />
    </div>
  )
}