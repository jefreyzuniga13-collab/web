import Button from "@/Components/Common/Button";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { toast } from "react-toastify";
import type { Dayjs } from "dayjs";
import { IoClose } from "react-icons/io5";
import '@/Styles/Chat/FilterOrderModal.css'
// import {useCompany} from '@/Hooks/crm/useCompany'

interface FormInterface {
  validFrom: Date | null;
  validTo: Date | null;
}

type HandleDate = (field: keyof FormInterface, d: Date | null) => void;
type FilterOption = { label: string; value: string; content: string };

interface FilterOrderModalProps {
  currentOrder: string[];
  options: FilterOption[];
  onSave: (newOrder: string[]) => void;
  onClose: () => void;

  form: FormInterface;
  handleDate: HandleDate;
  applyDateFilter: () => void;
  clearFilter: () => void;
  sortedOptions: FilterOption[];
  handleOptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filter: string;
}

// Helper para convertir PickerValue (Date | Dayjs | null) a Date | null
const pickerValueToDate = (value: Date | Dayjs | null): Date | null => {
  if (!value) return null;
  return value instanceof Date ? value : (value as Dayjs).toDate();
};

const FilterOrderModal: React.FC<FilterOrderModalProps> = ({
  // currentOrder,
  // options,
  // onSave,
  onClose,
  form,
  handleDate,
  applyDateFilter,
  clearFilter,
  sortedOptions,
  handleOptionChange,
  filter
}) => {
  const handleSave = () => {
    // onSave(order);

    if (form.validTo != null && form.validFrom == null) {
      toast.warn(
        "Para seleccionar una fecha final, seleccione una fecha de inicio."
      );
      return;
    }

    if (
      form.validFrom != null &&
      form.validTo != null &&
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
            Seleccione el estado y el rango de fechas que desea consultar.
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
                  className={`filter-modal__status ${checked ? "filter-modal__status--active" : ""}`}
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
          <span className="filter-modal__label">Rango de fechas</span>

          <div className="filter-modal__dates">
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Desde"
                value={form.validFrom}
                onChange={(d) =>
                  handleDate(
                    "validFrom",
                    pickerValueToDate(d as Date | Dayjs | null)
                  )
                }
                format="dd/MM/yyyy"
                maxDate={form.validTo ?? undefined}
                slotProps={{
                  textField: {
                    className: "filter-modal__date-field",
                    fullWidth: true,
                    size: "medium",
                  },
                }}
              />
            </LocalizationProvider>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Hasta"
                value={form.validTo}
                onChange={(d) =>
                  handleDate(
                    "validTo",
                    pickerValueToDate(d as Date | Dayjs | null)
                  )
                }
                format="dd/MM/yyyy"
                minDate={form.validFrom ?? undefined}
                slotProps={{
                  textField: {
                    className: "filter-modal__date-field",
                    fullWidth: true,
                    size: "medium",
                  },
                }}
              />
            </LocalizationProvider>
          </div>
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