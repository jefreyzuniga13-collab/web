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
  days: number
  hours: number
  minutes: number
  seconds: number
  displayLabel: string
}

interface Props {
  title?: string
  subtitle?: string
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
    ? data
        .map(item => {
          const raw = (item as any).averageTime ?? (item as any).averageSeconds ?? 0
          let remaining = Math.floor(raw)

          const days = Math.floor(remaining / 86400)
          remaining %= 86400

          const hours = Math.floor(remaining / 3600)
          remaining %= 3600

          const minutes = Math.floor(remaining / 60)
          const seconds = remaining % 60

          const parts: string[] = []
          if (days) parts.push(`${days}d`)
          if (hours) parts.push(`${hours}h`)
          if (minutes) parts.push(`${minutes}m`)
          if (seconds) parts.push(`${seconds}s`)

          const displayLabel = parts.join(' ') || '0s'
          const name = (item as any).clientName ?? (item as any).name ?? ''

          if (!name || name.trim() === '' || name === 'Pendiente') return null

          return {
            name,
            days,
            hours,
            minutes,
            seconds,
            displayLabel,
            label: `${name} (${displayLabel})`
          }
        })
        .filter((i): i is ChartItem => i !== null)
    : []

  const series = [
    {
      data: items.map(i =>
        i.days * 86400 + i.hours * 3600 + i.minutes * 60 + i.seconds
      ),
      label: 'Tiempo promedio',
      showLabel: true,
      valueFormatter: (_: number, ctx: any) => items[ctx.dataIndex].displayLabel
    }
  ]

  const axisProps = isHorizontal
    ? { yAxis: [{ data: items.map(i => i.label), width: 200 }] }
    : { xAxis: [{ data: items.map(i => i.label), minStep: 1 }], yAxis: [{ width: 60 }] }

  return (
    <div className="barChart__Container" style={{ textAlign: 'center' }}>
      {title && <h2 className="custom__barChart-title">{title}</h2>}
      {subtitle && <p className="custom__barChart-subtitle">{subtitle}</p>}
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