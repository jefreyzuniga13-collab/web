
import React, { useState, useEffect } from 'react';
import { userService } from '@/Services/UserService';
import type { User, UserHistoryItem } from '@/Interfaces/User/UserInterfaces';
import '@/Styles/Users/UserDetail.css';

interface UserDetailProps {
  user: User;
  onClose: () => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'roles' | 'history'>('info');
  const [historyItems, setHistoryItems] = useState<UserHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadUserHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user.userId]);

  const loadUserHistory = async () => {
    setLoading(true);
    try {
      const history = await userService.getUserHistoryAsync(user.userId);
      setHistoryItems(history);
    } catch (error) {
      console.error('Error loading user history:', error);
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-detail">
      <div className="user-detail-header">
        <div className="user-detail-avatar">
          {user.imageUrl ? (
            <img src={user.imageUrl} alt={user.fullName} />
          ) : (
            <div className="user-detail-avatar-placeholder">
               {user.fullName ? user.fullName.charAt(0).toUpperCase() : ''}
            </div>
          )}
        </div>
        <div className="user-detail-info">
          <h2>{user.fullName}</h2>
          <p>{user.email}</p>
          <div className="user-detail-status">
            <span className={`status-indicator ${user.isActive ? 'active' : 'inactive'}`}></span>
            <span>{user.isActive ? 'Activo' : 'Inactivo'}</span>
          </div>
        </div>
      </div>

      <div className="user-detail-tabs">
        <button
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Información
        </button>
        <button
          className={`tab-button ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles usuario
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historial de actividad
        </button>
      </div>

      <div className="user-detail-content">
        {activeTab === 'info' && (
          <div className="user-detail-info-tab">
            <div className="info-group">
              <h3>Información personal</h3>
              <div className="info-row">
                <strong>Nombre completo:</strong> <span>{user.fullName}</span>
              </div>
              <div className="info-row">
                <strong>Email:</strong> <span>{user.email}</span>
              </div>
              <div className="info-row">
                <strong>Teléfono:</strong> <span>{user.phone || 'No especificado'}</span>
              </div>
              <div className="info-row">
                <strong>Numero Cedula:</strong> <span>{user.identifier || 'No especificado'}</span>
              </div>
            </div>

            <div className="info-group">
              <h3>Información de cuenta</h3>
              <div className="info-row">
                <strong>ID de usuario:</strong> <span>{user.userId}</span>
              </div>
              <div className="info-row">
                <strong>Empresa:</strong> <span>ID: {user.companyId}</span>
              </div>
              <div className="info-row">
                <strong>Tipo de cliente:</strong> <span>{user.clientType || 'No especificado'}</span>
              </div>
              <div className="info-row">
                <strong>Fecha de registro:</strong> <span>{formatDate(user.createdAt)}</span>
              </div>
              <div className="info-row">
                <strong>Última actualización:</strong> <span>{formatDate(user.updatedAt)}</span>
              </div>
              <div className="info-row">
                <strong>Última conexión:</strong>
                <span>{user.lastOnline ? formatDate(user.lastOnline) : 'Nunca'}</span>
              </div>
              <div className="info-row">
                <strong>Estado:</strong>
                <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="info-row">
                <strong>En línea:</strong>
                <span className={`status ${user.isOnline ? 'active' : 'inactive'}`}>
                  {user.isOnline ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="user-detail-roles-tab">
            <h3>Roles asignados</h3>
            <div className="roles-grid">
              {user.roles.map(role => (
                <div key={role.roleId} className="role-card">
                  <h4>{role.roleName}</h4>
                  <p>{role.description || 'Sin descripción'}</p>
                </div>
              ))}
            </div>
            {user.roles.length === 0 && (
              <p className="no-data">El usuario no tiene roles asignados.</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="user-detail-history-tab">
            <h3>Historial de cambios</h3>
            {loading ? (
              <p className="loading">Cargando historial...</p>
            ) : historyItems.length > 0 ? (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Campo</th>
                    <th>Valor anterior</th>
                    <th>Nuevo valor</th>
                    <th>Modificado por</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map(item => (
                    <tr key={item.id}>
                      <td>{formatDate(item.changedAt)}</td>
                      <td>{item.changedField}</td>
                      <td>{item.oldValue}</td>
                      <td>{item.newValue}</td>
                      <td>{item.changedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No hay registros de cambios para este usuario.</p>
            )}
          </div>
        )}
      </div>

      <div className="user-detail-footer">
        <button className="user-detail-close-btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default UserDetail;