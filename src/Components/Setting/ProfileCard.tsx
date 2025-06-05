
import React, { useState } from 'react';
import { useUsers } from '@/Hooks/useUsers';
import type { User } from '@/Interfaces/User/UserInterfaces';
import '@/Styles/Setting/ProfileCard.css';

const ProfileCard: React.FC = () => {
  const { currentUser, loading } = useUsers();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});

  // Datos de ejemplo para mostrar el diseño
  const mockUser: User = {
    userId: 1,
    fullName: "Alisa Mercedez López Cárdenas",
    email: "alisa.lopez@pcgroup.com",
    phone: "+58 414-123-4567",
    identifier: "V-12345678",
    isActive: true,
    companyId: 1,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-06-05T14:20:00Z",
    imageUrl: "/lovable-uploads/ccfb97d1-9ce5-460f-b647-ce43c2ebbca5.png",
    clientType: "Premium",
    lastOnline: "2024-06-05T16:45:00Z",
    isOnline: true,
    roles: [
      { roleId: 1, roleName: "Administrador", description: "Acceso completo al sistema" },
      { roleId: 2, roleName: "Editor", description: "Puede editar contenido" }
    ]
  };

  const user = currentUser || mockUser;

  const handleEdit = () => {
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      identifier: user.identifier
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    // Aquí implementarías la lógica para guardar
    console.log('Guardando datos:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="profile-card profile-card--loading">
        <div className="profile-card__loader">
          <div className="profile-card__spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      {/* Header con imagen y status */}
      <div className="profile-card__header">
        <div className="profile-card__avatar-section">
          <div className="profile-card__avatar-container">
            <img 
              src={user.imageUrl || '/placeholder-avatar.png'} 
              alt={user.fullName}
              className="profile-card__avatar"
            />
            <div className={`profile-card__status ${user.isOnline ? 'profile-card__status--online' : 'profile-card__status--offline'}`}>
              <span className="profile-card__status-dot"></span>
              <span className="profile-card__status-text">
                {user.isOnline ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>
          <button className="profile-card__change-photo">
            <svg className="profile-card__camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            Cambiar foto
          </button>
        </div>

        <div className="profile-card__header-info">
          <h2 className="profile-card__name">{user.fullName}</h2>
          <div className="profile-card__roles">
            {user.roles.map(role => (
              <span key={role.roleId} className="profile-card__role-badge">
                {role.roleName}
              </span>
            ))}
          </div>
          <div className="profile-card__actions">
            {!isEditing ? (
              <button 
                className="profile-card__edit-btn"
                onClick={handleEdit}
              >
                <svg className="profile-card__edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar perfil
              </button>
            ) : (
              <div className="profile-card__edit-actions">
                <button 
                  className="profile-card__save-btn"
                  onClick={handleSave}
                >
                  Guardar
                </button>
                <button 
                  className="profile-card__cancel-btn"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal en layout horizontal */}
      <div className="profile-card__content">
        <div className="profile-card__main-content">
          {/* Información personal */}
          <div className="profile-card__section">
            <h3 className="profile-card__section-title">Información Personal</h3>
            <div className="profile-card__info-grid">
              <div className="profile-card__field">
                <label className="profile-card__label">Nombre completo</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="profile-card__input"
                    value={formData.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                ) : (
                  <span className="profile-card__value">{user.fullName}</span>
                )}
              </div>

              <div className="profile-card__field">
                <label className="profile-card__label">Correo electrónico</label>
                {isEditing ? (
                  <input
                    type="email"
                    className="profile-card__input"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                ) : (
                  <span className="profile-card__value">{user.email}</span>
                )}
              </div>

              <div className="profile-card__field">
                <label className="profile-card__label">Teléfono</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className="profile-card__input"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                ) : (
                  <span className="profile-card__value">{user.phone || 'No especificado'}</span>
                )}
              </div>

              <div className="profile-card__field">
                <label className="profile-card__label">Identificación</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="profile-card__input"
                    value={formData.identifier || ''}
                    onChange={(e) => handleInputChange('identifier', e.target.value)}
                  />
                ) : (
                  <span className="profile-card__value">{user.identifier || 'No especificado'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Información de cuenta */}
          <div className="profile-card__section">
            <h3 className="profile-card__section-title">Información de Cuenta</h3>
            <div className="profile-card__info-grid">
              <div className="profile-card__field">
                <label className="profile-card__label">Estado de cuenta</label>
                <div className="profile-card__status-badge">
                  <span className={`profile-card__status-indicator ${user.isActive ? 'profile-card__status-indicator--active' : 'profile-card__status-indicator--inactive'}`}></span>
                  {user.isActive ? 'Activa' : 'Inactiva'}
                </div>
              </div>

              <div className="profile-card__field">
                <label className="profile-card__label">Tipo de cliente</label>
                <span className="profile-card__value">{user.clientType || 'Estándar'}</span>
              </div>

              <div className="profile-card__field">
                <label className="profile-card__label">Miembro desde</label>
                <span className="profile-card__value">
                  {new Date(user.createdAt).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              <div className="profile-card__field">
                <label className="profile-card__label">Última actividad</label>
                <span className="profile-card__value">
                  {user.lastOnline ? new Date(user.lastOnline).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'No disponible'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra lateral con configuración de seguridad */}
        <div className="profile-card__sidebar">
          <div className="profile-card__section">
            <h3 className="profile-card__section-title">Seguridad</h3>
            <div className="profile-card__security-actions">
              <button className="profile-card__security-btn">
                <svg className="profile-card__security-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Cambiar contraseña
              </button>
              
              {/* <button className="profile-card__security-btn">
                <svg className="profile-card__security-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"></path>
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                </svg>
                Verificación en dos pasos
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;