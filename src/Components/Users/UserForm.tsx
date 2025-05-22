import React, { useState, useEffect } from 'react';
import Input from '@/Components/Common/Input';
import Select from '@/Components/Common/Select';
import Button from '@/Components/Common/Button';
import { Eye, EyeOff } from 'lucide-react';
import '@/Styles/Users/UserForm.css';
import type { RoleResponseDto } from '@/Interfaces/Auth/AuthInterface';

interface UserFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  roles: RoleResponseDto[];
  companies: { id: number; name: string }[];
  isEditing?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  roles,
  // companies,
  isEditing = false,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyId: '',
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
        companyId: initialData.companyId?.toString() || '',
        phone: initialData.phone || '',
        identifier: initialData.identifier || '',
        imageUrl: initialData.imageUrl || '',
        isActive: initialData.isActive ?? true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        roleIds: initialData.roles?.map((r: any) => r.roleId) || [],
        sendWelcomeEmail: false,
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName) newErrors.fullName = 'El nombre es obligatorio';
    if (!formData.email) newErrors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';

    if (!isEditing && !formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.companyId) newErrors.companyId = 'La empresa es obligatoria';
    if (formData.roleIds.length === 0) newErrors.roleIds = 'Debe seleccionar al menos un rol';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => parseInt(opt.value));
    setFormData((prev) => ({ ...prev, roleIds: selected }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      const submitData = {
        ...formData,
        companyId: parseInt(formData.companyId),
      };

      if (isEditing && !submitData.password) {
        const dataToSubmit = { ...submitData };
        //delete dataToSubmit.password;
        onSubmit(dataToSubmit);
      } else {
        onSubmit(submitData);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  console.log("Estos son los roles que se pueden ver desde el UserForm", roles);

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-column">
          <div className="form-group">
            <label htmlFor="fullName">Nombre completo *</label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              placeholder="Nombre completo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="email@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{isEditing ? 'Nueva contraseña' : 'Contraseña *'}</label>
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder={isEditing ? 'Dejar en blanco para no cambiar' : 'Contraseña'}
              rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              onIconClick={togglePasswordVisibility}
            />
          </div>

          {/* <div className="form-group">
            <label htmlFor="companyId">Empresa *</label>
            <Select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              error={errors.companyId}
              placeholder="Seleccione una empresa"
              options={companies.map((c) => ({ label: c.name, value: c.id.toString() }))}
            />
          </div> */}
        </div>

        <div className="form-column">
          <div className="form-group">
            <label htmlFor="phone">Teléfono</label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+505 56523269"
            />
          </div>

          <div className="form-group">
            <label htmlFor="identifier">Número de Cédula</label>
            <Input
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Identificador o documento"
            />
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl">URL de imagen de perfil</label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="roles">Roles *</label>
            <Select
              id="roles"
              name="roles"
              multiple
              value={formData.roleIds.map(String)}
              onChange={handleRoleChange}
              error={errors.roleIds}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              options={(roles.items || []).map((role: { roleName: any; roleId: { toString: () => any; }; }) => ({
                  label: role.roleName,
                  value: role.roleId.toString(),
                }))}
              className="multi-select"
              placeholder="Seleccione uno o más roles"
            />
            {errors.roleIds && <span className="error-message">{errors.roleIds}</span>}
            <small className="help-text">
              Mantén presionada la tecla Ctrl (Cmd en Mac) para seleccionar múltiples roles
            </small>
          </div>
        </div>
      </div>

      <div className="form-checkboxes">
        {isEditing && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleCheckboxChange}
            />
            Usuario activo
          </label>
        )}
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="sendWelcomeEmail"
            checked={formData.sendWelcomeEmail}
            onChange={handleCheckboxChange}
          />
          Enviar email de bienvenida
        </label>
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary">
          {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
        </Button>
        <Button type="button" variant="tertiary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default UserForm;