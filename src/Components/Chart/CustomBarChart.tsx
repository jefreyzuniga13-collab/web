/* eslint-disable @typescript-eslint/no-explicit-any */
import { BarChart } from '@mui/x-charts/BarChart'
import type {
  AdminAsigmentResponseTimeResponseDto,
  AverageAssignmentTimeResponseDto,
  WaitingClientResponseDto
} from '@/Interfaces/Dashboard/DashboardInterfaces'
import "@/Styles/Dashboard/CustomBarChart.css"

interface ChartItem {
  name: string
  value: number
}

interface Props {
  title: string
  subtitle: string
  data:
    | AverageAssignmentTimeResponseDto[]
    | AdminAsigmentResponseTimeResponseDto[]
    | WaitingClientResponseDto[]
    | null
}

export default function CustomBarChart({ title, subtitle, data }: Props) {
  if (!data || data.length === 0) return <div>No hay datos para mostrar.</div>

  const isHorizontal = title === "Clientes criticos"
  const items: ChartItem[] = data.map(item => ({
    name: item.name ?? String((item as any).id),
    value: (item as any).averageTime ?? (item as any).averageSeconds
  }))

  const series = [
    { data: items.map(i => i.value), label: 'Tiempo promedio (m)', color: title == "Clientes criticos" ? "#dc2626" : "#356ace" }
  ]

  const axisProps = isHorizontal
    ? { yAxis: [{ data: items.map(i => i.name), width: 100 }] }
    : {
        xAxis: [{ data: items.map(i => i.name) }],
        yAxis: [{ width: 50 }]
      }

  return (
    <div className='barChart__Container' style={{ textAlign: 'center' }}>
      <h2 className='custom__barChart-title'>{title}</h2>
      <p className='custom__barChart-subtitle'>{subtitle}</p>
      <BarChart
        height={300}
        layout={isHorizontal ? 'horizontal' : 'vertical'}
        series={series}
        {...axisProps}
      />
    </div>
  )
}