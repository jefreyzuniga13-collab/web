
import React from 'react'
import { PaginatedTable } from '../Common/PaginatedTable'
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"
import '@/Styles/Setting/SystemParamsTable.css'

interface Props {
  params: SystemParamResponseDto[]
  onEdit: (param: SystemParamResponseDto) => void
  onDelete: (param: SystemParamResponseDto) => void
  onView: (param: SystemParamResponseDto) => void
  loading?: boolean
}

export const SystemParamsTable: React.FC<Props> = ({
  params,
  onEdit,
  onDelete,
  onView,
  loading = false
}) => {
  const columns = [
    {
      key: 'id',
      header: 'ID',
      className: 'system-params-table__cell--id'
    },
    {
      key: 'name',
      header: 'Nombre',
      className: 'system-params-table__cell--name'
    },
    {
      key: 'value',
      header: 'Valor',
      className: 'system-params-table__cell--value',
      render: (value: string) => (
        <span className="system-params-table__badge system-params-table__badge--value">
          {value.length > 50 ? `${value.substring(0, 50)}...` : value}
        </span>
      )
    },
    {
      key: 'type',
      header: 'Tipo',
      className: 'system-params-table__cell--type',
      render: (type: string) => (
        <span className={`system-params-table__badge system-params-table__badge--${type}`}>
          {type}
        </span>
      )
    },
    {
      key: 'isActive',
      header: 'Estado',
      className: 'system-params-table__cell--status',
      render: (isActive: boolean) => (
        <span className={`system-params-table__badge system-params-table__badge--${isActive ? 'active' : 'inactive'}`}>
          {isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'description',
      header: 'Descripción',
      className: 'system-params-table__cell--description',
      render: (description: string) => (
        description.length > 30 ? `${description.substring(0, 30)}...` : description
      )
    }
  ]

  return (
    <PaginatedTable
      data={params}
      columns={columns}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      loading={loading}
      emptyMessage="No hay parámetros del sistema configurados."
      className="system-params-table"
      itemsPerPageOptions={[5, 10, 20, 50]}
      defaultItemsPerPage={10}
    />
  )
}