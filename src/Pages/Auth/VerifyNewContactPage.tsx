import React from 'react'
import { useParams } from 'react-router-dom'
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import DatePickerField from '@/Components/Common/DatePickerField'
import { useVerifyNewContact } from '@/Hooks/Auth/useVerifyNewContact'
import '@/Styles/Auth/VerifyNewContact.css'
// import CustomAutocomplete from '@/Components/Common/CustomAutocomplete'

const VerifyNewContactPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const {
    contact,
    // clientes,
    // detalle,
    form,
    errors,
    loading,
    // filter,
    // handleFilterChange,
    handleChangeText,
    // handleSelectCliente,
    // handleChangeCodigo,
    handleSubmit,
    handleBack,
    // clients,
    // clientsLoading,
    // clientsError,
  } = useVerifyNewContact(id!)

  return (
    <div className="verifyContact__general-container">
      <div className="verifyContact-container">
        <header className="verifyContact-header">
          <h1 className="verifyContact-title">Verificar contato</h1>
          <h3 className="verifyContact-subtitle">
            Nuevo contacto creado, verificar los datos y validar su confiabilidad.
          </h3>
        </header>
        <form
          className="verifyContact-body"
          onSubmit={e => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <div className="verifyContact-grid">
            <div className="verifyContact-grid-col">
              <label htmlFor="fullName">Nombre *</label>
              <Input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChangeText}
                required={true}
              />
              {errors.fullName && (
                <div className="verifyContact-error">{errors.fullName}</div>
              )}
            </div>
            <div className="verifyContact-grid-col">
              <label htmlFor="idType">Tipo de Identificación</label>
              <Input
                id="idType"
                name="idType"
                value={
                  form.idType === 'NationalCard'
                    ? 'Cédula Nacional'
                    : form.idType === 'Passport'
                    ? 'Pasaporte'
                    : 'Cédula de Residencia'
                }
                disabled
              />
            </div>
            
            {form.idType === 'NationalCard' && (
              <div className="verifyContact-grid-col">
                <label htmlFor="idCard">Cédula</label>
                <Input
                  id="idCard"
                  name="idCard"
                  value={form.idCard}
                  onChange={handleChangeText}
                />
                {/* {errors.idCard && (
                  <div className="verifyContact-error">{errors.idCard}</div>
                )} */}
              </div>
            )}
            {form.idType === 'Passport' && (
              <div className="verifyContact-grid-col">
                <label htmlFor="passport">Pasaporte</label>
                <Input
                  id="passport"
                  name="passport"
                  value={form.passport}
                  onChange={handleChangeText}
                />
                {/* {errors.passport && (
                  <div className="verifyContact-error">{errors.passport}</div>
                )} */}
              </div>
            )}
            {form.idType === 'ResidenceCard' && (
              <div className="verifyContact-grid-col">
                <label htmlFor="residenceCard">Residencia</label>
                <Input
                  id="residenceCard"
                  name="residenceCard"
                  value={form.residenceCard}
                  onChange={handleChangeText}
                />
                {/* {errors.residenceCard && (
                  <div className="verifyContact-error">
                    {errors.residenceCard}
                  </div>
                )} */}
              </div>
            )}

            {/* <div className="verifyContact-grid-col">
              <label htmlFor="companyName">Empresa Indicada Conacto</label>
              <Input
                id="companyName"
                name="companyName"
                value={form.companyName}
                disabled
              />
            </div> */}

          {/* <div className="verifyContact-grid-col">
            <label htmlFor="filter">
              Buscar Cliente <span className="filter-span">(Nombre o Razón social)</span>
            </label>
            <Input
              id="filter"
              name="filter"
              value={filter}
              onChange={handleFilterChange}
            />*/}


  {/* <label htmlFor="codcli">Cliente</label>

  <CustomAutocomplete
    label="Cliente"
    placeholder="-- Elige un cliente --"
    options={
      (clients ?? []).map((c) => ({
        label: c.clientName ?? '',
        value: String(c.clientId),
      }))
    }
    
    value={
      (() => {
        const sel = (clients ?? []).find(
          (c) => String(c.clientId) === String(form.codcli || '')
        )
        return sel
          ? { label: sel.clientName ?? '', value: String(sel.clientId) }
          : null
      })()
    }
    onChange={(opt) =>
      handleSelectCliente({
        target: { value: opt?.value ?? '' },
      } as any)
    }
    error={Boolean(errors.codcli)}
    helperText={errors.codcli}
  />
</div> */}

            
            <div className="verifyContact-grid-col">
              <label htmlFor="metaChannelId">Red Social</label>
              <Input id="" name="metaChannelId" value={contact?.metaChannelId == 1 ? "Whatsapp": contact?.metaChannelId == 2 ? "Messenger": "Instagram"} disabled />
            </div>

            <div className="verifyContact-grid-col">
              <label htmlFor="phone">Teléfono</label>
              <Input id="phone" name="phone" value={contact?.phone || ''} disabled />
            </div>
            <div className="verifyContact-grid-col">
              <label htmlFor="status">Estado</label>
              <Input id="status" name="status" value={contact?.status || ''} disabled />
            </div>
            <div className="verifyContact-grid-col">
              <label htmlFor="createdAt">Creado En</label>
              <DatePickerField
                value={contact?.createdAt ? new Date(contact.createdAt) : null}
                onChange={() => {}}
                disabled
                label="Creado"
              />
            </div>
            <div className="verifyContact-grid-col">
              <label htmlFor="updatedAt">Actualizado En</label>
              <DatePickerField
                value={contact?.updatedAt ? new Date(contact.updatedAt) : null}
                onChange={() => {}}
                disabled
                label="Actualizado"
              />
            </div>
          </div>
          <footer className="verifyContact-footer">
            <Button variant="secondary" onClick={handleBack} className="verifyContact-btn">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading} className="verifyContact-btn">
              {loading ? 'Guardando...' : 'Verificar'}
            </Button>
          </footer>
        </form>
      </div>

      
      {/* <div className="verifyContact-companies">
        <p>Detalles del Cliente</p>
        {detalle ? (
          <div className="oh-modal__col">
            <div className="verifyContact-grid-col">
              <p>Teléfono</p>
              <Input value={detalle.telefono} disabled />
            </div>
            <div className="verifyContact-grid-col">
              <p>Dirección</p>
              <Input value={detalle.direccion} disabled />
            </div>
            <div className="verifyContact-grid-col">
              <p>Contrato Final</p>
              <DatePickerField
                value={detalle.finalContrato ? new Date(detalle.finalContrato) : null}
                onChange={() => {}}
                disabled
                label="Contrato"
              />
            </div>
            <div className="verifyContact-grid-col">
              <p>Saldo</p>
              <Input value={detalle.saldoUltimoCorte?.toString() || ''} disabled />
            </div>
          </div>
        ) : (
          <p className="verifyContact-loading">Seleccione un cliente para ver detalles</p>
        )}
      </div>
       */}
    </div>
  )
}

export default VerifyNewContactPage