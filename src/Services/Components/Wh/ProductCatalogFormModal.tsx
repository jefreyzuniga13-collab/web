import Button from '@/Services/Components/Common/Button'
import Input from '@/Services/Components/Common/Input'
import { Label } from '@/Services/Components/Common/Label'
import { useProductCatalogFormModal } from '@/Hooks/Wh/useProductCatalogFormModal'
import '@/Styles/Crm/SystemParamForm.css'
import type { ProductCatalogRequest, ProductCatalogResponse } from '@/Interfaces/Wh/ProductCatalogInterfaces'
import TextField from '@mui/material/TextField'
import Select from '@/Services/Components/Common/Select'

interface Props {
    mode: 'create' | 'edit' | 'view'
    isOpen: boolean
    data?: ProductCatalogResponse | null
    onClose: () => void
    onSubmit: (values: ProductCatalogRequest) => void
}

const  VerticalOptions = [
  //{ value: 'test_vertical', label: 'NO ESTABLECIDO' },
  { value: 'commerce', label: 'COMERCIO ELECTRÓNICO' },
//   { value: 'ADVERTISING', label: 'PUBLICIDAD' },
//   { value: 'AUTOMOTIVE', label: 'AUTOMOCIÓN' },
//   { value: 'CONSUMER_PACKAGED_GOODS', label: 'BIENES DE CONSUMO ENVASADOS' },
//   { value: 'ECOMMERCE', label: 'COMERCIO ELECTRÓNICO' },
//   { value: 'EDUCATION', label: 'EDUCACIÓN' },
//   { value: 'ENERGY_AND_UTILITIES', label: 'ENERGÍA Y SERVICIOS PÚBLICOS' },
//   { value: 'ENTERTAINMENT_AND_MEDIA', label: 'ENTRETENIMIENTO Y MEDIOS' },
//   { value: 'FINANCIAL_SERVICES', label: 'SERVICIOS FINANCIEROS' },
//   { value: 'GAMING', label: 'JUEGOS' },
//   { value: 'GOVERNMENT_AND_POLITICS', label: 'GOBIERNO Y POLÍTICA' },
//   { value: 'MARKETING', label: 'MARKETING' },
//   { value: 'ORGANIZATIONS_AND_ASSOCIATIONS', label: 'ORGANIZACIONES Y ASOCIACIONES' },
//   { value: 'PROFESSIONAL_SERVICES', label: 'SERVICIOS PROFESIONALES' },
//   { value: 'RETAIL', label: 'VENTA AL POR MENOR' },
//   { value: 'TECHNOLOGY', label: 'TECNOLOGÍA' },
//   { value: 'TELECOM', label: 'TELECOMUNICACIONES' },
//   { value: 'TRAVEL', label: 'VIAJES' },
//   { value: 'NON_PROFIT', label: 'SIN FINES DE LUCRO' },
//   { value: 'RESTAURANT', label: 'RESTAURANTE' },
//   { value: 'HEALTH', label: 'SALUD' },
//   { value: 'LUXURY', label: 'LUJO' },
//   { value: 'OTHER', label: 'OTROS' },
]

export default function SystemParamModal({
    mode,
    isOpen,
    data,
    onClose,
    onSubmit,
}: Props) {
    const { form, errors, isView, isEdit,  handleChange, handleSelect, handleCheckbox, handleSubmit } =
        useProductCatalogFormModal({ mode, data: data || null, onSubmit })

    if (!isOpen) return null

    return (
        <div className="sp-modal__overlay">
            <div className="sp-modal__container">
                <header className="sp-modal__header">
                    <h2 className="sp-modal__title">
                        {mode === 'create' && 'Crear Catálogo Productos'}
                        {mode === 'edit' && 'Editar Catálogo  Productos'}
                        {mode === 'view' && 'Detalle Catálogo Productos'}
                    </h2>
                    <button type="button" className="sp-modal__close" onClick={onClose}>
                        ×
                    </button>
                </header>

                <form className="sp-modal__body" onSubmit={handleSubmit}>
                    <div className="sp-modal__grid">

                        <div className="sp-modal__col">
                            <Label htmlFor="name" className="sp-modal__label">
                                Nombre *
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={form.name!}
                                onChange={handleChange}
                                disabled={isView || isEdit}
                            />
                            {errors.name && <div className="sp-modal__error">{errors.name}</div>}
                        </div>

                        <div className="sp-modal__col">
                            <Label htmlFor="description" className="sp-modal__label">
                                Description
                            </Label>
                            <Input
                                id="description"
                                name="description"
                                value={form.description!}
                                onChange={handleChange}
                                disabled={isView}
                            />
                            {errors.description && <div className="sp-modal__error">{errors.description}</div>}
                        </div>

                        <div className="cm-modal__col">
                        <Label htmlFor="status">Vertical *</Label>
                        <Select
                            id="status"
                            value={form.vertical!}
                            onChange={e => handleSelect('vertical', e.target.value)}
                            disabled={isView}
                            options={VerticalOptions}
                        />
                        </div>

                         <div className="ws-modal__col">
                            <label className="ws-modal__field--checkbox">
                                <input
                                type="checkbox"
                                name="isActive"
                                checked={form.isActive}
                                onChange={handleCheckbox}
                                disabled={isView}
                                /> Activo
                            </label>
                            </div>

                        {isView && data && (
                            <div className="ws-modal__col ws-modal__col--full ws-modal__timestamps">
                                <TextField
                                    value={new Date(data.createdAt).toLocaleString()}
                                    label="Creado"
                                    disabled
                                    fullWidth
                                />
                                {data.updatedAt && (
                                    <TextField
                                        value={new Date(data.updatedAt).toLocaleString()}
                                        label="Actualizado"
                                        disabled
                                        fullWidth
                                    />
                                )}
                            </div>
                        )}

                         {isView && data?.createdByName && data?.updatedByName && (
                            <div className="ws-modal__col ws-modal__col--full ws-modal__timestamps">
                                <TextField
                                    value={new Date(data.createdByName).toLocaleString()}
                                    label="Creado"
                                    disabled
                                    fullWidth
                                />
                                {data.updatedAt && (
                                    <TextField
                                        value={new Date(data.updatedByName).toLocaleString()}
                                        label="Actualizado"
                                        disabled
                                        fullWidth
                                    />
                                )}
                            </div>
                        )}

                    </div>


                    <footer className="sp-modal__footer">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="sp-modal__btn sp-modal__btn--cancel"
                        >
                            Cancelar
                        </Button>
                        {!isView && (
                            <Button
                                variant="primary"
                                type="submit"
                                className="sp-modal__btn sp-modal__btn--confirm"
                            >
                                {mode === 'create' ? 'Crear' : 'Guardar'}
                            </Button>
                        )}
                    </footer>
                </form>
            </div>
        </div>
    )
}