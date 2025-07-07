import { PieChart } from '@mui/x-charts/PieChart'
import type { ConversationStatusCountResponseDto } from '@/Interfaces/Dashboard/DashboardInterfaces'

interface Props {
  title:   string
  subtitle:string
  data:    ConversationStatusCountResponseDto[] | null
}

export default function CustomPieChart({ title, subtitle, data }: Props) {

  if (!data || data.length === 0) {
    return <div>No hay datos para mostrar.</div>
  }
  const seriesData = data.map(item => ({
    id:    item.status, 
    value: item.count,
    label: item.status,   
  }))

  return (
    <div style={{ textAlign: 'center' }} className='pieChar__Container'>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <PieChart
        series={[{
          data:           seriesData,
          highlightScope: { fade: 'global', highlight: 'item' },
          faded:          { innerRadius: 10, additionalRadius: -10, color: 'gray' },
          valueFormatter: val => String(val),
        }]}
        width={400}
        height={400}
      />
    </div>
  )
}