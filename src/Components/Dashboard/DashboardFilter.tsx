import { IoMdClose } from "react-icons/io";
// import TimePickerField from "@/Components/Common/TimePickerField";
import useDashboardFilterModal from "@/Hooks/Chart/useDashboardFilterModal";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useUsers } from "@/Hooks/User/useUsers";
import useContact from "@/Hooks/Contact/useContact";
import Select from "@/Components/Common/Select";
import Button from "../Common/Button";
import "@/Styles/Dashboard/DashboardFilterModal.css";
import { CgTrashEmpty } from "react-icons/cg";
import { FaFilter } from "react-icons/fa";
import type { FilterForm } from "@/Interfaces/Dashboard/DashboardInterfaces";
import {parseISO } from 'date-fns'

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
  const { form, handleSelectChange, setForm, handleClear } =
    useDashboardFilterModal();

    const handleApplyMethod = ()=>{
        handleApply(form)
    }

  const { users } = useUsers();
  const { data: contacts } = useContact();

  const agents = users.filter(
    (u) =>
      u.roles.some((r) => r.roleName === "Support")
  );

  const admins = users.filter((u) =>
    u.roles.some((r) => r.roleName === "Admin")
  );

  if (!isFilterOpen) return null;

  return (
    <div className="filter-modal__overlay">
      <header className="filter-modal__container">
       <div className="filter__header">
        <h3 className="filter__header-title">Filtros Gráficos</h3>

        <Button onClick={() => onClosed()} variant="tertiary" className="filter__header-closeBtn">
          <IoMdClose size={14} />
        </Button>
       </div>

        <section className="input-container">
            <Select
              id="agentId"
              name="agentId"
              placeholder="Filtrar por agente"
              options={[
                { label: "Filtrar por agente", value: "" },
                ...agents.map((a) => ({ label: a.fullName, value: a.userId })),
              ]}
              value={form.agentId!}
              onChange={handleSelectChange("agentId")}
              className="filter__select"
            />

            <Select
              id="adminUser"
              name="adminUser"
              placeholder="Filtrar por administrador"
              options={[
                { label: "Filtrar por administrador", value: "" },
                ...admins.map((a) => ({ label: a.fullName, value: a.userId })),
              ]}
              value={form.adminUserId!}
              onChange={handleSelectChange("adminUserId")}
              className="filter__select"
            />

          <Select
            id="customerId"
            name="customerId"
            placeholder="Filtrar por cliente"
            options={[
              { label: "Filtrar por cliente", value: "" },
              ...contacts.map((c) => ({ label: c.fullName!, value: c.id })),
            ]}
            value={form.customerId!}
            onChange={handleSelectChange("customerId")}
            className="filter__select"
          />
          </section>

          <section>
            {/* <p className="filter-subtitle">Filtrar por Hora</p>
            <section className="input-container">
                            <div className="oh-modal__col">
              <TimePickerField
                label="Hora inicio"
                value={form.startTime}
                onChange={(d) => setForm((f) => ({ ...f, startTime: d }))}
              />
            </div>
            <div className="oh-modal__col">
              <TimePickerField
                label="Hora fin"
                value={form.endTime}
                onChange={(d) => setForm((f) => ({ ...f, endTime: d }))}

              />
            </div>
            </section> */}

             <p className="filter-subtitle">Filtrar por Fecha</p>
             <section className="input-container">
                     <div className="oh-modal__col">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Desde"
                  value={ typeof form.from === 'string'
                  ? parseISO(form.from)
                  : form.from}
                  onChange={(d) => setForm((f) => ({ ...f, from: d }))}
                  format="dd/MM/yyyy"
                  sx={{ width: "100%", mb: 2 }}
                />
              </LocalizationProvider>
            </div>
            <div className="oh-modal__col">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Hasta"
                  value={ typeof form.to === 'string'
                    ? parseISO(form.to)
                    : form.to}
                  onChange={(d) => setForm((f) => ({ ...f, to: d }))}
                  format="dd/MM/yyyy"
                  sx={{ width: "100%" }}
                />
              </LocalizationProvider>
            </div>
             </section>
           
          </section>

        {/* <p className="filter-subtitle">Filtrar por dia</p>
        <section className="filter-modal__toggles">
          <label className="filter-modal__toggles__label">
            <input
              type="checkbox"
              name="today"
              checked={form.today}
              onChange={handleCheckbox}
            />{" "}
            Hoy
          </label>

          <label>
            <input
              type="checkbox"
              name="yesterday"
              checked={form.yesterday}
              onChange={handleCheckbox}
            />{" "}
            Ayer
          </label>

          <label>
            <input
              type="checkbox"
              name="tomorrow"
              checked={form.tomorrow}
              onChange={handleCheckbox}
            />{" "}
            Mañana
          </label>
        </section> */}

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