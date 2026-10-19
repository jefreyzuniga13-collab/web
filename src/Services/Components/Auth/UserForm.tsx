/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input from '@/Services/Components/Common/Input'
import Button  from '@/Services/Components/Common/Button'
import { Label } from '@/Services/Components/Common/Label'
import FileInput from '@/Services/Components/Common/FileInput'
import MultiSelect from '@/Services/Components/Common/MultiSelect'
import { useRoles } from '@/Hooks/Auth/useRoles'
import type { User } from '@/Interfaces/Auth/UserInterfaces'
import { userService } from '@/Services/auth/UserService'
import { toast } from 'react-toastify'
import '@/Styles/Auth/UserForm.css'

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
    incognitoMode: false,
    codReferenciaPCG: '',
    aplicaDescuento: false
  })


  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)

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
      incognitoMode: initialData.incognitoMode,
      codReferenciaPCG: initialData.codReferenciaPCG ?? '',
      aplicaDescuento: initialData.aplicaDescuento ?? false
    });
  }
}, [initialData]);


  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'El nombre completo es obligatorio'
    if (formData.codReferenciaPCG.trim().length > 3) newErrors.codReferenciaPCG = 'El código de referencia PCG debe tener un máximo de 3 caracteres.'
    if (!formData.email.trim()) newErrors.email = 'El correo electrónico es obligatorio'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Formato de correo inválido'
    if (!isEditing && !formData.password) newErrors.password = 'La contraseña es obligatoria'
    else if (formData.password && formData.password.length < 8)
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
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
    payload.append('incognitoMode', String(formData.incognitoMode))
    payload.append('codReferenciaPCG', String(formData.codReferenciaPCG))
    payload.append('aplicaDescuento', String(formData.aplicaDescuento))
    formData.roleIds.forEach(id => payload.append('roleIds', String(id)))
    if (selectedFile) payload.append('imageFile', selectedFile)
    onSubmit(payload)
  }

   const handleUploadOnlyImage = async () => {
    if (!initialData?.userId) {
      setErrors(prev => ({ ...prev, imageFile: 'No se encontró el ID del usuario.' }))
      return
    }
    if (!selectedFile) {
      setErrors(prev => ({ ...prev, imageFile: 'Seleccione una imagen antes de actualizar.' }))
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, imageFile: 'La imagen no puede superar los 5MB' }))
      return
    }

    try {
      setUploadingImage(true)
      const res = await userService.uploadUserAvatar(initialData.userId, selectedFile)

      const newUrl = res.data.imageUrl ?? res.data.imageUrl ?? ''
      setFormData(prev => ({ ...prev, imageUrl: newUrl }))

      setErrors(prev => ({ ...prev, imageFile: '' }))
      toast?.success?.('Imagen actualizada correctamente')
     onCancel()
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo actualizar la imagen'
      setErrors(prev => ({ ...prev, imageFile: msg }))
      toast?.error?.(msg)
    } finally {
      setUploadingImage(false)
    }
  }

  const roleOptions = roles.map(r => ({ value: r.roleId, label: r.roleName }))

  return (
    <form onSubmit={handleSubmitForm}>
      <div className="user-form__container">
        <div className="user-form__section">
          <h3 className="user-form__section-title">Información Personal</h3>
          <div className="user-form__grid">
            <div className="user-form__field">
              <Label htmlFor="fullName" >Nombre completo *</Label>
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
              <Label htmlFor="fullName" >Código  PCG </Label>
              <Input
                id="codReferenciaPCG"
                name="codReferenciaPCG"
                value={formData.codReferenciaPCG}
                onChange={handleInputChange}
                disabled={isViewing}
                className={errors.codReferenciaPCG ? 'user-form__input--error' : ''}
                placeholder="Ingrese el código  de referencia PCG"
              />
              {errors.codReferenciaPCG && <span className="user-form__error">{errors.codReferenciaPCG}</span>}
            </div>


            <div className="user-form__field">
              <Label htmlFor="email" >Correo electrónico *</Label>
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
              <Label htmlFor="password" >{isEditing ? 'Nueva contraseña' : 'Contraseña *'}</Label>
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
              <Label htmlFor="phone" >Teléfono</Label>
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
              <Label htmlFor="identifier" >Número de cédula</Label>
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
              <Label htmlFor="companyId" >Empresa *</Label>
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
          
          {!isViewing && isEditing && (
          <div style={{ marginTop: 8 }}>
            <Button
              type="button"
              onClick={handleUploadOnlyImage}
              disabled={uploadingImage || !selectedFile}
            >
              {uploadingImage ? 'Actualizando imagen...' : 'Actualizar solo imagen'}
            </Button>
          </div>
        )}
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
                name="aplicaDescuento"
                checked={formData.aplicaDescuento}
                onChange={handleCheckboxChange}
                disabled={isViewing}
              />
              Puede aplicar descuentos (solicita contraseña)
            </label>

            {/* Modo incognito. false, no se envia en en los mensajes al cliente el nombre */}
              <label>
                <input
                  type="checkbox"
                  name="incognitoMode"
                  checked={formData.incognitoMode}
                  onChange={handleCheckboxChange}
                  disabled={isViewing}
                />
                Modo Incognito
              </label>

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
