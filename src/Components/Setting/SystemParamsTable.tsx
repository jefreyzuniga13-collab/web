
import React from 'react';
import { Eye, Edit, Check, X, CirclePower, Users } from 'lucide-react';
import DataTable from '@/Components/ui/DataTable';
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface";
import type { Column, PaginationInfo } from '@/Interfaces/GlobalInterface';
import '@/Styles/Setting/SystemParamDetails.css';

interface SystemParamsTableProps {
  data?: SystemParamResponseDto[];
  params?: SystemParamResponseDto[];
  onEdit: (param: SystemParamResponseDto) => void;
  onDelete: (param: SystemParamResponseDto) => void;
  onView: (param: SystemParamResponseDto) => void;
  loading?: boolean;
  isLoading?: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const SystemParamsTableNew: React.FC<SystemParamsTableProps> = ({ 
  data, 
  params, 
  onEdit, 
  onDelete, 
  onView, 
  loading = false,
  isLoading = false,
  pagination,
  onPageChange,
  onPageSizeChange
}) => {
  const systemParams = data || params || [];
  const isLoadingState = loading || isLoading;

  const getTypeBadgeClass = (type: string) => {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'prompts':
        return 'system-params-table__type-badge--prompts';
      case 'keywords':
        return 'system-params-table__type-badge--keywords';
      case 'temp':
        return 'system-params-table__type-badge--temp';
      default:
        return 'system-params-table__type-badge--default';
    }
  };

  const columns: Column<SystemParamResponseDto>[] = [
    {
      key: 'name',
      header: 'Nombre',
      render: (param) => (
        <div className="system-params-table__param-info">
          <span className="system-params-table__param-name">{param.name}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tipo',
      width: '120px',
      render: (param) => (
        <span className={`system-params-table__type-badge ${getTypeBadgeClass(param.type)}`}>
          {param.type}
        </span>
      )
    },
    {
      key: 'value',
      header: 'Valor',
      render: (param) => (
        <div className="system-params-table__value">
          <span className="system-params-table__value-text" title={param.value}>
            {param.value ? `${param.value.substring(0, 50)}${param.value.length > 50 ? '...' : ''}` : ''}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      width: '100px',
      render: (param) => (
        <div className={`system-params-table__status ${param.isActive ? 'system-params-table__status--active' : 'system-params-table__status--inactive'}`}>
          <div className="system-params-table__status-icon">
            {param.isActive ? <Check size={16} /> : <X size={16} />}
          </div>
          <span className="system-params-table__status-text">
            {param.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '120px',
      render: (param) => (
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
      )
    }
  ];

  return (
    <DataTable
      data={systemParams}
      columns={columns}
      loading={isLoadingState}
      emptyIcon={<Users size={48} />}
      emptyTitle="No hay parámetros"
      emptyDescription="No se encontraron parámetros que coincidan con los criterios de búsqueda."
      loadingText="Cargando parámetros..."
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      maxHeight="60vh"
    />
  );
};

export default SystemParamsTableNew;