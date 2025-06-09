import React from 'react';
import { Eye, Edit, Check, X, CirclePower, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import type { User } from '@/Interfaces/User/UserInterfaces';
import '@/Styles/Users/UserTable.css'
interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (userId: number) => void;
  loading: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete, onView, loading }) => {
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

  if (loading) {
    return (
      <div className="user-table__loading">
        <div className="user-table__spinner"></div>
        <span>Cargando usuarios...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="user-table__empty">
        <div className="user-table__empty-icon">
          <Users size={48} />
        </div>
        <h3 className="user-table__empty-title">No hay usuarios</h3>
        <p className="user-table__empty-description">No se encontraron usuarios que coincidan con los criterios de búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="user-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="user-table__header-cell">Foto</TableHead>
            <TableHead className="user-table__header-cell">Nombre</TableHead>
            <TableHead className="user-table__header-cell">Email</TableHead>
            <TableHead className="user-table__header-cell">Roles</TableHead>
            <TableHead className="user-table__header-cell">Estado</TableHead>
            <TableHead className="user-table__header-cell">Última actividad</TableHead>
            <TableHead className="user-table__header-cell">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.userId} className="user-table__row">
              <TableCell className="user-table__cell">
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
              </TableCell>
              <TableCell className="user-table__cell">
                <div className="user-table__user-info">
                  <span className="user-table__user-name">{user.fullName}</span>
                  {/* <span className="user-table__user-id">ID: {user.userId}</span> */}
                </div>
              </TableCell>
              <TableCell className="user-table__cell">{user.email}</TableCell>
              <TableCell className="user-table__cell">
                <div className="user-table__roles">
                  {user.roles.map((role) => (
                    <span key={role.roleId} className="user-table__role-badge">
                      {role.roleName}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="user-table__cell">
                <div className={`user-table__status ${user.isActive ? 'user-table__status--active' : 'user-table__status--inactive'}`}>
                  <div className="user-table__status-icon">
                    {user.isActive ? <Check size={16} /> : <X size={16} />}
                  </div>
                  <span className="user-table__status-text">
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="user-table__cell">
                <div className="user-table__last-activity">
                  <span className="user-table__date">
                    {user.lastOnline ? formatDate(user.lastOnline) : 'Nunca'}
                  </span>
                  {user.isOnline && (
                    <span className="user-table__online-indicator">En línea</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="user-table__cell">
                <div className="user-table__actions">
                  <button 
                    className="user-table__action-btn user-table__action-btn--view"
                    onClick={() => onView(user.userId)}
                    title="Ver detalles"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    className="user-table__action-btn user-table__action-btn--edit"
                    onClick={() => onEdit(user)}
                    title="Editar usuario"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="user-table__action-btn user-table__action-btn--delete"
                    onClick={() => onDelete(user)}
                    title={user.isActive ? "Desactivar usuario" : "Activar usuario"}
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

export default UserTable;