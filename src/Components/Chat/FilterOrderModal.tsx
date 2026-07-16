import Button from "@/Components/Common/Button";
import CustomAutocomplete from "@/Components/Common/CustomAutocomplete";
import {DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { toast } from "react-toastify";
import { IoClose } from "react-icons/io5";
import "@/Styles/Chat/FilterOrderModal.css";

interface FormInterface {
  validFrom: Date | null;
  validTo: Date | null;
  agentId: number;
}

type DateField = "validFrom" | "validTo";

type HandleDate = (field: DateField, date: Date | null) => void;

type FilterOption = {
  label: string;
  value: string;
  content: string;
};

type AutocompleteOption = {
  label: string;
  value: string;
};

interface FilterOrderModalProps {
  currentOrder: string[];
  options: FilterOption[];
  onSave: (newOrder: string[]) => void;
  onClose: () => void;

  form: FormInterface;
  handleDate: HandleDate;
  handleAgentChange: (agentId: number) => void;

  applyDateFilter: () => void;
  clearFilter: () => void;
  sortedOptions: FilterOption[];
  handleOptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filter: string;

  agentOptions: AutocompleteOption[];
  loadingAgents: boolean;
}

const ALL_AGENTS_OPTION: AutocompleteOption = {
  label: "Todos los agentes",
  value: "0",
};

const FilterOrderModal: React.FC<FilterOrderModalProps> = ({
  onClose,
  form,
  handleDate,
  handleAgentChange,
  applyDateFilter,
  clearFilter,
  sortedOptions,
  handleOptionChange,
  filter,
  agentOptions,
  loadingAgents,
}) => {
  const optionsWithAllAgents = [ALL_AGENTS_OPTION, ...agentOptions];

  const selectedAgent =
    optionsWithAllAgents.find(
      (option) => Number(option.value) === Number(form.agentId)
    ) ?? ALL_AGENTS_OPTION;

  const handleSave = () => {
    // Evita rango incompleto.
    if (form.validTo !== null && form.validFrom === null) {
      toast.warn(
        "Para seleccionar una fecha final, seleccione una fecha de inicio."
      );
      return;
    }

    // Evita rango inválido.
    if (
      form.validFrom !== null &&
      form.validTo !== null &&
      form.validFrom > form.validTo
    ) {
      toast.warn("La fecha inicial no puede ser mayor que la fecha final.");
      return;
    }

    applyDateFilter();
    onClose();
  };

  const handleClearFilter = () => {
    clearFilter();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="filter-modal">
        <button
          type="button"
          className="filter-modal__close"
          onClick={onClose}
          aria-label="Cerrar filtro"
          title="Cerrar"
        >
          <IoClose size={22} />
        </button>

        <div className="filter-modal__header">
          <h3 className="filter-modal__title">Filtrar conversaciones</h3>
          <p className="filter-modal__subtitle">
            Filtros aplicados a las conversaciones
          </p>
        </div>

        <section className="filter-modal__section">
          <span className="filter-modal__label">Estado de conversación</span>

          <div className="filter-modal__status-list">
            {sortedOptions.map((opt) => {
              const checked = filter === opt.value;

              return (
                <label
                  key={opt.value}
                  className={`filter-modal__status ${
                    checked ? "filter-modal__status--active" : ""
                  }`}
                >
                  <input
                    id={opt.value}
                    type="radio"
                    name="filters"
                    value={opt.value}
                    checked={checked}
                    onChange={handleOptionChange}
                    className="filter-modal__status-input"
                  />

                  {opt.content}
                </label>
              );
            })}
          </div>
        </section>

        <section className="filter-modal__section">
          <span className="filter-modal__label">Filtrar por agente</span>

          <CustomAutocomplete
            placeholder={
              loadingAgents
                ? "Cargando agentes..."
                : optionsWithAllAgents.length > 1
                  ? "Seleccione agente"
                  : "No hay agentes disponibles"
            }
            options={optionsWithAllAgents}
            value={selectedAgent}
            onChange={(agent) => {
              handleAgentChange(agent ? Number(agent.value) : 0);
            }}
            disabled={loadingAgents}
            loading={loadingAgents}
          />
        </section>

        <section className="filter-modal__section">
          <span className="filter-modal__label">Rango de fechas</span>

            {/*Aplicar filtro de fecha y hora
            debe aplicar a signal  */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div className="filter-modal__dates">
              <DateTimePicker
                label="Desde"
                value={form.validFrom}
                onChange={(date) => handleDate("validFrom", date)}
                format="dd/MM/yyyy"
                {...(form.validTo !== null ? { maxDate: form.validTo } : {})}
                slotProps={{
                  textField: {
                    className: "filter-modal__date-field",
                    fullWidth: true,
                    size: "medium",
                  },
                }}
              />

              <DateTimePicker
                label="Hasta"
                value={form.validTo}
                onChange={(date) => handleDate("validTo", date)}
                format="dd/MM/yyyy"
                {...(form.validFrom !== null
                  ? { minDate: form.validFrom }
                  : {})}
                slotProps={{
                  textField: {
                    className: "filter-modal__date-field",
                    fullWidth: true,
                    size: "medium",
                  },
                }}
              />
            </div>
          </LocalizationProvider>
        </section>

        <div className="filter-modal__actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button variant="destructive" onClick={handleClearFilter}>
            Limpiar
          </Button>

          <Button variant="primary" onClick={handleSave}>
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterOrderModal;