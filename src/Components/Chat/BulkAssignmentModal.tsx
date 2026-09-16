import { useEffect, useMemo, useState, type FormEvent } from "react"
import { useMediaQuery } from "@mui/material"
import {
  DateTimePicker,
  LocalizationProvider,
  MobileDateTimePicker,
} from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { es } from "date-fns/locale"
import { IoClose } from "react-icons/io5"
import {
  AlertCircle,
  Ban,
  Check,
  CheckCircle2,
  Loader2,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react"

import Button from "@/Components/Common/Button"
import Input from "@/Components/Common/Input"
import Select from "@/Components/Common/Select"
import { Label } from "@/Components/Common/Label"
import { Textarea } from "@/Components/Common/Textarea"
import ListSkeleton from "@/Components/Common/ListSkeleton"
import useBulkAssignment from "@/Hooks/Chat/useBulkAssignment"
import useAssignableAgents from "@/Hooks/Auth/useAssignableAgents"
import type { BulkAssignmentRequest } from "@/Interfaces/Chat/BulkAssignmentInterface"
import "@/Styles/Chat/FilterOrderModal.css"
import "@/Styles/Common/DateTimePicker.css"
import "@/Styles/Chat/BulkAssignmentModal.css"

interface BulkAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onCompleted?: () => void | Promise<void>
}

interface BulkAssignmentFormFilters {
  from: Date | null
  to: Date | null
  metaChannelId: number | null
  searchConversation: string
}

type ModalStep = "form" | "processing" | "completed" | "failed" | "cancelled"

const DATE_TIME_FORMAT = "dd/MM/yyyy hh:mm a"

const createDefaultFilters = (): BulkAssignmentFormFilters => {
  const to = new Date()
  const from = new Date(to)

  from.setDate(from.getDate() - 3)
  from.setHours(0, 0, 0, 0)

  return {
    from,
    to,
    metaChannelId: null,
    searchConversation: "",
  }
}

const channelOptions = [
  { value: 0, label: "Todos los canales" },
  { value: 1, label: "WhatsApp" },
  { value: 2, label: "Messenger" },
  { value: 3, label: "Instagram" },
]

const normalizeStatus = (status?: string | null): string =>
  status?.trim().toLowerCase() ?? ""

const getStatusLabel = (status?: string | null): string => {
  switch (normalizeStatus(status)) {
    case "pending":
      return "Pendiente"
    case "processing":
      return "Procesando"
    case "completed":
      return "Completado"
    case "partial":
      return "Completado parcialmente"
    case "failed":
      return "Fallido"
    case "cancelled":
      return "Cancelado"
    default:
      return status || "Preparando"
  }
}

const toNullableNumber = (value: string): number | null => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toNullableText = (value: string): string | null => {
  const normalized = value.trim()
  return normalized || null
}

const toUtcIso = (value: Date | null): string | null => {
  if (!value || Number.isNaN(value.getTime())) return null
  return value.toISOString()
}

