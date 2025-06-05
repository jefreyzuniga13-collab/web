/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ReusableTable } from './ReusableTable'

interface PaginatedTableProps {
  data: any[]
  columns: any[]
  onEdit?: (item: any) => void
  onDelete?: (item: any) => void
  onView?: (item: any) => void
  loading?: boolean
  emptyMessage?: string
  className?: string
  itemsPerPageOptions?: number[]
  defaultItemsPerPage?: number
}

export const PaginatedTable: React.FC<PaginatedTableProps> = ({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  className = "",
  itemsPerPageOptions = [5, 10, 20, 50],
  defaultItemsPerPage = 10
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('...')
        pageNumbers.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1)
        pageNumbers.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        pageNumbers.push(1)
        pageNumbers.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('...')
        pageNumbers.push(totalPages)
      }
    }
    
    return pageNumbers
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`paginated-table ${className}`}>
      <ReusableTable
        data={paginatedData}
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        loading={loading}
        emptyMessage={emptyMessage}
      />
      
      {!loading && totalItems > 0 && (
        <div className="system-params-table__pagination">
          <div className="system-params-table__pagination-info">
            Mostrando {startItem} a {endItem} de {totalItems} elementos
          </div>
          
          <div className="system-params-table__pagination-controls">
            <div className="pagination-items-per-page">
              <span className="pagination-label">Elementos por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="system-params-table__pagination-select"
              >
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="pagination-pages">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button pagination-button--prev"
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              
              {getPageNumbers().map((pageNumber, index) => (
                <React.Fragment key={index}>
                  {pageNumber === '...' ? (
                    <span className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(pageNumber as number)}
                      className={`pagination-button ${
                        currentPage === pageNumber ? 'pagination-button--active' : ''
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )}
                </React.Fragment>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button pagination-button--next"
                title="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .paginated-table {
          background-color: var(--color-white);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
          border: var(--border-width) solid var(--color-gray-200);
          overflow: hidden;
        }
        
        .pagination-items-per-page {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .pagination-label {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          white-space: nowrap;
        }
        
        .pagination-pages {
          display: flex;
          gap: var(--spacing-xs);
          align-items: center;
        }
        
        .pagination-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border: var(--border-width) solid var(--color-gray-300);
          border-radius: var(--border-radius-sm);
          background-color: var(--color-white);
          color: var(--color-gray-700);
          font-size: var(--font-size-sm);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        
        .pagination-button:hover:not(:disabled) {
          background-color: var(--color-gray-50);
          border-color: var(--color-gray-400);
        }
        
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination-button--active {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: var(--color-white);
        }
        
        .pagination-button--active:hover {
          background-color: var(--color-primary-hover);
          border-color: var(--color-primary-hover);
        }
        
        .pagination-ellipsis {
          padding: 0 var(--spacing-xs);
          color: var(--color-gray-400);
          font-size: var(--font-size-sm);
        }
        
        @media (max-width: 768px) {
          .system-params-table__pagination {
            flex-direction: column;
            gap: var(--spacing-md);
            align-items: stretch;
          }
          
          .system-params-table__pagination-controls {
            flex-direction: column;
            gap: var(--spacing-md);
          }
          
          .pagination-items-per-page {
            justify-content: center;
          }
          
          .pagination-pages {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}
