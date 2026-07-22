import { useEffect, useMemo, useState, type FormEvent } from "react";

import {AlertCircle,CalendarDays,Check,CheckCircle2,ChevronDown,Loader2,Search,UserRound,UsersRound,X} from "lucide-react";

import useBulkAssignment from "@/Hooks/Chat/useBulkAssignment";
import useAssignableAgents from "@/Hooks/Auth/useAssignableAgents";
import type { BulkAssignmentRequest } from "@/Interfaces/Chat/BulkAssignmentInterface";
import "@/Styles/Chat/BulkAssignmentModal.css";

interface BulkAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void | Promise<void>;
}

interface BulkAssignmentFormFilters {
  from: string | null;
  to: string | null;
  metaChannelId: number | null;
  searchConversation: string | null;
}

type ModalStep = "form" | "processing" | "completed" | "failed";

const initialFilters: BulkAssignmentFormFilters = {
  from: null,
  to: null,
  metaChannelId: null,
  searchConversation: null,
};

const metaChannels = [
  {
    id: 1,
    name: "WhatsApp",
  },
  {
    id: 2,
    name: "Messenger",
  },
  {
    id: 3,
    name: "Instagram",
  },
];

const normalizeStatus = (status?: string | null): string => {
  return status?.trim().toLowerCase() ?? "";
};

const getStatusLabel = (status?: string | null): string => {
  switch (normalizeStatus(status)) {
    case "pending":
      return "Pendiente";

    case "processing":
      return "Procesando";

    case "completed":
      return "Completado";

    case "partial":
      return "Completado parcialmente";

    case "failed":
      return "Fallido";

    default:
      return status || "Preparando";
  }
};

