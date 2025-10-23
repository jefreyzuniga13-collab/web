/* eslint-disable @typescript-eslint/no-explicit-any */
import { IoMdClose } from "react-icons/io";
import TimePickerField from "@/Components/Common/TimePickerField";
import useDashboardFilterModal from "@/Hooks/Chart/useDashboardFilterModal";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useUsers } from "@/Hooks/User/useUsers";
import useContact from "@/Hooks/Contact/useContact";
import CustomAutocomplete from "@/Components/Common/CustomAutocomplete";
import Button from "../Common/Button";
import "@/Styles/Dashboard/DashboardFilterModal.css";
import { CgTrashEmpty } from "react-icons/cg";
import { FaFilter } from "react-icons/fa";
import type { FilterForm } from "@/Interfaces/Dashboard/DashboardInterfaces";
import { parseISO, parse } from "date-fns";
import { format } from "date-fns-tz";
import { useEffect } from "react";
import { useInnova } from "@/Hooks/useInnova";

interface Props {
  onClosed: () => void;
  handleApply: (form: FilterForm) => void;
  isFilterOpen: boolean;
}

export default function DashboardFilterModal({
  onClosed,
  isFilterOpen,
  handleApply,
}: Props) {
  const {
    form,
    handleAutoChange,
    setForm,
    handleClear,
    handleTimeChange,
  } = useDashboardFilterModal();

  const handleApplyMethod = () => {
    handleApply(form);
  };

  const { users, getAgents, agents } = useUsers();
  const { data: contacts } = useContact();
  const { data: clients, getAllAsync } = useInnova();

  useEffect(() => {
    getAgents()
    getAllAsync()
  }, [])


  const admins = users.filter((u) =>
    u.roles.some((r) => r.roleName === "Admin")
  );

  if (!isFilterOpen) return null;

  return (
    <div className="filter-modal__overlay">
      <header className="filter-modal__container">
        <div className="filter__header">
          <h3 className="filter__header-title">Filtros Gráficos</h3>
          <Button
            onClick={onClosed}
            variant="tertiary"
            className="filter__header-closeBtn"
          >
            <IoMdClose size={14} />
          </Button>
        </div>

        <section className="input-container">
  {/* Agente */}
  <CustomAutocomplete
    label="Agente"
    placeholder="Filtrar por agente"
    options={[
      { label: 'Filtrar por agente', value: '' },
      ...agents.map(a => ({ label: a.fullName, value: String(a.userId) })),
    ]}
    value={(() => {
      const sel = agents.find(a => String(a.userId) === String(form.agentId));
      return sel ? { label: sel.fullName, value: String(sel.userId) } : null;
    })()}
    onChange={handleAutoChange('agentId', 'agentName')}
  />

  {/* Administrador */}
  <CustomAutocomplete
    label="Administrador"
    placeholder="Filtrar por administrador"
    options={[
      { label: 'Filtrar por administrador', value: '' },
      ...admins.map(a => ({ label: a.fullName, value: String(a.userId) })),
    ]}
    value={(() => {
      const sel = admins.find(a => String(a.userId) === String(form.adminUserId));
      return sel ? { label: sel.fullName, value: String(sel.userId) } : null;
    })()}
    onChange={handleAutoChange('adminUserId', 'adminUserName')}
  />

  {/* Cliente (lo guardas como string) */}
  <CustomAutocomplete
    label="Cliente"
    placeholder="Filtrar por cliente"
    options={[
      { label: 'Filtrar por cliente', value: '' },
      ...clients.map(c => ({ label: c.clientName!, value: String(c.clientId!) })),
    ]}
    value={(() => {
      const sel = clients.find(c => String(c.clientId) === String(form.clientId));
      return sel ? { label: sel.clientName!, value: String(sel.clientId!) } : null;
    })()}
    onChange={handleAutoChange('clientId', 'clientName')}
  />

  {/* Contacto (ajusta si quieres string o number) */}
  <CustomAutocomplete
    label="Contacto"
    placeholder="Filtrar por contacto"
    options={[
      { label: 'Filtrar por contacto', value: '' },
      ...contacts.map(c => ({ label: c.fullName!, value: String(c.id) })),
    ]}
    value={(() => {
      const sel = contacts.find(c => String(c.id) === String(form.contactId));
      return sel ? { label: sel.fullName!, value: String(sel.id) } : null;
    })()}
    onChange={handleAutoChange('contactId', 'contactName')}
  />
</section>



        <p className="filter-subtitle">Filtrar por Fecha</p>
        <section className="input-container">
          <div className="oh-modal__col">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Desde"
                value={
                  typeof form.from === "string"
                    ? parseISO(form.from)
                    : form.from
                }
                onChange={(d) =>
                  setForm((f) => ({ ...f, from: d ? format(d, "yyyy-MM-dd") : "" }))
                }
                format="dd/MM/yyyy"
                sx={{ width: "100%", mb: 2 }}
              />
            </LocalizationProvider>
          </div>
          <div className="oh-modal__col">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Hasta"
                value={
                  typeof form.to === "string" ? parseISO(form.to) : form.to
                }
                onChange={(d) =>
                  setForm((f) => ({ ...f, to: d ? format(d, "yyyy-MM-dd") : "" }))
                }
                format="dd/MM/yyyy"
                sx={{ width: "100%" }}
              />
            </LocalizationProvider>
          </div>
        </section>

        <p className="filter-subtitle">Filtrar por Hora</p>
        <section className="input-container">
          <div className="oh-modal__col">
            <TimePickerField
              label="Hora inicio"
              value={
                form.startTime
                  ? parse(form.startTime as unknown as string, "HH:mm:ss", new Date())
                  : null
              }
              onChange={handleTimeChange("startTime")}
            />
          </div>
          <div className="oh-modal__col">
            <TimePickerField
              label="Hora fin"
              value={
                form.endTime
                  ? parse(form.endTime as unknown as string, "HH:mm:ss", new Date())
                  : null
              }
              onChange={handleTimeChange("endTime")}
            />
          </div>
        </section>

        <div className="filter-btn">
          <Button onClick={handleClear} variant="destructive">
            <CgTrashEmpty size={14} /> Limpiar
          </Button>
          <Button onClick={handleApplyMethod}>
            <FaFilter size={14} /> Aplicar
          </Button>
        </div>
      </header>
    </div>
  );
}