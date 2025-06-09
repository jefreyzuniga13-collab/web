
import React, { useState, useEffect } from 'react';
import { useUsers } from '@/Hooks/User/useUsers';
import { Camera, Edit, Lock } from 'lucide-react';
import type { UpdateUserRequest } from '@/Interfaces/User/UserInterfaces';
import { Label } from '@/Components/ui/label';
import { Input } from '@/Components/ui/input';
import FileInput from '@/Components/ui/FileInput';
import '@/Styles/Setting/ProfileCard.css';
import type { AuthData } from '@/Interfaces/Auth/AuthInterface';
const ProfileCard: React.FC = () => {
  const { currentUser, loading, handleUpdateUser, getUserById } = useUsers();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    fullName: '',
    email: '',
    isActive: true,
    companyId: 1,
    phone: '',
    identifier: '',
    roleIds: []
  });
const authRaw = localStorage.getItem('auth') || '{}'
  const { userId } = JSON.parse(authRaw) as AuthData;

  useEffect(() => {
    if (!currentUser) {
      getUserById(Number(userId));
    }
  }, [currentUser, getUserById]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone || '',
        identifier: currentUser.identifier || '',
        isActive: currentUser.isActive,
        companyId: currentUser.companyId,
        roleIds: currentUser.roles.map(role => role.roleId)
      });
    }
  }, [currentUser]);

  const handleEdit = () => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone || '',
        identifier: currentUser.identifier || '',
        isActive: currentUser.isActive,
        companyId: currentUser.companyId,
        roleIds: currentUser.roles.map(role => role.roleId)
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (currentUser) {
      const updateData = { ...formData };
      if (selectedFile) {
        // manejar la subida de la imagen
      }
      handleUpdateUser(currentUser.userId, updateData);
      setIsEditing(false);
      setSelectedFile(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedFile(null);
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone || '',
        identifier: currentUser.identifier || '',
        isActive: currentUser.isActive,
        companyId: currentUser.companyId,
        roleIds: currentUser.roles.map(role => role.roleId)
      });
    }
  };

  const handleInputChange = (field: keyof UpdateUserRequest, value: string | boolean | number | number[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  if (loading) {
    return (
      <div className="profile-card__loading">
        <div className="profile-card__spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="profile-card__loading">
        <p>No se pudo cargar la información del usuario</p>
      </div>
    );
  }

  return (
    <div className="profile-card">
      <div className="profile-card__header">
        <div className="profile-card__user-section">
          <div className="profile-card__avatar-container">
            <img 
              src={currentUser.imageUrl || '/placeholder-avatar.png'} 
              alt={currentUser.fullName}
              className="profile-card__avatar"
            />
            <div className={`profile-card__status ${currentUser.isOnline ? 'profile-card__status--online' : 'profile-card__status--offline'}`}>
              <span className="profile-card__status-dot"></span>
            </div>
          </div>
          
          <div className="profile-card__user-info">
            <h2 className="profile-card__name">{currentUser.fullName}</h2>
            <p className="profile-card__email">{currentUser.email}</p>
            <div className="profile-card__roles">
              {currentUser.roles.map(role => (
                <span key={role.roleId} className="profile-card__role-badge">
                  {role.roleName}
                </span>
              ))}
            </div>
            <div className="profile-card__online-status">
              <span className="profile-card__online-text">
                {currentUser.isOnline ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-card__header-actions">
          <button className="profile-card__change-photo">
            <Camera size={16} />
            Cambiar foto
          </button>
          
          {!isEditing ? (
            <button 
              className="profile-card__edit-btn"
              onClick={handleEdit}
            >
              <Edit size={16} />
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

      <div className="profile-card__content">
        <div className="profile-card__main-content">
          <div className="profile-card__section">
            <h3 className="profile-card__section-title">Información Personal</h3>
            <div className="profile-card__info-grid">
              <div className="profile-card__field">
                <Label htmlFor="fullName">Nombre completo</Label>
                {isEditing ? (
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                ) : (
                  <span className="profile-card__value">{currentUser.fullName}</span>
                )}
              </div>

              <div className="profile-card__field">
                <Label htmlFor="email">Correo electrónico</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                ) : (
                  <span className="profile-card__value">{currentUser.email}</span>
                )}
              </div>

              <div className="profile-card__field">
                <Label htmlFor="phone">Teléfono</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                ) : (
                  <span className="profile-card__value">{currentUser.phone || 'No especificado'}</span>
                )}
              </div>

              <div className="profile-card__field">
                <Label htmlFor="identifier">Identificación</Label>
                {isEditing ? (
                  <Input
                    id="identifier"
                    type="text"
                    value={formData.identifier || ''}
                    onChange={(e) => handleInputChange('identifier', e.target.value)}
                  />
                ) : (
                  <span className="profile-card__value">{currentUser.identifier || 'No especificado'}</span>
                )}
              </div>

              {isEditing && (
                <div className="profile-card__field profile-card__field--full-width">
                  <Label>Imagen de perfil</Label>
                  <FileInput
                    onFileSelect={handleFileSelect}
                    currentImage={currentUser.imageUrl || undefined}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="profile-card__section">
            <h3 className="profile-card__section-title">Información de Cuenta</h3>
            <div className="profile-card__info-grid">
              <div className="profile-card__field">
                <Label>Estado de cuenta</Label>
                <div className="profile-card__status-badge">
                  <span className={`profile-card__account-indicator ${currentUser.isActive ? 'profile-card__account-indicator--active' : 'profile-card__account-indicator--inactive'}`}></span>
                  {currentUser.isActive ? 'Activa' : 'Inactiva'}
                </div>
              </div>

              {/* <div className="profile-card__field">
                <Label>Tipo de cliente</Label>
                <span className="profile-card__value">{currentUser.clientType || 'Estándar'}</span>
              </div> */}

              <div className="profile-card__field">
                <Label>Miembro desde</Label>
                <span className="profile-card__value">
                  {new Date(currentUser.createdAt).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              <div className="profile-card__field">
                <Label>Última actividad</Label>
                <span className="profile-card__value">
                  {currentUser.lastOnline ? new Date(currentUser.lastOnline).toLocaleDateString('es-ES', {
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

        <div className="profile-card__sidebar">
          <div className="profile-card__section">
            <h3 className="profile-card__section-title">Seguridad</h3>
            <div className="profile-card__security-actions">
              <button className="profile-card__security-btn">
                <Lock size={20} />
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;