/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { BarChart } from '@mui/x-charts/BarChart'
import type {
  AdminAsigmentResponseTimeResponseDto,
  AverageAssignmentTimeResponseDto,
  WaitingClientResponseDto
} from '@/Interfaces/Dashboard/DashboardInterfaces'
import '@/Styles/Dashboard/CustomBarChart.css'

interface ChartItem {
  name: string
  label: string
  minutes: number
  seconds: number
  displayLabel: string
}

interface Props {
  title: string
  subtitle: string
  data:
    | AverageAssignmentTimeResponseDto[]
    | AdminAsigmentResponseTimeResponseDto[]
    | WaitingClientResponseDto[]
    | null
  threshold?: number
  onThresholdChange?: (value: number) => void
}

function CustomBarChart({
  title,
  subtitle,
  data,
  threshold,
  onThresholdChange
}: Props) {
  const isHorizontal = title === 'Clientes criticos'
  const hasInput = threshold !== undefined && typeof onThresholdChange === 'function'

  const items: ChartItem[] = Array.isArray(data)
    ? data.map(item => {
        const rawSeconds = (item as any).averageTime ?? (item as any).averageSeconds ?? 0
        const seconds = Math.floor(rawSeconds)
        const minutes = Math.floor(rawSeconds / 60)
        const name = (item as any).clientName ?? item.name ?? String((item as any).id)
        const displayLabel = seconds < 60 ? `${seconds}s` : `${minutes}min`
        return { name, minutes, seconds, label: `${name} (${displayLabel} / ${seconds}s)`, displayLabel }
      })
    : []

  const series = [
    {
      data: items.map(i => (i.seconds < 60 ? i.seconds : i.minutes)),
      label: 'Tiempo promedio',
      color: title === 'Promedio de Asignación' ? '#356ace' : '#3b7ec1ff',
      showLabel: true,
      valueFormatter: (_: number, context: any) => items[context.dataIndex].displayLabel
    }
  ]

  const axisProps = isHorizontal
    ? { yAxis: [{ data: items.map(i => i.label), width: 200 }] }
    : { xAxis: [{ data: items.map(i => i.label), minStep: 1 }], yAxis: [{ width: 60 }] }

  return (
    <div className="barChart__Container" style={{ textAlign: 'center' }}>
      <h2 className="custom__barChart-title">{title}</h2>
      <p className="custom__barChart-subtitle">{subtitle}</p>
      {hasInput && (
        <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'center' }}>
          <label>
            Minutos mínimos:{' '}
            <input
              type="number"
              value={threshold}
              min={1}
              onChange={e => onThresholdChange(Number(e.target.value))}
              style={{ width: 60, marginLeft: 8 }}
            />
          </label>
        </div>
      )}

      {items.length > 0 ? (
        <BarChart
          height={300}
          layout={isHorizontal ? 'horizontal' : 'vertical'}
          series={series as any}
          {...axisProps}
        />
      ) : (
        <div>No hay datos para mostrar.</div>
      )}
    </div>
  )
}

export default React.memo(CustomBarChart)