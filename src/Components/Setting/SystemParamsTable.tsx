
import React from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"

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
  if (loading) {
    return (
      <div className="system-params-table__loading">
        <div className="system-params-table__spinner"></div>
      </div>
    )
  }

  if (params.length === 0) {
    return (
      <div className="system-params-table__empty">
        <p className="system-params-table__empty-text">No hay parámetros del sistema configurados.</p>
      </div>
    )
  }

  return (
    <div className="system-params-table">
      <table className="system-params-table__table">
        <thead className="system-params-table__head">
          <tr>
            <th className="system-params-table__header">ID</th>
            <th className="system-params-table__header">Nombre</th>
            <th className="system-params-table__header">Valor</th>
            <th className="system-params-table__header">Tipo</th>
            <th className="system-params-table__header">Descripción</th>
            <th className="system-params-table__header system-params-table__header--actions">Acciones</th>
          </tr>
        </thead>
        <tbody className="system-params-table__body">
          {params.map((param) => (
            <tr key={param.id} className="system-params-table__row">
              <td className="system-params-table__cell system-params-table__cell--id">
                {param.id}
              </td>
              <td className="system-params-table__cell system-params-table__cell--name">
                {param.name}
              </td>
              <td className="system-params-table__cell system-params-table__cell--value">
                <span className="system-params-table__badge system-params-table__badge--value">
                  {param.value}
                </span>
              </td>
              <td className="system-params-table__cell system-params-table__cell--type">
                <span className={`system-params-table__badge system-params-table__badge--${param.type}`}>
                  {param.type}
                </span>
              </td>
              <td className="system-params-table__cell system-params-table__cell--description">
                {param.description}
              </td>
              <td className="system-params-table__cell system-params-table__cell--actions">
                <div className="system-params-table__actions">
                  <button
                    onClick={() => onView(param)}
                    className="system-params-table__action system-params-table__action--view"
                    title="Ver detalles"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onEdit(param)}
                    className="system-params-table__action system-params-table__action--edit"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(param)}
                    className="system-params-table__action system-params-table__action--delete"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}