import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import Button from "@/Components/Common/Button";
import Input from "@/Components/Common/Input";
import DatePickerField from "@/Components/Common/DatePickerField";
import { useVerifyNewContact } from "@/Hooks/Setting/useVerifyNewContact";
import { useCompany } from "@/Hooks/Company/useCompany";
import type { CompanyInterface } from "@/Interfaces/Company/CompanyInterface";
import "@/Styles/Setting/VerifyNewContact.css";
// import Autocomplete from "@mui/material/Autocomplete";
// import TextField from "@mui/material/TextField";

const VerifyNewContactPage: React.FC = () => {
  const { phoneNumber } = useParams<{ phoneNumber: string }>();
  const {
    form,
    errors,
    loading: verifying,
    handleChangeText,
    handleCheckbox,
    //handleSelectUser,
    handleSelectChange,
    handleSubmit,
    handleBack,
  } = useVerifyNewContact(phoneNumber!);
  const { companies, loading: companiesLoading } = useCompany();

  const companiesList = companies ?? [];
  
  const selectedCompany = useMemo<CompanyInterface | undefined>(
    () => companiesList.find((c) => c.companyId === form.companyId),
    [companiesList, form.companyId]
  );

  return (
    <div className="verifyContact__general-container">
      <div className="verifyContact-container">
        <header className="verifyContact-header">
          <h1 className="verifyContact-title">Verificar usuario</h1>
          <h3 className="verifyContact-subtitle">
            Nuevo contacto creado, verificar los datos y validar su confiabilidad.
          </h3>
        </header>

        <form
          className="verifyContact-body"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="verifyContact-grid">
            <div className="verifyContact-grid-col">
              <label htmlFor="fullName">Nombre Completo</label>
              <Input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChangeText}
              />
              {errors.fullName && (
                <div className="verifyContact-error">{errors.fullName}</div>
              )}
            </div>

            <div className="verifyContact-grid-col">
              <label htmlFor="idCard">Cédula</label>
              <Input
                id="idCard"
                name="idCard"
                value={form.idCard}
                onChange={handleChangeText}
              />
              {errors.idCard && (
                <div className="verifyContact-error">{errors.idCard}</div>
              )}
            </div>

            <div className="verifyContact-grid-col">
              <label htmlFor="idCard">Nombre compañía indica por el contacto</label>
              <Input
                id="companyName"
                name="companyName"
                value={form.companyName}
                onChange={handleChangeText}
                disabled
              />
            </div>
 
            <div className="verifyContact-grid-col">
              <label htmlFor="companyId">Seleccione una compañía</label>
              <select
                id="companyId"
                name="companyId"
                className="verifyContact__select"
                value={form.companyId != null ? String(form.companyId) : ""}
                onChange={handleSelectChange}
                disabled={companiesLoading}
              >
                <option value="" disabled>
                  -- Elige una compañía --
                </option>
                {companiesList.map((c) => (
                  <option key={c.companyId} value={c.companyId?.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.companyId && (
                <div className="verifyContact-error">{errors.companyId}</div>
              )}
            </div> 

            {/* <div className="verifyContact-grid-col">
                  <label htmlFor="companyId">Seleccione una compañía</label>
                          <Autocomplete
                            options={companiesList}
                             className="verifyContact__select"
                            getOptionLabel={h => h.name}
                            value={companiesList.find(h => h.companyId === form.companyId) || null}
                            onChange={(_, h) => handleSelectUser(h?.companyId || 0)}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label="Horario"
                                size="small"
                                error={!!errors.companyId}
                                helperText={errors.companyId}
                                className="verifyContact__select-text"
                              />
                            )}
                          />
                        </div> */}

            <div className="verifyContact-grid-col">
              <label htmlFor="waName">Nombre de WhatsApp</label>
              <Input
                id="waName"
                name="waName"
                value={form.waName}
                disabled
              />
            </div>

            <div className="verifyContact-grid-col">
              <label htmlFor="waId">Código de WhatsApp</label>
              <Input
                id="waId"
                name="waId"
                value={form.waId ?? ""}
                disabled
              />
            </div>

            <div className="verifyContact-grid-col">
              <label htmlFor="phone">Teléfono</label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                disabled
              />
              {errors.phone && (
                <div className="verifyContact-error">{errors.phone}</div>
              )}
            </div>

            <div className="verifyContact-grid-col">
              <label htmlFor="status">Estado</label>
              <Input
                id="status"
                name="status"
                value={form.status ?? ""}
                disabled
              />
            </div>

            <div className="verifyContact-grid-col">
              <label htmlFor="createdAt">Creado En</label>
              <DatePickerField
                value={form.createdAt ? new Date(form.createdAt) : null}
                onChange={() => {}}
                disabled
                label="Creado"
              />
            </div>

            <div className="verifyContact-grid-col">
              <label htmlFor="updatedAt">Actualizado En</label>
              <DatePickerField
                value={form.updatedAt ? new Date(form.updatedAt) : null}
                onChange={() => {}}
                disabled
                label="Actualizado"
              />
            </div>

            <div className="verifyContact-grid-col-ck">
              <label className="verifyContact-checkbox-p">
                <input
                  type="checkbox"
                  name="isVerified"
                  checked={form.isVerified}
                  onChange={handleCheckbox}
                  disabled
                />
                ¿Está verificado?
              </label>
            </div>
          </div>

          <footer className="verifyContact-footer">
            <Button
              variant="secondary"
              onClick={handleBack}
              className="verifyContact-btn"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={verifying}
              className="verifyContact-btn"
            >
              {verifying ? "Guardando..." : "Verificar"}
            </Button>
          </footer>
        </form>
      </div>

      <div className="verifyContact-companies">
        <p>Detalles de la compañía</p>
        {companiesLoading ? (
          <p className="verifyContact-loading">Cargando detalles...</p>
        ) : selectedCompany ? (
          <div className="oh-modal__col">
            <div className="verifyContact-grid-col">
              <p>Nombre</p>
              <Input value={selectedCompany.name} disabled />
            </div>
            <div className="verifyContact-grid-col">
              <p>Dirección</p>
              <Input value={selectedCompany.address} disabled />
            </div>
            <div className="verifyContact-grid-col">
              <p>Creado En</p>
              <DatePickerField
                value={
                  selectedCompany.createdAt
                    ? new Date(selectedCompany.createdAt)
                    : null
                }
                onChange={() => {}}
                disabled
                label="Creado"
              />
            </div>
          </div>
        ) : (
          <p className="verifyContact-loading">
            No se ha seleccionado compañía.
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyNewContactPage;