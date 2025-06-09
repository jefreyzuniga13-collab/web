
import React, { useState, useEffect } from 'react';
import { userService } from '@/Services/User/UserService';
import type { User, UserHistoryItem } from '@/Interfaces/User/UserInterfaces';
import '@/Styles/Users/UserDetail.css'
import { Button } from '@/Components/ui/CustomButton';

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
      <div className="user-detail__header">
        <div className="user-detail__avatar">
          {user.imageUrl ? (
            <img 
              src={user.imageUrl} 
              alt={user.fullName} 
              className="user-detail__avatar-image"
            />
          ) : (
            <div className="user-detail__avatar-placeholder">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div className={`user-detail__online-status ${user.isOnline ? 'user-detail__online-status--online' : 'user-detail__online-status--offline'}`}></div>
        </div>
        
        <div className="user-detail__info">
          <h2 className="user-detail__name">{user.fullName}</h2>
          <p className="user-detail__email">{user.email}</p>
          <div className="user-detail__status">
            <span className={`user-detail__status-indicator ${user.isActive ? 'user-detail__status-indicator--active' : 'user-detail__status-indicator--inactive'}`}></span>
            <span className="user-detail__status-text">
              {user.isActive ? 'Usuario Activo' : 'Usuario Inactivo'}
            </span>
          </div>
        </div>
      </div>

      <div className="user-detail__tabs">
        <button
          className={`user-detail__tab ${activeTab === 'info' ? 'user-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Información General
        </button>
        <button
          className={`user-detail__tab ${activeTab === 'roles' ? 'user-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles y Permisos
        </button>
        <button
          className={`user-detail__tab ${activeTab === 'history' ? 'user-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historial de Cambios
        </button>
      </div>

      <div className="user-detail__content">
        {activeTab === 'info' && (
          <div className="user-detail__info-tab">
            <div className="user-detail__section">
              <h3 className="user-detail__section-title">Información Personal</h3>
              <div className="user-detail__info-grid">
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">Nombre completo</label>
                  <span className="user-detail__info-value">{user.fullName}</span>
                </div>
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">Correo electrónico</label>
                  <span className="user-detail__info-value">{user.email}</span>
                </div>
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">Teléfono</label>
                  <span className="user-detail__info-value">{user.phone || 'No especificado'}</span>
                </div>
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">Número de Cédula</label>
                  <span className="user-detail__info-value">{user.identifier || 'No especificado'}</span>
                </div>
              </div>
            </div>

            <div className="user-detail__section">
              <h3 className="user-detail__section-title">Información de la Cuenta</h3>
              <div className="user-detail__info-grid">
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">ID de usuario</label>
                  <span className="user-detail__info-value">{user.userId}</span>
                </div>
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">Empresa</label>
                  <span className="user-detail__info-value">ID: {user.companyId}</span>
                </div>
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">Tipo de cliente</label>
                  <span className="user-detail__info-value">{user.clientType || 'Estándar'}</span>
                </div>
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">Fecha de registro</label>
                  <span className="user-detail__info-value">{formatDate(user.createdAt)}</span>
                </div>
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">Última actualización</label>
                  <span className="user-detail__info-value">{formatDate(user.updatedAt)}</span>
                </div>
                <div className="user-detail__info-item">
                  <label className="user-detail__info-label">Última conexión</label>
                  <span className="user-detail__info-value">
                    {user.lastOnline ? formatDate(user.lastOnline) : 'Nunca se ha conectado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="user-detail__roles-tab">
            <div className="user-detail__section">
              <h3 className="user-detail__section-title">Roles Asignados</h3>
              <div className="user-detail__roles-grid">
                {user.roles.map(role => (
                  <div key={role.roleId} className="user-detail__role-card">
                    <div className="user-detail__role-header">
                      <h4 className="user-detail__role-name">{role.roleName}</h4>
                      <span className="user-detail__role-id">ID: {role.roleId}</span>
                    </div>
                    <p className="user-detail__role-description">
                      {role.description || 'Sin descripción disponible'}
                    </p>
                  </div>
                ))}
              </div>
              {user.roles.length === 0 && (
                <div className="user-detail__empty-state">
                  <p className="user-detail__empty-text">El usuario no tiene roles asignados.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="user-detail__history-tab">
            <div className="user-detail__section">
              <h3 className="user-detail__section-title">Historial de Modificaciones</h3>
              {loading ? (
                <div className="user-detail__loading">
                  <div className="user-detail__spinner"></div>
                  <span>Cargando historial...</span>
                </div>
              ) : historyItems.length > 0 ? (
                <div className="user-detail__history-table">
                  <table className="user-detail__table">
                    <thead>
                      <tr>
                        <th className="user-detail__table-header">Fecha</th>
                        <th className="user-detail__table-header">Campo Modificado</th>
                        <th className="user-detail__table-header">Valor Anterior</th>
                        <th className="user-detail__table-header">Nuevo Valor</th>
                        <th className="user-detail__table-header">Modificado Por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyItems.map(item => (
                        <tr key={item.id} className="user-detail__table-row">
                          <td className="user-detail__table-cell">{formatDate(item.changedAt)}</td>
                          <td className="user-detail__table-cell user-detail__table-cell--field">
                            {item.changedField}
                          </td>
                          <td className="user-detail__table-cell user-detail__table-cell--old">
                            {item.oldValue}
                          </td>
                          <td className="user-detail__table-cell user-detail__table-cell--new">
                            {item.newValue}
                          </td>
                          <td className="user-detail__table-cell">{item.changedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="user-detail__empty-state">
                  <p className="user-detail__empty-text">No hay registros de cambios para este usuario.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="user-detail__footer">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="user-detail__close-btn"
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default UserDetail;