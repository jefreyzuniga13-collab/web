import React, { useState, useEffect, type FormEvent } from "react"
import Button from "@/Components/Common/Button"
import DatePickerField from "@/Components/Common/DatePickerField"
import { Autocomplete, TextField } from "@mui/material"
import { useOpeningHour } from "@/Hooks/Setting/useOpeningHour"
import { userService } from "@/Services/User/UserService"
import type { WorkShiftInterface, WorkShiftFormValues } from "@/Interfaces/Setting/WorkShiftInterface"
import "@/Styles/Setting/WorkShiftModal.css"

interface WorkShiftModalProps {
  mode: "create" | "update" | "view"
  isOpen: boolean
  data?: WorkShiftInterface | null
  onClose: () => void
  onSubmit: (values: WorkShiftFormValues) => void
}

export default function WorkShiftModal({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: WorkShiftModalProps) {
  const { openingHours } = useOpeningHour()
  const isView = mode === "view"
  const [form, setForm] = useState<WorkShiftFormValues>({
    openingHourId: data?.openingHourId ?? 0,
    assignedUserId: data?.assignedUserId ?? 0,
    validFrom: data?.validFrom ? new Date(data.validFrom) : null,
    validTo: data?.validTo ? new Date(data.validTo) : null,
    isActive: data?.isActive ?? true,
  })
  const [agents, setAgents] = useState<{ userId: number; fullName: string }[]>([])

  useEffect(() => {
    if (isOpen) {
      userService.getAgentsByRoleAsync("support").then(u =>
        setAgents(u.map(x => ({ userId: x.userId, fullName: x.fullName })))
      )
    }
  }, [isOpen])

  useEffect(() => {
    if ((mode === "update" || isView) && data) {
      setForm({
        openingHourId: data.openingHourId,
        assignedUserId: data.assignedUserId,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validTo: data.validTo ? new Date(data.validTo) : null,
        isActive: data.isActive,
      })
    } else if (mode === "create") {
      setForm(f => ({ ...f, isActive: true }))
    }
  }, [mode, data, isView])

  const handleDate = (field: "validFrom" | "validTo", d: Date | null) =>
    setForm(f => ({ ...f, [field]: d }))

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, isActive: e.target.checked }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  if (!isOpen) return null

  return (
    <div className="ws-modal__overlay">
      <div className="ws-modal__container">
        <header className="ws-modal__header">
          <h2 className="ws-modal__title">
            {mode === "create" && "Crear Turno"}
            {mode === "update" && "Editar Turno"}
            {mode === "view" && "Detalle Turno"}
          </h2>
          <button type="button" className="ws-modal__close" onClick={onClose}>×</button>
        </header>
        <form className="ws-modal__body" onSubmit={handleSubmit}>
          <div className="ws-modal__grid">
            <div className="ws-modal__col">
              <Autocomplete
                options={openingHours}
                getOptionLabel={h => h.name}
                value={openingHours.find(h => h.id === form.openingHourId) ?? null}
                onChange={(_, h) => setForm(f => ({ ...f, openingHourId: h?.id ?? 0 }))}
                disabled={isView}
                renderInput={params => <TextField {...params} label="Horario" size="small" />}
              />
            </div>
            <div className="ws-modal__col">
              <Autocomplete
                options={agents}
                getOptionLabel={a => a.fullName}
                value={agents.find(a => a.userId === form.assignedUserId) ?? null}
                onChange={(_, a) => setForm(f => ({ ...f, assignedUserId: a?.userId ?? 0 }))}
                disabled={isView}
                renderInput={params => <TextField {...params} label="Usuario asignado" size="small" />}
              />
            </div>
            <div className="ws-modal__col">
              <DatePickerField
                label="Vigencia desde"
                value={ form.validFrom as Date | null }
                onChange={d => handleDate("validFrom", d)}
                disabled={isView}
              />
            </div>
            <div className="ws-modal__col">
              <DatePickerField
                label="Vigencia hasta"
                value={ form.validFrom as Date | null }
                onChange={d => handleDate("validTo", d)}
                disabled={isView}
              />
            </div>
            <div className="ws-modal__col ws-modal__col--full ws-modal__field--checkbox">
              <label>
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
                <DatePickerField label="Creado" value={new Date(data.createdAt)} onChange={() => {}} disabled />
                {data.updatedAt && <DatePickerField label="Actualizado" value={new Date(data.updatedAt)} onChange={() => {}} disabled />}
              </div>
            )}
          </div>

          <footer className="ws-modal__footer">
          <Button variant="secondary" onClick={onClose} className="ws-modal__btn ws-modal__btn--cancel">
            Cancelar
          </Button>
          {!isView && (
            <Button variant="primary" type="submit" className="ws-modal__btn ws-modal__btn--confirm">
              {mode === "create" ? "Crear" : "Guardar"}
            </Button>
          )}
        </footer>
        </form>
      </div>
    </div>
  )
}
