/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react'
import { Edit, Trash2, Eye } from 'lucide-react'
import '@/Styles/Common/ReusableTable.css' // Import your CSS styles

interface Column {
  key: string
  header: string
  render?: (value: any, item: any) => React.ReactNode
  className?: string
}

interface ReusableTableProps {
  data: any[]
  columns: Column[]
  onEdit?: (item: any) => void
  onDelete?: (item: any) => void
  onView?: (item: any) => void
  loading?: boolean
  emptyMessage?: string
  className?: string
}

export const ReusableTable: React.FC<ReusableTableProps> = ({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  className = ""
}) => {
  if (loading) {
    return (
      <div className="reusable-table__loading">
        <div className="reusable-table__spinner"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="reusable-table__empty">
        <p className="reusable-table__empty-text">{emptyMessage}</p>
        <img src="https://i.ibb.co/QF1nWVyv/nodata.png" alt="sin registros" className='reusable-table__empty-img' />
      </div>
    )
  }

  return (
    <div className={`reusable-table ${className}`}>
      <table className="reusable-table__table">
        <thead className="reusable-table__head">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`reusable-table__header ${column.className || ''}`}>
                {column.header}
              </th>
            ))}
            {(onEdit || onDelete || onView) && (
              <th className="reusable-table__header reusable-table__header--actions">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody className="reusable-table__body">
          {data.map((item, index) => (
            <tr key={item.id || index} className="reusable-table__row">
              {columns.map((column) => (
                <td key={column.key} className={`reusable-table__cell ${column.className || ''}`}>
                  {column.render ? column.render(item[column.key], item) : item[column.key]}
                </td>
              ))}
              {(onEdit || onDelete || onView) && (
                <td className="reusable-table__cell reusable-table__cell--actions">
                  <div className="reusable-table__actions">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        className="reusable-table__action reusable-table__action--view"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="reusable-table__action reusable-table__action--edit"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="reusable-table__action reusable-table__action--delete"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}