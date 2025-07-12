/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ConversationStatusCountResponseDto } from '@/Interfaces/Dashboard/DashboardInterfaces'
import  '@/Styles/Dashboard/CustomPieChart.css'
const COLORS = ['#356ace', '#10b981', '#f59e0b', '#dc2626', '#3b82f6', '#9ca3af']

interface Props {
  // title:    string
  // subtitle: string
  data:     ConversationStatusCountResponseDto[] | null
}

export default function CustomPieChart({ data }: Props) {
  const navigate = useNavigate()

  if (!data || data.length === 0) {
    return <div>No hay datos para mostrar recientes hoy.</div>
  }

  // Preparamos el array { name, value }
  const chartData = data.map(item => ({
    name:  item.status,
    value: item.count,
  }))

  const RADIAN = Math.PI / 180

  // Función que dibuja porcentaje (dentro) y nombre (fuera)
  const renderAllLabels = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload,
  }: any) => {
    // coordenadas para el % (entre inner y outer)
    const radius   = innerRadius + (outerRadius - innerRadius) * 0.5
    const xPercent = cx + radius * Math.cos(-midAngle * RADIAN)
    const yPercent = cy + radius * Math.sin(-midAngle * RADIAN)

    // coordenadas para el nombre (apenas un poco más fuera)
    const outerOffset = outerRadius + 20
    const xName = cx + outerOffset * Math.cos(-midAngle * RADIAN)
    const yName = cy + outerOffset * Math.sin(-midAngle * RADIAN)

    return (
      <g>
        {/* Porcentaje dentro */}
        <text
          x={xPercent}
          y={yPercent}
          fill="white"
          textAnchor={xPercent > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={12}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>

        {/* Nombre fuera, con el color del sector */}
        <text
          x={xName}
          y={yName}
          fill={COLORS[index % COLORS.length]}
          textAnchor={xName > cx ? 'start' : 'end'}
          dominantBaseline="central"
          fontSize={12}
        >
          {payload.name}
        </text>
      </g>
    )
  }

  return (
    <div className="pieChart__container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={100}
            // labelLine dibuja la línea guía
            labelLine={true}
            // renderAllLabels dibuja % y nombre con sus colores
            label={renderAllLabels}
            onClick={(entry) => {
              const status = (entry as any).name
              navigate(`/conversation/${encodeURIComponent(status)}`)
            }}
          >
            {chartData.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val: number) => [`${val}`, 'Count']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
