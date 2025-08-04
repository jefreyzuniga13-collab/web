import React, { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input from '@/Components/Common/Input'
import Button  from '@/Components/Common/Button'
import { Label } from '@/Components/Common/Label'
import FileInput from '@/Components/Common/FileInput'
import MultiSelect from '@/Components/Common/MultiSelect'
import { useRoles } from '@/Hooks/useRoles'
import type { User } from '@/Interfaces/User/UserInterfaces'
import '@/Styles/Users/UserForm.css'

interface UserFormProps {
  initialData?: User
  companies: { companyId: number; name: string }[]
  isEditing?: boolean
  isViewing?: boolean
  onSubmit: (data: FormData) => void
  onCancel: () => void
}

export default function UserForm({
  initialData,
  companies,
  isEditing = false,
  isViewing = false,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const { roles, loading: rolesLoading } = useRoles()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyId: companies[0]?.companyId || 0,
    phone: '',
    identifier: '',
    imageUrl: '',
    isActive: true,
    roleIds: [] as number[],
    sendWelcomeEmail: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
  if (initialData) {
    setFormData({
      fullName: initialData.fullName,
      email: initialData.email,
      password: '',
      companyId: initialData.companyId,
      phone: initialData.phone || '',
      identifier: initialData.identifier || '',
      isActive: initialData.isActive,
      imageUrl: initialData.imageUrl || '',
      roleIds: initialData.roles.map(r => r.roleId),
      sendWelcomeEmail: false,
    });
  }
}, [initialData]);


  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'El nombre completo es obligatorio'
    if (!formData.email.trim()) newErrors.email = 'El correo electrónico es obligatorio'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Formato de correo inválido'
    if (!isEditing && !formData.password) newErrors.password = 'La contraseña es obligatoria'
    else if (formData.password && formData.password.length < 6)
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    // const regex = /^505[587]\d{7}$/;
    // if(!regex.test(formData.phone)) newErrors.phone = 'Formato invalido. (50578345656)'
    if (formData.roleIds.length === 0) newErrors.roleIds = 'Debe seleccionar al menos un rol'
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024)
      newErrors.imageFile = 'La imagen no puede superar los 5MB'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'companyId' ? Number(value) : value,
    }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleRoleChange = (selected: (string | number)[]) => {
    setFormData(prev => ({ ...prev, roleIds: selected.map(v => Number(v)) }))
    if (errors.roleIds) setErrors(prev => ({ ...prev, roleIds: '' }))
  }

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    if (errors.imageFile) setErrors(prev => ({ ...prev, imageFile: '' }))
  }

  const togglePasswordVisibility = () => setShowPassword(prev => !prev)

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload = new FormData()
    payload.append('fullName', formData.fullName)
    payload.append('email', formData.email)
    if (!isEditing) payload.append('password', formData.password)
    payload.append('companyId', String(formData.companyId))
    payload.append('phone', formData.phone)
    payload.append('identifier', formData.identifier)
    payload.append('isActive', String(formData.isActive))
    payload.append('sendWelcomeEmail', String(formData.sendWelcomeEmail))
    formData.roleIds.forEach(id => payload.append('roleIds', String(id)))
    if (selectedFile) payload.append('imageFile', selectedFile)
    onSubmit(payload)
  }

  const roleOptions = roles.map(r => ({ value: r.roleId, label: r.roleName }))

  console.log('Image url de Form Data:', formData.imageUrl)
  return (
    <form onSubmit={handleSubmitForm}>
      <div className="user-form__container">
        <div className="user-form__section">
          <h3 className="user-form__section-title">Información Personal</h3>
          <div className="user-form__grid">
            <div className="user-form__field">
              <Label htmlFor="fullName">Nombre completo *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={isViewing}
                className={errors.fullName ? 'user-form__input--error' : ''}
                placeholder="Ingrese el nombre completo"
              />
              {errors.fullName && <span className="user-form__error">{errors.fullName}</span>}
            </div>
            <div className="user-form__field">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isViewing}
                className={errors.email ? 'user-form__input--error' : ''}
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <span className="user-form__error">{errors.email}</span>}
            </div>
            <div className="user-form__field">
              <Label htmlFor="password">{isEditing ? 'Nueva contraseña' : 'Contraseña *'}</Label>
              <div className="user-form__password-field">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isViewing}
                  className={errors.password ? 'user-form__input--error' : ''}
                  placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Ingrese la contraseña'}
                />
                {!isViewing && (
                  <button type="button" className="user-form__password-toggle" onClick={togglePasswordVisibility}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
              {errors.password && <span className="user-form__error">{errors.password}</span>}
            </div>
            <div className="user-form__field">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isViewing}
                placeholder="+505 1234-5678"
              />
            </div>
            <div className="user-form__field">
              <Label htmlFor="identifier">Número de cédula</Label>
              <Input
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                disabled={isViewing}
                placeholder="123-456789-0001A"
              />
            </div>
            <div className="user-form__field">
              <Label htmlFor="companyId">Empresa *</Label>
              <select
                id="companyId"
                name="companyId"
                value={formData.companyId}
                onChange={handleInputChange}
                disabled={isViewing}
                className="user-form__select"
              >
                <option value="">Seleccione una empresa</option>
                {companies.map(c => (
                  <option key={c.companyId} value={c.companyId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="user-form__section">
          <h3 className="user-form__section-title">Roles y Permisos</h3>
          {rolesLoading ? (
            <div className="user-form__loading">Cargando roles...</div>
          ) : (
            <MultiSelect
              options={roleOptions}
              value={formData.roleIds}
              onChange={handleRoleChange}
              // disabled={isViewing}
              className={errors.roleIds ? 'user-form__multi-select--error' : ''}
              placeholder="Seleccione uno o más roles"
            />
          )}
          {errors.roleIds && <span className="user-form__error">{errors.roleIds}</span>}
        </div>
        <div className="user-form__section">
          <h3 className="user-form__section-title">Imagen de Perfil</h3>
          <FileInput
            onFileSelect={handleFileSelect}
            // disabled={isViewing}
            maxSize={5 * 1024 * 1024}
            accept="image/*"
            currentImage={formData.imageUrl || initialData?.imageUrl || ''}
          />
          {errors.imageFile && <span className="user-form__error">{errors.imageFile}</span>}
        </div>
        <div className="user-form__section">
          {/* <h3 className="user-form__section-title">Configuración</h3> */}
          <div className="user-form__checkboxes">
            {isEditing && (
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  disabled={isViewing}
                />
                Usuario activo
              </label>
            )}
            <label>
              <input
                type="checkbox"
                name="sendWelcomeEmail"
                checked={formData.sendWelcomeEmail}
                onChange={handleCheckboxChange}
                disabled={isViewing}
              />
              Enviar correo de bienvenida
            </label>
          </div>
        </div>
      </div>
      <div className="user-form__actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        {!isViewing && (
          <Button type="submit">
            {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
          </Button>
        )}
      </div>
    </form>
  )
}