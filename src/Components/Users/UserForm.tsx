import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/CustomButton';
import { Label } from '@/Components/ui/label';
import FileInput from '@/Components/ui/FileInput';
import MultiSelect from '@/Components/ui/MultiSelect';
import { useRoles } from '@/Hooks/useRoles';
import type { User, CreateUserRequest, UpdateUserRequest } from '@/Interfaces/User/UserInterfaces';
import '@/Styles/Users/UserForm.css'

interface UserFormProps {
  initialData?: User;
  companies: { companyId: number; name: string }[];
  isEditing?: boolean;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  companies,
  isEditing = false,
  onSubmit,
  onCancel,
}) => {
  const { roles, loading: rolesLoading } = useRoles();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyId: 1,
    phone: '',
    identifier: '',
    imageUrl: '',
    isActive: true,
    roleIds: [] as number[],
    sendWelcomeEmail: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        password: '',
        companyId: initialData.companyId || 1,
        phone: initialData.phone || '',
        identifier: initialData.identifier || '',
        imageUrl: initialData.imageUrl || '',
        isActive: initialData.isActive ?? true,
        roleIds: initialData.roles?.map(r => r.roleId) || [],
        sendWelcomeEmail: false,
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del correo electrónico no es válido';
    }

    if (!isEditing && !formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.roleIds.length === 0) {
      newErrors.roleIds = 'Debe seleccionar al menos un rol';
    }

    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      newErrors.imageFile = 'La imagen no puede superar los 5MB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  setFormData(prev => ({
    ...prev,
    [name]: 
      name === "companyId" 
        ? Number(value)        // convierte "1" → 1, "" → 0
        : value
  }));

  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: "" }));
  }
};


  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleRoleChange = (selectedRoles: (string | number)[]) => {
    const roleIds = selectedRoles.map(role => Number(role));
    setFormData(prev => ({ ...prev, roleIds }));
    if (errors.roleIds) {
      setErrors(prev => ({ ...prev, roleIds: '' }));
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (errors.imageFile) {
      setErrors(prev => ({ ...prev, imageFile: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    let imageUrl = formData.imageUrl;
    
    if (selectedFile) {
      const formDataForUpload = new FormData();
      formDataForUpload.append('file', selectedFile);
      console.log("La meta data de la imagen es", formDataForUpload);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataForUpload,
        });
        
        if (response.ok) {
          const result = await response.json();
          imageUrl = result.url;
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
          console.log("Meta data imagen 2", formDataForUpload);
    }

    const submitData = {
      ...formData,
      imageUrl,
    };

    if (isEditing && !submitData.password) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (submitData as any).password;
    }

    console.log("Date usuario enviada", submitData)
    onSubmit(submitData);
  };


  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const roleOptions = roles.map(role => ({
    value: role.roleId,
    label: role.roleName
  }));

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div className="user-form__container">
        <div className="user-form__section">
          <h3 className="user-form__section-title">Información Personal</h3>
          
          <div className="user-form__grid">
            <div className="user-form__field">
              <Label htmlFor="fullName" className="user-form__label">
                Nombre completo *
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`user-form__input ${errors.fullName ? 'user-form__input--error' : ''}`}
                placeholder="Ingrese el nombre completo"
              />
              {errors.fullName && (
                <span className="user-form__error">{errors.fullName}</span>
              )}
            </div>

            <div className="user-form__field">
              <Label htmlFor="email" className="user-form__label">
                Correo electrónico *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`user-form__input ${errors.email ? 'user-form__input--error' : ''}`}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && (
                <span className="user-form__error">{errors.email}</span>
              )}
            </div>

            <div className="user-form__field">
              <Label htmlFor="password" className="user-form__label">
                {isEditing ? 'Nueva contraseña' : 'Contraseña *'}
              </Label>
              <div className="user-form__password-field">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`user-form__input ${errors.password ? 'user-form__input--error' : ''}`}
                  placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Ingrese la contraseña'}
                />
                <button
                  type="button"
                  className="user-form__password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="user-form__error">{errors.password}</span>
              )}
            </div>

            <div className="user-form__field">
              <Label htmlFor="phone" className="user-form__label">
                Teléfono
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="user-form__input"
                placeholder="+505 1234-5678"
              />
            </div>

            <div className="user-form__field">
              <Label htmlFor="identifier" className="user-form__label">
                Número de cédula
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                value={formData.identifier}
                onChange={handleInputChange}
                className="user-form__input"
                placeholder="123-456789-0001A"
              />
            </div>

            <div className="user-form__field">
              <Label htmlFor="companyId" className="user-form__label">
                Empresa *
              </Label>
              <select
                id="companyId"
                name="companyId"
                value={formData.companyId}
                onChange={handleInputChange}
                className="user-form__select"
              >
                <option value="">Seleccione una empresa</option>
                {companies.map(company => (
                  <option key={company.companyId} value={company.companyId}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="user-form__section">
          <h3 className="user-form__section-title">Roles y Permisos</h3>
          
          <div className="user-form__field">
            <Label className="user-form__label">
              Roles asignados *
            </Label>
            {rolesLoading ? (
              <div className="user-form__loading">Cargando roles...</div>
            ) : (
              <MultiSelect
                options={roleOptions}
                value={formData.roleIds}
                onChange={handleRoleChange}
                placeholder="Seleccione uno o más roles"
                error={errors.roleIds}
                className="user-form__multi-select"
              />
            )}
            {errors.roleIds && (
              <span className="user-form__error">{errors.roleIds}</span>
            )}
          </div>
        </div>

        <div className="user-form__section">
          <h3 className="user-form__section-title">Imagen de Perfil</h3>
          
          <div className="user-form__field">
            <Label className="user-form__label">
              Foto de perfil
            </Label>
            <FileInput
              onFileSelect={handleFileSelect}
              maxSize={5 * 1024 * 1024}
              accept="image/*"
              error={errors.imageFile}
              currentImage={formData.imageUrl}
              className="user-form__file-input"
            />
            <span className="user-form__help-text">
              Formatos admitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
            </span>
          </div>
        </div>

        <div className="user-form__section">
          <h3 className="user-form__section-title">Configuración</h3>
          
          <div className="user-form__checkboxes">
            {isEditing && (
              <label className="user-form__checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="user-form__checkbox-input"
                />
                <span className="user-form__checkbox-label">Usuario activo</span>
              </label>
            )}
            
            <label className="user-form__checkbox">
              <input
                type="checkbox"
                name="sendWelcomeEmail"
                checked={formData.sendWelcomeEmail}
                onChange={handleCheckboxChange}
                className="user-form__checkbox-input"
              />
              <span className="user-form__checkbox-label">
                Enviar correo de bienvenida
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="user-form__actions">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="user-form__button user-form__button--cancel"
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          className="user-form__button user-form__button--submit"
        >
          {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;