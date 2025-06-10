
//import React from 'react';
import { Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import Pagination from '@/Components/ui/Pagination';
import type { DataTableProps } from '@/Interfaces/GlobalInterface';
import '@/Styles/ui/DataTable.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyIcon = <Users size={48} />,
  emptyTitle = "No hay datos",
  emptyDescription = "No se encontraron elementos que coincidan con los criterios de búsqueda.",
  loadingText = "Cargando...",
  pagination,
  onPageChange,
  onPageSizeChange,
  maxHeight = "60vh",
  className = ""
}: DataTableProps<T>) => {
  if (loading) {
    return (
      <div className="data-table__loading">
        <div className="data-table__spinner"></div>
        <span>{loadingText}</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="data-table__empty">
        <div className="data-table__empty-icon">
          {emptyIcon}
        </div>
        <h3 className="data-table__empty-title">{emptyTitle}</h3>
        <p className="data-table__empty-description">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={`data-table ${className}`}>
      <div className="data-table__container" style={{ maxHeight }}>
        <Table>
          <TableHeader className="data-table__header">
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key} 
                  className="data-table__header-cell"
                  style={{ width: column.width }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="data-table__body">
            {data.map((item, index) => (
              <TableRow key={item.id || index} className="data-table__row">
                {columns.map((column) => (
                  <TableCell key={column.key} className="data-table__cell">
                    {column.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {pagination && onPageChange && onPageSizeChange && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
};

export default DataTable;