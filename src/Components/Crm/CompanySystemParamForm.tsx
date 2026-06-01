import { MenuItem, TextField } from '@mui/material'
import Button from '@/Components/Common/Button'
import { Label } from '@/Components/Common/Label'
import { Textarea } from '@/Components/Common/Textarea'
import type { CompanyInterface } from '@/Interfaces/Crm/CompanyInterface'
import type { SystemParamResponseDto } from '@/Interfaces/Auth/AuthInterface'
import type {CompanySystemParamProj, CompanySystemParamRequest} from '@/Interfaces/Crm/CompanySystemParams'
import type { NameTranslation } from '@/Interfaces/Crm/OpeningHour'
import { nameTranslations } from '@/Utils/Translation/nameTranslations'
import { useCompanySystemParamForm } from '@/Hooks/Crm/useCompanySystemParamForm'
import type { MetaChannelOption } from '@/Interfaces/Crm/CompanySystemParams'
import '@/Styles/Crm/CompanySystemParamForm.css'
import { IoMdClose } from 'react-icons/io'
interface CompanySystemParamFormProps {
  mode: 'create' | 'edit' | 'view'
  isOpen: boolean
  data?: CompanySystemParamProj | null
  companies: CompanyInterface[]
  systemParams: SystemParamResponseDto[]
  metaChannels: MetaChannelOption[]
  onClose: () => void
  onSubmit: (values: CompanySystemParamRequest) => void | Promise<void>
}

export default function CompanySystemParamForm({
  mode,
  isOpen,
  data,
  companies,
  systemParams,
  metaChannels,
  onClose,
  onSubmit,
}: CompanySystemParamFormProps) {
  const {
    form,
    errors,
    loading,
    isView,
    handleSelectNumber,
    handleValueChange,
    handleActiveChange,
    handleSubmit,
  } = useCompanySystemParamForm({
    mode,
    data: data || null,
    onSubmit,
  })

  if (!isOpen) return null

  const getTitle = () => {
    if (mode === 'create') return 'Crear Parámetro por Empresa'
    if (mode === 'edit') return 'Editar Parámetro por Empresa'
    return 'Detalle Parámetro por Empresa'
  }

  const getParamName = (name: string) => {
    return nameTranslations[name as NameTranslation] ?? name
  }

  return (
    <div className="company-param-modal__overlay">
      <div className="company-param-modal__container">
        <header className="company-param-modal__header">
          <h2 className="company-param-modal__title">{getTitle()}</h2>

          <button
            type="button"
            className="company-param-modal__close"
            onClick={onClose}
          >
            <IoMdClose />
          </button>
        </header>

        <form className="company-param-modal__body" onSubmit={handleSubmit}>
          <div className="company-param-modal__grid">
            <div className="company-param-modal__col">
              <TextField
                label="Empresa"
                size="small"
                select
                fullWidth
                value={form.companyId || ''}
                disabled={isView || mode === 'edit'}
                onChange={(e) => handleSelectNumber('companyId', e.target.value)}
                error={Boolean(errors.companyId)}
                helperText={errors.companyId}
              >
                <MenuItem value="">Seleccione una empresa</MenuItem>

                {companies.map((company) => (
                  <MenuItem key={company.companyId ?? 0} value={company.companyId ?? 0}>
                    {company.name}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            <div className="company-param-modal__col">
              <TextField
                label="Parámetro"
                size="small"
                select
                fullWidth
                value={form.systemParamId || ''}
                disabled={isView || mode === 'edit'}
                onChange={(e) => handleSelectNumber('systemParamId', e.target.value)}
                error={Boolean(errors.systemParamId)}
                helperText={errors.systemParamId}
              >
                <MenuItem value="">Seleccione un parámetro</MenuItem>

                {systemParams.map((param) => (
                  <MenuItem key={param.id} value={param.id}>
                    {getParamName(param.name)}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            <div className="company-param-modal__col">
              <TextField
                label="Canal"
                size="small"
                select
                fullWidth
                value={form.metaChannelId || ''}
                disabled={isView || mode === 'edit'}
                onChange={(e) => handleSelectNumber('metaChannelId', e.target.value)}
                error={Boolean(errors.metaChannelId)}
                helperText={errors.metaChannelId}
              >
                <MenuItem value="">Seleccione un canal</MenuItem>

                {metaChannels.map((channel) => (
                  <MenuItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            <div className="company-param-modal__col company-param-modal__col--active">
              <Label htmlFor="isActive" className="company-param-modal__label">
                Activo
              </Label>

              <label className="company-param-modal__switch">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  disabled={isView}
                  onChange={(e) => handleActiveChange(e.target.checked)}
                />
                <span />
              </label>
            </div>

            <div className="company-param-modal__col company-param-modal__col--full">
              <Label htmlFor="value" className="company-param-modal__label">
                Valor *
              </Label>

              <Textarea
                id="value"
                name="value"
                rows={7}
                value={form.value}
                disabled={isView}
                onChange={(e) => handleValueChange(e.target.value)}
                className="company-param-modal__textarea"
              />

              {errors.value && (
                <div className="company-param-modal__error">{errors.value}</div>
              )}
            </div>

            {data && (
              <div className="company-param-modal__meta company-param-modal__col--full">
                <div>
                  <strong>Creado por:</strong> {data.createdByName || '---'}
                </div>

                <div>
                  <strong>Actualizado por:</strong> {data.updatedByName || '---'}
                </div>
              </div>
            )}
          </div>

          <footer className="company-param-modal__footer">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="company-param-modal__btn"
            >
              Cancelar
            </Button>

            {!isView && (
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="company-param-modal__btn"
              >
                {loading ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar'}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}