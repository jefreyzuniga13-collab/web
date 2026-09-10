import { useMemo } from "react"
import { useMediaQuery } from "@mui/material"
import { DateTimePicker, LocalizationProvider, MobileDateTimePicker} from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { es } from "date-fns/locale"
import { toast } from "react-toastify"
import { IoClose } from "react-icons/io5"
import Button from "@/Components/Common/Button"
import CustomAutocomplete from "@/Components/Common/CustomAutocomplete"
import "@/Styles/Chat/FilterOrderModal.css"
import "@/Styles/Common/DateTimePicker.css"
interface FormInterface {
  validFrom: Date | null
  validTo: Date | null
  agentId: number
}

type DateField = "validFrom" | "validTo"

type HandleDate = (
  field: DateField,
  date: Date | null
) => void

type FilterOption = {
  label: string
  value: string
  content: string
}

type AutocompleteOption = {
  label: string
  value: string
}

interface FilterOrderModalProps {
  currentOrder: string[]
  options: FilterOption[]
  onSave: (newOrder: string[]) => void
  onClose: () => void

  form: FormInterface
  handleDate: HandleDate
  handleAgentChange: (agentId: number) => void

  applyDateFilter: () => void
  clearFilter: () => void

  sortedOptions: FilterOption[]
  handleOptionChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void

  filter: string

  agentOptions: AutocompleteOption[]
  loadingAgents: boolean
}

const ALL_AGENTS_OPTION: AutocompleteOption = {
  label: "Todos los agentes",
  value: "0",
}

const DATE_TIME_FORMAT = "dd/MM/yyyy hh:mm a"

const FilterOrderModal: React.FC<
  FilterOrderModalProps
> = ({
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
  const isMobile = useMediaQuery(
    "(max-width:700px)"
  )

  const optionsWithAllAgents = useMemo(
    () => [
      ALL_AGENTS_OPTION,
      ...agentOptions,
    ],
    [agentOptions]
  )

  const selectedAgent = useMemo(() => {
    return (
      optionsWithAllAgents.find(
        (option) =>
          Number(option.value) ===
          Number(form.agentId)
      ) ?? ALL_AGENTS_OPTION
    )
  }, [
    form.agentId,
    optionsWithAllAgents,
  ])

  const validateDate = (
    date: Date | null
  ): boolean => {
    if (date === null) return true

    return !Number.isNaN(date.getTime())
  }

  const handleDateChange = (
    field: DateField,
    date: Date | null
  ) => {
    if (!validateDate(date)) {
      return
    }

    handleDate(field, date)
  }

  const handleSave = () => {
    if (
      !validateDate(form.validFrom) ||
      !validateDate(form.validTo)
    ) {
      toast.warn(
        "Seleccione una fecha y hora válida."
      )
      return
    }

    if (
      form.validTo !== null &&
      form.validFrom === null
    ) {
      toast.warn(
        "Para seleccionar una fecha final, seleccione una fecha de inicio."
      )
      return
    }

    if (
      form.validFrom !== null &&
      form.validTo !== null &&
      form.validFrom.getTime() >
        form.validTo.getTime()
    ) {
      toast.warn(
        "La fecha inicial no puede ser mayor que la fecha final."
      )
      return
    }

    applyDateFilter()
    onClose()
  }

  const handleClearFilter = () => {
    clearFilter()
    onClose()
  }

  const commonPickerProps = {
    ampm: true,
    format: DATE_TIME_FORMAT,
    minutesStep: 1,

    slotProps: {
      textField: {
        className:
          "filter-modal__date-field date-picker-field",
        fullWidth: true,
        size: "small" as const,
      },

      actionBar: {
        actions: [
          "clear",
          "cancel",
          "accept",
        ] as (
          | "clear"
          | "cancel"
          | "accept"
        )[],
      },
    },
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="filter-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
      >
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
          <h3
            id="filter-modal-title"
            className="filter-modal__title"
          >
            Filtrar conversaciones
          </h3>

          <p className="filter-modal__subtitle">
            Filtros aplicados a las
            conversaciones
          </p>
        </div>

        <div className="filter-modal__content">
          <section className="filter-modal__section">
            <span className="filter-modal__label">
              Estado de conversación
            </span>

            <div className="filter-modal__status-list">
              {sortedOptions.map((option) => {
                const checked =
                  filter === option.value

                return (
                  <label
                    key={option.value}
                    className={[
                      "filter-modal__status",
                      checked
                        ? "filter-modal__status--active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      id={`conversation-filter-${option.value}`}
                      type="radio"
                      name="conversation-status-filter"
                      value={option.value}
                      checked={checked}
                      onChange={
                        handleOptionChange
                      }
                      className="filter-modal__status-input"
                    />

                    <span>
                      {option.content}
                    </span>
                  </label>
                )
              })}
            </div>
          </section>

          <section className="filter-modal__section">
            <span className="filter-modal__label">
              Filtrar por agente
            </span>

            <div className="filter-modal__autocomplete">
              <CustomAutocomplete
                placeholder={
                  loadingAgents
                    ? "Cargando agentes..."
                    : optionsWithAllAgents.length >
                        1
                      ? "Seleccione agente"
                      : "No hay agentes disponibles"
                }
                options={
                  optionsWithAllAgents
                }
                value={selectedAgent}
                onChange={(agent) => {
                  handleAgentChange(
                    agent
                      ? Number(agent.value)
                      : 0
                  )
                }}
                disabled={loadingAgents}
                loading={loadingAgents}
              />
            </div>
          </section>

          <section className="filter-modal__section">
            <span className="filter-modal__label">
              Rango de fechas
            </span>

            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={es}
            >
              <div className="filter-modal__dates">
                <div className="filter-modal__date-container">
                  {isMobile ? (
                    <MobileDateTimePicker
                      {...commonPickerProps}
                      label="Desde"
                      value={form.validFrom}
                      onChange={(date) =>
                        handleDateChange(
                          "validFrom",
                          date
                        )
                      }
                      maxDateTime={
                        form.validTo ??
                        undefined
                      }
                    />
                  ) : (
                    <DateTimePicker
                      {...commonPickerProps}
                      label="Desde"
                      value={form.validFrom}
                      onChange={(date) =>
                        handleDateChange(
                          "validFrom",
                          date
                        )
                      }
                      maxDateTime={
                        form.validTo ??
                        undefined
                      }
                    />
                  )}
                </div>

                <div className="filter-modal__date-container">
                  {isMobile ? (
                    <MobileDateTimePicker
                      {...commonPickerProps}
                      label="Hasta"
                      value={form.validTo}
                      onChange={(date) =>
                        handleDateChange(
                          "validTo",
                          date
                        )
                      }
                      minDateTime={
                        form.validFrom ??
                        undefined
                      }
                    />
                  ) : (
                    <DateTimePicker
                      {...commonPickerProps}
                      label="Hasta"
                      
                      value={form.validTo}
                      onChange={(date) =>
                        handleDateChange(
                          "validTo",
                          date
                        )
                      }
                      minDateTime={
                        form.validFrom ??
                        undefined
                      }
                    />
                  )}
                </div>
              </div>
            </LocalizationProvider>
          </section>
        </div>

        <div className="filter-modal__actions">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleClearFilter}
          >
            Limpiar
          </Button>

          <Button
            variant="primary"
            onClick={handleSave}
          >
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FilterOrderModal