const toNullableNumber = (value: string): number | null => {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const toNullableText = (value: string): string | null => {
  const normalizedValue = value.trim();

  return normalizedValue || null;
};

const toUtcIso = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

export default function BulkAssignmentModal({
  isOpen,
  onClose,
  onCompleted,
}: BulkAssignmentModalProps) {
  const {
    job,
    createAssignment,
    reset,

    isSubmitting,
    isPolling,
    isCompleted,
    isFailed,

    progressPercentage,
    errorMessage,
  } = useBulkAssignment();

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
  } = useAssignableAgents();

  const [filters, setFilters] =
    useState<BulkAssignmentFormFilters>(initialFilters);

  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);

  const [useAllAgents, setUseAllAgents] = useState(false);

  const [comment, setComment] = useState("");

  const [completionHandled, setCompletionHandled] = useState(false);

  const modalStep = useMemo<ModalStep>(() => {
    if (isFailed) {
      return "failed";
    }

    if (isCompleted) {
      return "completed";
    }

    if (job || isSubmitting || isPolling) {
      return "processing";
    }

    return "form";
  }, [isFailed, isCompleted, job, isSubmitting, isPolling]);

  const availableAgentIds = useMemo(
    () =>
      filteredAgents.filter((agent) => agent.isActive).map((agent) => agent.id),
    [filteredAgents],
  );

  const allVisibleAgentsSelected = useMemo(
    () =>
      availableAgentIds.length > 0 &&
      availableAgentIds.every((agentId) => selectedAgentIds.includes(agentId)),
    [availableAgentIds, selectedAgentIds],
  );

  const selectedAgents = useMemo(
    () =>
      agents.filter(
        (agent) => agent.isActive && selectedAgentIds.includes(agent.id),
      ),
    [agents, selectedAgentIds],
  );

  const dateRangeInvalid = useMemo(() => {
    if (!filters.from || !filters.to) {
      return false;
    }

    const from = new Date(filters.from);

    const to = new Date(filters.to);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return true;
    }

    return from > to;
  }, [filters.from, filters.to]);

  const isBusy = isSubmitting || isPolling;

  const canSubmit =
    !isBusy &&
    !dateRangeInvalid &&
    (useAllAgents || selectedAgentIds.length > 0);

  const isPartial = normalizeStatus(job?.status) === "partial";

  const displayedErrorMessage = dateRangeInvalid
    ? "La fecha inicial no puede ser mayor que la fecha final."
    : errorMessage;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void refetchAgents();
  }, [isOpen, refetchAgents]);

  useEffect(() => {
    if (!isCompleted || completionHandled) {
      return;
    }

    setCompletionHandled(true);

    void onCompleted?.();
  }, [isCompleted, completionHandled, onCompleted]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    reset();

    setFilters(initialFilters);
    setSelectedAgentIds([]);
    setUseAllAgents(false);
    setComment("");
    setSearch("");
    setOnlyOnline(false);
    setCompletionHandled(false);
  }, [isOpen, reset, setSearch, setOnlyOnline]);

  useEffect(() => {
    if (useAllAgents || selectedAgentIds.length === 0) {
      return;
    }

    const validAgentIds = new Set(
      agents
        .filter((agent) => agent.isActive && (!onlyOnline || agent.isOnline))
        .map((agent) => agent.id),
    );

    setSelectedAgentIds((currentIds) => {
      const nextIds = currentIds.filter((id) => validAgentIds.has(id));

      if (
        nextIds.length === currentIds.length &&
        nextIds.every((id, index) => id === currentIds[index])
      ) {
        return currentIds;
      }

      return nextIds;
    });
  }, [agents, onlyOnline, useAllAgents, selectedAgentIds.length]);

  if (!isOpen) {
    return null;
  }

  const updateFilter = <K extends keyof BulkAssignmentFormFilters>(
    field: K,
    value: BulkAssignmentFormFilters[K],
  ) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  };

  const handleUseAllAgentsChange = (checked: boolean) => {
    setUseAllAgents(checked);

    if (checked) {
      setSelectedAgentIds([]);
      setSearch("");
    }
  };

  const handleOnlyOnlineChange = (checked: boolean) => {
    setOnlyOnline(checked);

    if (!checked) {
      return;
    }

    const onlineAgentIds = new Set(
      agents
        .filter((agent) => agent.isActive && agent.isOnline)
        .map((agent) => agent.id),
    );

    setSelectedAgentIds((currentIds) =>
      currentIds.filter((id) => onlineAgentIds.has(id)),
    );
  };

  const toggleAgent = (agentId: number) => {
    if (useAllAgents) {
      return;
    }

    setSelectedAgentIds((currentIds) =>
      currentIds.includes(agentId)
        ? currentIds.filter((currentId) => currentId !== agentId)
        : [...currentIds, agentId],
    );
  };

  const toggleAllVisibleAgents = () => {
    if (useAllAgents) {
      return;
    }

    setSelectedAgentIds((currentIds) => {
      if (allVisibleAgentsSelected) {
        return currentIds.filter(
          (agentId) => !availableAgentIds.includes(agentId),
        );
      }

      return Array.from(new Set([...currentIds, ...availableAgentIds]));
    });
  };

  const handleClose = () => {
    if (isBusy) {
      return;
    }

    onClose();
  };

  const handleRetry = () => {
    reset();
    setCompletionHandled(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const request: BulkAssignmentRequest = {
      from: toUtcIso(filters.from),

      to: toUtcIso(filters.to),

      metaChannelId: filters.metaChannelId,

      searchConversation: toNullableText(filters.searchConversation ?? ""),

      useAllAgents,

      agentIds: useAllAgents ? [] : selectedAgentIds,

      onlyOnlineAgents: onlyOnline,

      comment: toNullableText(comment),
    };

    try {
      await createAssignment(request);
    } catch {
      return;
    }
  };

  return (
    <div
      className="bulkAssignmentModal-backdrop"
      role="presentation"
      onMouseDown={handleClose}
    >
      <div
        className="bulkAssignmentModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-assignment-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="bulkAssignmentModal-header">
          <div className="bulkAssignmentModal-headerText">
            <h2
              id="bulk-assignment-title"
              className="bulkAssignmentModal-title"
            >
              Asignación masiva
            </h2>

            <p className="bulkAssignmentModal-subtitle">
              Asigna conversaciones pendientes entre agentes
              activos.
            </p>
          </div>

          <button
            type="button"
            className="bulkAssignmentModal-closeButton"
            onClick={handleClose}
            disabled={isBusy}
            aria-label="Cerrar"
          >
            <X />
          </button>
        </header>

        {modalStep === "form" && (
          <form className="bulkAssignmentModal-form" onSubmit={handleSubmit}>
            <div className="bulkAssignmentModal-body">
              <section className="bulkAssignmentSection">
                <div className="bulkAssignmentSection-header">
                  <div>
                    <h3 className="bulkAssignmentSection-title">
                      Filtros de conversaciones
                    </h3>

                    <p className="bulkAssignmentSection-description">
                      Solo se tomarán las conversaciones más recientes, sin
                      agente, no pausadas y de contactos no bloqueados.
                    </p>
                  </div>
                </div>

                <div className="bulkAssignmentFiltersGrid">
                  <label className="bulkAssignmentField">
                    <span className="bulkAssignmentField-label">Desde</span>

                    <div className="bulkAssignmentInputWrapper">
                      <CalendarDays />

                      <input
                        type="datetime-local"
                        className="bulkAssignmentInput"
                        value={filters.from ?? ""}
                        onChange={(event) =>
                          updateFilter("from", event.target.value || null)
                        }
                      />
                    </div>
                  </label>

                  <label className="bulkAssignmentField">
                    <span className="bulkAssignmentField-label">Hasta</span>

                    <div className="bulkAssignmentInputWrapper">
                      <CalendarDays />

                      <input
                        type="datetime-local"
                        className="bulkAssignmentInput"
                        value={filters.to ?? ""}
                        onChange={(event) =>
                          updateFilter("to", event.target.value || null)
                        }
                      />
                    </div>
                  </label>

                  <label className="bulkAssignmentField">
                    <span className="bulkAssignmentField-label">Canal</span>

                    <div className="bulkAssignmentSelectWrapper">
                      <select
                        className="bulkAssignmentSelect"
                        value={filters.metaChannelId ?? ""}
                        onChange={(event) =>
                          updateFilter(
                            "metaChannelId",
                            toNullableNumber(event.target.value),
                          )
                        }
                      >
                        <option value="">Todos los canales</option>

                        {metaChannels.map((channel) => (
                          <option key={channel.id} value={channel.id}>
                            {channel.name}
                          </option>
                        ))}
                      </select>

                      <ChevronDown />
                    </div>
                  </label>

                  <label className="bulkAssignmentField">
                    <span className="bulkAssignmentField-label">
                      Buscar conversación
                    </span>

                    <div className="bulkAssignmentInputWrapper">
                      <Search />

                      <input
                        type="text"
                        className="bulkAssignmentInput"
                        placeholder="Nombre, teléfono o ID"
                        maxLength={250}
                        value={filters.searchConversation ?? ""}
                        onChange={(event) =>
                          updateFilter("searchConversation", event.target.value)
                        }
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="bulkAssignmentSection">
                <div className="bulkAssignmentSection-header bulkAssignmentSection-header--agents">
                  <div>
                    <h3 className="bulkAssignmentSection-title">
                      Agentes de destino
                    </h3>

                    <p className="bulkAssignmentSection-description">
                      {useAllAgents
                        ? "Se utilizarán todos los agentes Support activos."
                        : `Seleccionados: ${selectedAgentIds.length}`}
                    </p>
                  </div>

                  <div className="bulkAssignmentOptions bulkAssignmentOptions--agents">
                    <label className="bulkAssignmentCheckOption">
                      <input
                        type="checkbox"
                        checked={useAllAgents}
                        onChange={(event) =>
                          handleUseAllAgentsChange(event.target.checked)
                        }
                      />
                      <span className="bulkAssignmentCheckBox">
                        <Check />
                      </span>
                      Usar todos
                    </label>

                    <label className="bulkAssignmentCheckOption">
                      <input
                        type="checkbox"
                        checked={onlyOnline}
                        onChange={(event) =>
                          handleOnlyOnlineChange(event.target.checked)
                        }
                      />
                      <span className="bulkAssignmentCheckBox">
                        <Check />
                      </span>
                      Solo conectados
                    </label>
                  </div>
                </div>

                <div className="bulkAssignmentAgentControls">
                  <div className="bulkAssignmentAgentSearch">
                    <Search />

                    <input
                      type="text"
                      placeholder="Buscar agente"
                      value={search}
                      disabled={useAllAgents}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="bulkAssignmentTextButton"
                    onClick={toggleAllVisibleAgents}
                    disabled={useAllAgents || availableAgentIds.length === 0}
                  >
                    {allVisibleAgentsSelected
                      ? "Quitar visibles"
                      : "Seleccionar visibles"}
                  </button>
                </div>

                {isLoadingAgents || isFetchingAgents ? (
                  <div className="bulkAssignmentEmptyState">
                    <Loader2 className="bulkAssignmentSpin" />

                    <span>Cargando agentes...</span>
                  </div>
                ) : isAgentsError ? (
                  <div className="bulkAssignmentErrorState">
                    <AlertCircle />

                    <div>
                      <strong>No fue posible cargar los agentes</strong>

                      <p>Intenta consultar nuevamente.</p>
                    </div>

                    <button
                      type="button"
                      className="bulkAssignmentTextButton"
                      onClick={() => void refetchAgents()}
                    >
                      Reintentar
                    </button>
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="bulkAssignmentEmptyState">
                    <UsersRound />

                    <span>
                      No hay agentes activos que coincidan con los filtros.
                    </span>
                  </div>
                ) : (
                  <div className="bulkAssignmentAgentList">
                    {filteredAgents.map((agent) => {
                      const isSelected = selectedAgentIds.includes(agent.id);

                      return (
                        <button
                          key={agent.id}
                          type="button"
                          className={`bulkAssignmentAgent ${
                            isSelected ? "bulkAssignmentAgent--selected" : ""
                          }`}
                          onClick={() => toggleAgent(agent.id)}
                          disabled={useAllAgents || !agent.isActive}
                        >
                          <span className="bulkAssignmentAgent-selection">
                            {isSelected && <Check />}
                          </span>

                          <span className="bulkAssignmentAgent-avatar">
                            {agent.imageUrl ? (
                              <img src={agent.imageUrl} alt={agent.name} />
                            ) : (
                              <UserRound />
                            )}
                          </span>

                          <span className="bulkAssignmentAgent-info">
                            <strong>{agent.name}</strong>

                            <small>
                              {agent.email || "Sin correo registrado"}
                            </small>
                          </span>

                          <span className="bulkAssignmentAgent-meta">
                            <span
                              className={`bulkAssignmentAgent-status ${
                                agent.isOnline
                                  ? "bulkAssignmentAgent-status--online"
                                  : "bulkAssignmentAgent-status--offline"
                              }`}
                            >
                              {agent.isOnline ? "Conectado" : "Desconectado"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="bulkAssignmentSection">
                <div className="bulkAssignmentDistribution">
                  <div className="bulkAssignmentSection-header">
                    <div>
                      <h3 className="bulkAssignmentSection-title">
                        Distribución
                      </h3>

                      <p className="bulkAssignmentSection-description">
                        Las conversaciones se distribuirán equitativamente,
                        priorizando agentes con menor carga.
                      </p>
                    </div>
                  </div>

                  <label className="bulkAssignmentField">
                    <span className="bulkAssignmentField-label">
                      Comentario opcional
                    </span>

                    <textarea
                      className="bulkAssignmentTextarea"
                      placeholder="Motivo o indicación interna"
                      maxLength={500}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                    />

                    <span className="bulkAssignmentCharacterCount">
                      {comment.length}/500
                    </span>
                  </label>

                  <div className="bulkAssignmentSummary">
                    <div className="bulkAssignmentSummary-item">
                      <span>Agentes</span>

                      <strong>
                        {useAllAgents ? "Todos" : selectedAgentIds.length}
                      </strong>
                    </div>

                    <div className="bulkAssignmentSummary-item">
                      <span>Distribución</span>

                      <strong>Equitativa</strong>
                    </div>

                    <div className="bulkAssignmentSummary-item">
                      <span>Disponibilidad</span>

                      <strong>
                        {onlyOnline ? "Solo conectados" : "Activos"}
                      </strong>
                    </div>

                    <div className="bulkAssignmentSummary-item">
                      <span>Primer agente</span>

                      <strong>
                        {useAllAgents
                          ? "Automático"
                          : (selectedAgents[0]?.name ?? "Sin seleccionar")}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              {displayedErrorMessage && (
                <div className="bulkAssignmentErrorState">
                  <AlertCircle />

                  <div>
                    <strong>No fue posible iniciar la asignación</strong>

                    <p>{displayedErrorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            <footer className="bulkAssignmentModal-footer">
              <button
                type="button"
                className="bulkAssignmentButton bulkAssignmentButton--secondary"
                onClick={handleClose}
                disabled={isBusy}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="bulkAssignmentButton bulkAssignmentButton--primary"
                disabled={!canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="bulkAssignmentSpin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <UsersRound />
                    Iniciar asignación
                  </>
                )}
              </button>
            </footer>
          </form>
        )}

        {modalStep === "processing" && (
          <div className="bulkAssignmentProcessView">
            <div className="bulkAssignmentProcessIcon">
              <Loader2 className="bulkAssignmentSpin" />
            </div>

            <h3>Procesando asignación</h3>

            <p>
              Las conversaciones están siendo validadas y distribuidas entre los
              agentes disponibles.
            </p>

            <div className="bulkAssignmentProgress">
              <div className="bulkAssignmentProgress-header">
                <span>Progreso</span>

                <strong>{progressPercentage}%</strong>
              </div>

              <div className="bulkAssignmentProgress-track">
                <div
                  className="bulkAssignmentProgress-fill"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>
            </div>

            <div className="bulkAssignmentProcessStats">
              <div>
                <span>Total</span>

                <strong>{job?.totalRequested ?? 0}</strong>
              </div>

              <div>
                <span>Procesadas</span>

                <strong>{job?.totalProcessed ?? 0}</strong>
              </div>

              <div>
                <span>Asignadas</span>

                <strong>{job?.totalAssigned ?? 0}</strong>
              </div>

              <div>
                <span>Omitidas</span>

                <strong>{job?.totalSkipped ?? 0}</strong>
              </div>

              <div>
                <span>Fallidas</span>

                <strong>{job?.totalFailed ?? 0}</strong>
              </div>
            </div>

            <div className="bulkAssignmentProcessStatus">
              Estado: <strong>{getStatusLabel(job?.status)}</strong>
            </div>

            {job?.message && <p>{job.message}</p>}
          </div>
        )}

        {modalStep === "completed" && (
          <div className="bulkAssignmentResultView">
            <div className="bulkAssignmentResultIcon bulkAssignmentResultIcon--success">
              <CheckCircle2 />
            </div>

            <h3>
              {isPartial
                ? "Asignación completada parcialmente"
                : "Asignación completada"}
            </h3>

            <p>
              Se asignaron {job?.totalAssigned ?? 0} de{" "}
              {job?.totalRequested ?? 0} conversaciones.
            </p>

            <div className="bulkAssignmentProcessStats">
              <div>
                <span>Total</span>

                <strong>{job?.totalRequested ?? 0}</strong>
              </div>

              <div>
                <span>Procesadas</span>

                <strong>{job?.totalProcessed ?? 0}</strong>
              </div>

              <div>
                <span>Asignadas</span>

                <strong>{job?.totalAssigned ?? 0}</strong>
              </div>

              <div>
                <span>Omitidas</span>

                <strong>{job?.totalSkipped ?? 0}</strong>
              </div>

              <div>
                <span>Fallidas</span>

                <strong>{job?.totalFailed ?? 0}</strong>
              </div>
            </div>

            {job?.message && <p>{job.message}</p>}

            <div className="bulkAssignmentResultFooter">
              <button
                type="button"
                className="bulkAssignmentButton bulkAssignmentButton--primary"
                onClick={handleClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {modalStep === "failed" && (
          <div className="bulkAssignmentResultView">
            <div className="bulkAssignmentResultIcon bulkAssignmentResultIcon--error">
              <AlertCircle />
            </div>

            <h3>No se completó la asignación</h3>

            <p>
              {errorMessage || "El proceso finalizó con un error inesperado."}
            </p>

            <div className="bulkAssignmentResultFooter">
              <button
                type="button"
                className="bulkAssignmentButton bulkAssignmentButton--secondary"
                onClick={handleClose}
              >
                Cerrar
              </button>

              <button
                type="button"
                className="bulkAssignmentButton bulkAssignmentButton--primary"
                onClick={handleRetry}
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}