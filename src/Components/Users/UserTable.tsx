
import React from 'react';
import { Eye, Edit, Trash, Check, X } from 'lucide-react';
import type { User } from '@/Interfaces/User/UserInterfaces';
import '@/Styles/Users/UserTable.css';

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
    return <div className="user-table-loading">Cargando usuarios...</div>;
  }

  if (users.length === 0) {
    return <div className="user-table-empty">No hay usuarios para mostrar</div>;
  }

  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Email</th>
            {/* <th>Empresa</th> */}
            <th>Roles</th>
            <th>Estado</th>
            <th>Última actividad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.userId}>
              <td className="user-table-avatar">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.fullName} />
                ) : (
                  <div className="user-table-avatar-placeholder">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : ''}
                  </div>
                )}
              </td>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              {/* <td>{user.companyId}</td> */}
              <td>
                <div className="user-table-roles">
                  {user.roles.map((role) => (
                    <span key={role.roleId} className="user-table-role">
                      {role.roleName}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <div className={`user-table-status ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? (
                    <>
                      <Check size={16} />
                      <span>Activo</span>
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      <span>Inactivo</span>
                    </>
                  )}
                </div>
              </td>
              <td>{user.lastOnline ? formatDate(user.lastOnline) : 'Nunca'}</td>
              <td>
                <div className="user-table-actions">
                  <button className="action-btn view" onClick={() => onView(user.userId)}>
                    <Eye size={16} />
                  </button>
                  <button className="action-btn edit" onClick={() => onEdit(user)}>
                    <Edit size={16} />
                  </button>
                  <button className="action-btn delete" onClick={() => onDelete(user)}>
                    <Trash size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;