export default function BulkAssignmentModal({
  isOpen,
  onClose,
  onCompleted,
}: BulkAssignmentModalProps) {
  const isMobile = useMediaQuery("(max-width:700px)")
  const {
    job,
    createAssignment,
    cancelAssignment,
    reset,
    isSubmitting,
    isCancelling,
    isPolling,
    isCompleted,
    isCancelled,
    isFailed,
    progressPercentage,
    errorMessage,
  } = useBulkAssignment()

  const {
    agents,
    filteredAgents,
    search,
    setSearch,
    onlyOnline,
    setOnlyOnline,
    isLoading: isLoadingAgents,
    isFetching: isFetchingAgents,
    isError: isAgentsError,
    refetch: refetchAgents,
  } = useAssignableAgents({ enabled: isOpen })

  const [filters, setFilters] =
    useState<BulkAssignmentFormFilters>(createDefaultFilters)
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([])
  const [useAllAgents, setUseAllAgents] = useState(false)
  const [comment, setComment] = useState("")
  const [completionHandled, setCompletionHandled] = useState(false)

  const modalStep = useMemo<ModalStep>(() => {
    if (isFailed) return "failed"
    if (isCancelled) return "cancelled"
    if (isCompleted) return "completed"
    if (job || isSubmitting || isPolling) return "processing"
    return "form"
  }, [isFailed, isCancelled, isCompleted, job, isSubmitting, isPolling])

  const availableAgentIds = useMemo(
    () =>
      filteredAgents.filter((agent) => agent.isActive).map((agent) => agent.id),
    [filteredAgents],
  )

  const allVisibleAgentsSelected = useMemo(
    () =>
      availableAgentIds.length > 0 &&
      availableAgentIds.every((agentId) => selectedAgentIds.includes(agentId)),
    [availableAgentIds, selectedAgentIds],
  )

  const dateRangeInvalid = useMemo(() => {
    if (!filters.from || !filters.to) return false
    return filters.from.getTime() > filters.to.getTime()
  }, [filters.from, filters.to])

  const isBusy = isSubmitting || isPolling || isCancelling
  const canSubmit =
    !isBusy && !dateRangeInvalid && (useAllAgents || selectedAgentIds.length > 0)
  const isPartial = normalizeStatus(job?.status) === "partial"
  const displayedErrorMessage = dateRangeInvalid
    ? "La fecha inicial no puede ser mayor que la fecha final."
    : errorMessage

  useEffect(() => {
    if (!isCompleted || completionHandled) return
    setCompletionHandled(true)
    void onCompleted?.()
  }, [isCompleted, completionHandled, onCompleted])

  useEffect(() => {
    if (isOpen) return

    reset()
    setFilters(createDefaultFilters())
    setSelectedAgentIds([])
    setUseAllAgents(false)
    setComment("")
    setSearch("")
    setOnlyOnline(false)
    setCompletionHandled(false)
  }, [isOpen, reset, setSearch, setOnlyOnline])

  useEffect(() => {
    if (useAllAgents || selectedAgentIds.length === 0) return

    const validAgentIds = new Set(
      agents
        .filter((agent) => agent.isActive && (!onlyOnline || agent.isOnline))
        .map((agent) => agent.id),
    )

    setSelectedAgentIds((currentIds) => {
      const nextIds = currentIds.filter((id) => validAgentIds.has(id))
      if (
        nextIds.length === currentIds.length &&
        nextIds.every((id, index) => id === currentIds[index])
      ) {
        return currentIds
      }
      return nextIds
    })
  }, [agents, onlyOnline, useAllAgents, selectedAgentIds.length])

  if (!isOpen) return null

  const updateFilter = <K extends keyof BulkAssignmentFormFilters>(
    field: K,
    value: BulkAssignmentFormFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const handleUseAllAgentsChange = (checked: boolean) => {
    setUseAllAgents(checked)
    if (checked) {
      setSelectedAgentIds([])
      setSearch("")
    }
  }

  const handleOnlyOnlineChange = (checked: boolean) => {
    setOnlyOnline(checked)
    if (!checked) return

    const onlineAgentIds = new Set(
      agents
        .filter((agent) => agent.isActive && agent.isOnline)
        .map((agent) => agent.id),
    )

    setSelectedAgentIds((currentIds) =>
      currentIds.filter((id) => onlineAgentIds.has(id)),
    )
  }

  const toggleAgent = (agentId: number) => {
    if (useAllAgents) return

    setSelectedAgentIds((currentIds) =>
      currentIds.includes(agentId)
        ? currentIds.filter((id) => id !== agentId)
        : [...currentIds, agentId],
    )
  }

  const toggleAllVisibleAgents = () => {
    if (useAllAgents) return

    setSelectedAgentIds((currentIds) => {
      if (allVisibleAgentsSelected) {
        return currentIds.filter((id) => !availableAgentIds.includes(id))
      }
      return Array.from(new Set([...currentIds, ...availableAgentIds]))
    })
  }

  const handleClose = () => {
    if (isBusy) return
    onClose()
  }

  const handleRetry = () => {
    reset()
    setCompletionHandled(false)
  }

  const handleCancelAssignment = async () => {
    if (!job || isCancelling) return

    try {
      await cancelAssignment()
    } catch {
      return
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    const request: BulkAssignmentRequest = {
      from: toUtcIso(filters.from),
      to: toUtcIso(filters.to),
      metaChannelId: filters.metaChannelId,
      searchConversation: toNullableText(filters.searchConversation),
      useAllAgents,
      agentIds: useAllAgents ? [] : selectedAgentIds,
      onlyOnlineAgents: onlyOnline,
      comment: toNullableText(comment),
    }

    try {
      await createAssignment(request)
    } catch {
      return
    }
  }

  const pickerProps = {
    ampm: true,
    format: DATE_TIME_FORMAT,
    minutesStep: 1,
    slotProps: {
      textField: {
        className: "filter-modal__date-field date-picker-field",
        fullWidth: true,
        size: "small" as const,
      },
      actionBar: {
        actions: ["clear", "cancel", "accept"] as (
          | "clear"
          | "cancel"
          | "accept"
        )[],
      },
    },
  }

  const DatePicker = isMobile ? MobileDateTimePicker : DateTimePicker

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onClose()
        }
      }}
    >
      <div
        className="filter-modal bam-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-assignment-title"
      >
        <button
          type="button"
          className="filter-modal__close"
          onClick={handleClose}
          disabled={isBusy}
          aria-label="Cerrar"
        >
          <IoClose size={22} />
        </button>

        <div className="filter-modal__header">
          <h3 id="bulk-assignment-title" className="filter-modal__title">
            Asignación masiva
          </h3>
          <p className="filter-modal__subtitle">
            Reparte las conversaciones sin agente de esta empresa entre los
            soportes que elijas, los que estén en línea o todos.Z
          </p>
        </div>
      
        {modalStep === "form" && (
          <form className="bam-form" onSubmit={handleSubmit}>
            <div className="filter-modal__content">
              <section className="filter-modal__section">
                <span className="filter-modal__label">
                  Filtros de conversaciones
                </span>
                <p className="bam-hint">
                  Solo se toman las más recientes, sin agente, no pausadas y de
                  contactos no bloqueados.
                </p>

                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={es}
                >
                  <div className="filter-modal__dates">
                    <div className="filter-modal__date-container">
                      <DatePicker
                        {...pickerProps}
                        label="Desde"
                        value={filters.from}
                        onChange={(date) => updateFilter("from", date)}
                        maxDateTime={filters.to ?? undefined}
                      />
                    </div>
                    <div className="filter-modal__date-container">
                      <DatePicker
                        {...pickerProps}
                        label="Hasta"
                        value={filters.to}
                        onChange={(date) => updateFilter("to", date)}
                        minDateTime={filters.from ?? undefined}
                      />
                    </div>
                  </div>
                </LocalizationProvider>

                <div className="bam-grid">
                  <div>
                    <Label htmlFor="bam-channel">Canal</Label>
                    <Select
                      id="bam-channel"
                      value={filters.metaChannelId ?? 0}
                      options={channelOptions}
                      onChange={(event) => {
                        const channelId = toNullableNumber(event.target.value)

                        updateFilter(
                          "metaChannelId",
                          channelId && channelId > 0 ? channelId : null,
                        )
                      }}
                    />
                  </div>
                 
                </div>
              </section>

              <section className="filter-modal__section">
                <span className="filter-modal__label">Agentes de destino</span>
                <p className="bam-hint">
                  {useAllAgents
                    ? "Se utilizarán todos los agentes Support activos."
                    : `Seleccionados: ${selectedAgentIds.length}`}
                </p>

                <div className="bam-checks">
                  <label className="bam-check">
                    <input
                      type="checkbox"
                      checked={useAllAgents}
                      onChange={(event) =>
                        handleUseAllAgentsChange(event.target.checked)
                      }
                    />
                    <span>Usar todos</span>
                  </label>
                  <label className="bam-check">
                    <input
                      type="checkbox"
                      checked={onlyOnline}
                      onChange={(event) =>
                        handleOnlyOnlineChange(event.target.checked)
                      }
                    />
                    <span>Solo conectados</span>
                  </label>
                </div>

                <div className="bam-agent-toolbar">
                  <Input
                    placeholder="Buscar agente"
                    value={search}
                    disabled={useAllAgents}
                    rightIcon={<Search size={16} />}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={useAllAgents || availableAgentIds.length === 0}
                    onClick={toggleAllVisibleAgents}
                  >
                    {allVisibleAgentsSelected
                      ? "Quitar visibles"
                      : "Seleccionar visibles"}
                  </Button>
                </div>

                {isLoadingAgents || isFetchingAgents ? (
                  <ListSkeleton variant="list" count={6} />
                ) : isAgentsError ? (
                  <div className="bam-empty">
                    <AlertCircle />
                    <div>
                      <strong>No fue posible cargar los agentes</strong>
                      <p>Intenta consultar nuevamente.</p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void refetchAgents()}
                    >
                      Reintentar
                    </Button>
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="bam-empty">
                    <UsersRound />
                    <span>
                      No hay agentes activos que coincidan con los filtros.
                    </span>
                  </div>
                ) : (
                  <div className="bam-agent-list">
                    {filteredAgents.map((agent) => {
                      const isSelected = selectedAgentIds.includes(agent.id)

                      return (
                        <button
                          key={agent.id}
                          type="button"
                          className={`bam-agent${
                            isSelected ? " bam-agent--selected" : ""
                          }`}
                          onClick={() => toggleAgent(agent.id)}
                          disabled={useAllAgents || !agent.isActive}
                        >
                          <span className="bam-agent__check">
                            {isSelected && <Check size={14} />}
                          </span>
                          <span className="bam-agent__avatar">
                            {agent.imageUrl ? (
                              <img src={agent.imageUrl} alt={agent.name} />
                            ) : (
                              <UserRound size={18} />
                            )}
                          </span>
                          <span className="bam-agent__info">
                            <strong>{agent.name}</strong>
                            <small>
                              {agent.email || "Sin correo registrado"}
                            </small>
                          </span>
                          <span
                            className={`status ${
                              agent.isOnline
                                ? "status--active"
                                : "status--inactive"
                            }`}
                          >
                            {agent.isOnline ? "Conectado" : "Desconectado"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="filter-modal__section">
                <span className="filter-modal__label">
                  Comentario opcional
                </span>
                <Textarea
                  placeholder="Motivo o indicación interna"
                  maxLength={500}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
                <span className="bam-count">{comment.length}/500</span>
              </section>

              {displayedErrorMessage && (
                <div className="bam-empty bam-empty--error">
                  <AlertCircle />
                  <div>
                    <strong>No fue posible iniciar la asignación</strong>
                    <p>{displayedErrorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="filter-modal__actions">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isBusy}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={!canSubmit}>
                {isSubmitting ? "Iniciando..." : "Iniciar asignación"}
              </Button>
            </div>
          </form>
        )}

        {modalStep === "processing" && (
          <div className="bam-result">
            <Loader2 className="bam-spin" />
            <h3>Procesando asignación</h3>
            <p>
              Las conversaciones están siendo validadas y distribuidas entre los
              agentes disponibles.
            </p>
            <div className="bam-progress">
              <div className="bam-progress__bar">
                <span style={{ width: `${progressPercentage}%` }} />
              </div>
              <strong>{progressPercentage}%</strong>
            </div>
            <div className="bam-stats">
              <span>Total {job?.totalRequested ?? 0}</span>
              <span>Asignadas {job?.totalAssigned ?? 0}</span>
              <span>Omitidas {job?.totalSkipped ?? 0}</span>
            </div>
            <span
              className={`status ${
                normalizeStatus(job?.status) === "failed"
                  ? "status--inactive"
                  : "status--active"
              }`}
            >
              {getStatusLabel(job?.status)}
            </span>
            {job?.message && <p>{job.message}</p>}
            <p className="bam-cancel-hint">
              Si el proceso se queda detenido, puedes cancelarlo para liberar
              la empresa y no dejar carga colgada en el servidor.
            </p>
            <div className="filter-modal__actions">
              <Button
                variant="secondary"
                onClick={handleCancelAssignment}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelando..." : "Cancelar asignación"}
              </Button>
            </div>
          </div>
        )}

        {modalStep === "completed" && (
          <div className="bam-result">
            <CheckCircle2 color="var(--color-success)" />
            <h3>
              {isPartial
                ? "Asignación completada parcialmente"
                : "Asignación completada"}
            </h3>
            <p>
              Se asignaron {job?.totalAssigned ?? 0} de{" "}
              {job?.totalRequested ?? 0} conversaciones.
            </p>
            <span className="status status--active">
              {getStatusLabel(job?.status)}
            </span>
            <div className="bam-stats">
              <span>Total {job?.totalRequested ?? 0}</span>
              <span>Asignadas {job?.totalAssigned ?? 0}</span>
              <span>Omitidas {job?.totalSkipped ?? 0}</span>
              <span>Fallidas {job?.totalFailed ?? 0}</span>
            </div>
            {job?.message && <p>{job.message}</p>}

            {(job?.agents?.length ?? 0) > 0 && (
              <div className="bam-summary">
                <span className="filter-modal__label">Resumen por agente</span>
                <ul>
                  {job!.agents!
                    .slice()
                    .sort((a, b) => b.assignedCount - a.assignedCount)
                    .map((agent) => (
                      <li key={agent.agentUserId}>
                        <div>
                          <strong>{agent.agentName || `Agente ${agent.agentUserId}`}</strong>
                          <small>
                            {agent.assignedCount} asignada
                            {agent.assignedCount === 1 ? "" : "s"}
                            {agent.skippedCount > 0
                              ? ` · ${agent.skippedCount} omitida${agent.skippedCount === 1 ? "" : "s"}`
                              : ""}
                          </small>
                        </div>
                        <span
                          className={`status ${
                            agent.isOnline
                              ? "status--active"
                              : "status--inactive"
                          }`}
                        >
                          {agent.isOnline ? "Conectado" : "Desconectado"}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="filter-modal__actions">
              <Button variant="primary" onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {modalStep === "cancelled" && (
          <div className="bam-result">
            <Ban color="var(--color-warning, #b45309)" />
            <h3>Asignación cancelada</h3>
            <p>
              El proceso se detuvo y se liberó el trabajo. Ya puedes iniciar
              otra asignación.
            </p>
            <span className="status status--inactive">Cancelado</span>
            <div className="bam-stats">
              <span>Total {job?.totalRequested ?? 0}</span>
              <span>Asignadas {job?.totalAssigned ?? 0}</span>
              <span>Omitidas {job?.totalSkipped ?? 0}</span>
            </div>
            {job?.message && <p>{job.message}</p>}
            <div className="filter-modal__actions">
              <Button variant="secondary" onClick={handleClose}>
                Cerrar
              </Button>
              <Button variant="primary" onClick={handleRetry}>
                Nueva asignación
              </Button>
            </div>
          </div>
        )}

        {modalStep === "failed" && (
          <div className="bam-result">
            <AlertCircle color="var(--color-error)" />
            <h3>No se completó la asignación</h3>
            <p>
              {errorMessage || "El proceso finalizó con un error inesperado."}
            </p>
            <span className="status status--inactive">Fallido</span>
            <div className="filter-modal__actions">
              <Button variant="secondary" onClick={handleClose}>
                Cerrar
              </Button>
              <Button variant="primary" onClick={handleRetry}>
                Intentar nuevamente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
