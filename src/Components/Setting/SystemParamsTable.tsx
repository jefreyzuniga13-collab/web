
import React from 'react';
import { Eye, Edit, Check, X, CirclePower, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface";
import '@/Styles/Setting/SystemParamsTable.css'

interface SystemParamsTableProps {
  data?: SystemParamResponseDto[];
  params?: SystemParamResponseDto[];
  onEdit: (param: SystemParamResponseDto) => void;
  onDelete: (param: SystemParamResponseDto) => void;
  onView: (param: SystemParamResponseDto) => void;
  loading?: boolean;
  isLoading?: boolean;
}

const SystemParamsTable: React.FC<SystemParamsTableProps> = ({ 
  data, 
  params, 
  onEdit, 
  onDelete, 
  onView, 
  loading = false,
  isLoading = false
}) => {
  const systemParams = data || params || [];
  const isLoadingState = loading || isLoading;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoadingState) {
    return (
      <div className="system-params-table__loading">
        <div className="system-params-table__spinner"></div>
        <span>Cargando parámetros...</span>
      </div>
    );
  }

  if (systemParams.length === 0) {
    return (
      <div className="system-params-table__empty">
        <div className="system-params-table__empty-icon">
          <Users size={48} />
        </div>
        <h3 className="system-params-table__empty-title">No hay parámetros</h3>
        <p className="system-params-table__empty-description">No se encontraron parámetros que coincidan con los criterios de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="system-params-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="system-params-table__header-cell">Nombre</TableHead>
            <TableHead className="system-params-table__header-cell">Tipo</TableHead>
            <TableHead className="system-params-table__header-cell">Valor</TableHead>
            <TableHead className="system-params-table__header-cell">Estado</TableHead>
            {/* <TableHead className="system-params-table__header-cell">Última actualización</TableHead> */}
            <TableHead className="system-params-table__header-cell">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {systemParams.map((param) => (
            <TableRow key={param.id} className="system-params-table__row">
              <TableCell className="system-params-table__cell">
                <div className="system-params-table__param-info">
                  <span className="system-params-table__param-name">{param.name}</span>
                </div>
              </TableCell>
              <TableCell className="system-params-table__cell">
                <span className={`system-params-table__type-badge system-params-table__type-badge--${param.type.toLowerCase()}`}>
                  {param.type}
                </span>
              </TableCell>
              <TableCell className="system-params-table__cell">
                <div className="system-params-table__value">
                  <span className="system-params-table__value-text">
                    {param.value ? `${param.value.substring(0, 50)}${param.value.length > 50 ? '...' : ''}` : ''}
                  </span>
                </div>
              </TableCell>
              <TableCell className="system-params-table__cell">
                <div className={`system-params-table__status ${param.isActive ? 'system-params-table__status--active' : 'system-params-table__status--inactive'}`}>
                  <div className="system-params-table__status-icon">
                    {param.isActive ? <Check size={16} /> : <X size={16} />}
                  </div>
                  <span className="system-params-table__status-text">
                    {param.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </TableCell>
              {/* <TableCell className="system-params-table__cell">
                <div className="system-params-table__last-activity">
                  <span className="system-params-table__date">
                    {formatDate(param.updatedAt)}
                  </span>
                </div>
              </TableCell> */}
              <TableCell className="system-params-table__cell">
                <div className="system-params-table__actions">
                  <button 
                    className="system-params-table__action-btn system-params-table__action-btn--view"
                    onClick={() => onView(param)}
                    title="Ver detalles"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    className="system-params-table__action-btn system-params-table__action-btn--edit"
                    onClick={() => onEdit(param)}
                    title="Editar parámetro"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="system-params-table__action-btn system-params-table__action-btn--delete"
                    onClick={() => onDelete(param)}
                    title={param.isActive ? "Desactivar parámetro" : "Activar parámetro"}
                  >
                    <CirclePower size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SystemParamsTable;