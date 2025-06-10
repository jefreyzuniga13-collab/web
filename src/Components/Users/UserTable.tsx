
import React from 'react';
import { Eye, Edit, Check, X, CirclePower, Users } from 'lucide-react';
import DataTable from '@/Components/ui/DataTable';
import type { User } from '@/Interfaces/User/UserInterfaces';
import type { Column, PaginationInfo } from '@/Interfaces/GlobalInterface';
import '@/Styles/Users/UserTable.css';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (userId: number) => void;
  loading: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  onEdit, 
  onDelete, 
  onView, 
  loading,
  pagination,
  onPageChange,
  onPageSizeChange
}) => {
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

  const columns: Column<User>[] = [
    {
      key: 'avatar',
      header: 'Foto',
      width: '80px',
      render: (user) => (
        <div className="user-table__avatar-container">
          <div className="user-table__avatar">
            {user.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName} 
                className="user-table__avatar-image"
              />
            ) : (
              <div className="user-table__avatar-placeholder">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (user) => (
        <div className="user-table__user-info">
          <span className="user-table__value user-table__user-name">{user.fullName}</span>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => <span className="user-table__value user-table__email">{user.email}</span>
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (user) => (
        <div className="user-table__roles">
          {user.roles.map((role) => (
            <span 
              key={role.roleId} 
              className="user-table__value user-table__role-badge"
            >
              {role.roleName}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      render: (user) => (
        <div className={`user-table__status ${user.isActive ? 'user-table__status--active' : 'user-table__status--inactive'}`}>
          <div className="user-table__status-icon">
            {user.isActive ? <Check size={16} /> : <X size={16} />}
          </div>
          <span className="user-table__value user-table__status-text">
            {user.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )
    },
    {
      key: 'lastActivity',
      header: 'Última actividad',
      render: (user) => (
        <div className="user-table__last-activity">
          <span className="user-table__value user-table__date">
            {user.lastOnline ? formatDate(user.lastOnline) : 'Nunca'}
          </span>
          {user.isOnline && (
            <span className="user-table__online-indicator">
              En línea
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '120px',
      render: (user) => (
        <div className="user-table__actions">
          <button 
            className="user-table__action-btn user-table__action-btn--view"
            onClick={() => onView(user.userId)}
            title="Ver detalles"
          >
            <Eye size={20} />
          </button>
          <button 
            className="user-table__action-btn user-table__action-btn--edit"
            onClick={() => onEdit(user)}
            title="Editar usuario"
          >
            <Edit size={20} />
          </button>
          <button 
            className="user-table__action-btn user-table__action-btn--delete"
            onClick={() => onDelete(user)}
            title={user.isActive ? "Desactivar usuario" : "Activar usuario"}
          >
            <CirclePower size={20} />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      data={users}
      columns={columns}
      loading={loading}
      emptyIcon={<Users size={48} />}
      emptyTitle="No hay usuarios"
      emptyDescription="No se encontraron usuarios que coincidan con los criterios de búsqueda."
      loadingText="Cargando usuarios..."
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      maxHeight="60vh"
    />
  );
};

export default UserTable;
