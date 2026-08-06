import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  Loader2,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import useBulkAssignment from "@/Hooks/Chat/useBulkAssignment";
import useAssignableAgents from "@/Hooks/Auth/useAssignableAgents";

import type {
  BulkAssignmentRequest,
  BulkAssignmentFormFilters,
  ModalStep,
} from "@/Interfaces/Chat/BulkAssignmentInterface";

import {
  toUtcIso,
  toNullableNumber,
  toNullableText,
  metaChannels,
} from "@/Utils/Chat/Utils";

import BulkAssignmentResume from "./BulkAssignmentResume";

import "@/Styles/Chat/BulkAssignmentModal.css";

interface BulkAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void | Promise<void>;
}

const initialFilters: BulkAssignmentFormFilters = {
  from: null,
  to: null,
  metaChannelId: null,
  searchConversation: null,
};

export default function BulkAssignmentModal({
  isOpen,
  onClose,
  onCompleted,
}: BulkAssignmentModalProps) {
  const {
    job,

    createAssignment,
    refetchJob,
    reset,

    isSubmitting,
    isPolling,
    isFetchingJob,

    isCompleted,
    isFailed,
    hasPollingError,

    errorMessage,
    progressPercentage,
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
  }, [isCompleted, isFailed, isPolling, isSubmitting, job]);

  /**
   * Agentes realmente disponibles para la asignación,
   * respetando el filtro de conectados.
   */
  const eligibleAgents = useMemo(
    () =>
      agents.filter(
        (agent) => agent.isActive && (!onlyOnline || agent.isOnline),
      ),
    [agents, onlyOnline],
  );

  /**
   * Agentes visibles después de aplicar búsqueda
   * y filtro de conectados.
   */
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

  const noEligibleAgents =
    !isLoadingAgents && !isAgentsError && eligibleAgents.length === 0;

  const canSubmit =
    !isSubmitting &&
    !dateRangeInvalid &&
    !isLoadingAgents &&
    !isAgentsError &&
    (useAllAgents ? eligibleAgents.length > 0 : selectedAgentIds.length > 0);

  const displayedErrorMessage = dateRangeInvalid
    ? "La fecha inicial no puede ser mayor que la fecha final."
    : useAllAgents && noEligibleAgents
      ? onlyOnline
        ? "No hay agentes conectados disponibles."
        : "No hay agentes activos disponibles."
      : errorMessage;

  /**
   * Actualiza la lista de agentes cada vez
   * que se abre el modal.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void refetchAgents();
  }, [isOpen, refetchAgents]);

  /**
   * Refresca la bandeja una sola vez cuando
   * finaliza correctamente el job.
   */
  useEffect(() => {
    if (!isCompleted || completionHandled) {
      return;
    }

    setCompletionHandled(true);

    const complete = async (): Promise<void> => {
      try {
        await onCompleted?.();
      } catch (error) {
        console.error(
          "[BulkAssignmentModal] No se pudo refrescar la bandeja.",
          error,
        );
      }
    };

    void complete();
  }, [completionHandled, isCompleted, onCompleted]);

  /**
   * Limpia únicamente el estado del formulario.
   *
   * El JobKey activo continúa persistido desde
   * useBulkAssignment y podrá recuperarse cuando
   * el modal vuelva a abrirse.
   */
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
  }, [isOpen, reset, setOnlyOnline, setSearch]);

  /**
   * Elimina selecciones que ya no son válidas
   * al cambiar disponibilidad o conexión.
   */
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
  }, [agents, onlyOnline, selectedAgentIds.length, useAllAgents]);

  if (!isOpen) {
    return null;
  }

  const updateFilter = <K extends keyof BulkAssignmentFormFilters>(
    field: K,
    value: BulkAssignmentFormFilters[K],
  ): void => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  };

  const handleUseAllAgentsChange = (checked: boolean): void => {
    setUseAllAgents(checked);

    if (checked) {
      setSelectedAgentIds([]);
      setSearch("");
    }
  };

  const handleOnlyOnlineChange = (checked: boolean): void => {
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

  const toggleAgent = (agentId: number): void => {
    if (useAllAgents) {
      return;
    }

    setSelectedAgentIds((currentIds) =>
      currentIds.includes(agentId)
        ? currentIds.filter((currentId) => currentId !== agentId)
        : [...currentIds, agentId],
    );
  };

  const toggleAllVisibleAgents = (): void => {
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

  /**
   * Se permite cerrar mientras el backend procesa.
   *
   * Solo se bloquea durante la creación inicial,
   * porque todavía no se ha recibido el JobKey.
   */
  const handleClose = (): void => {
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  /**
   * Reinicia después de un fallo terminal del job.
   */
  const handleRetry = (): void => {
    reset();
    setCompletionHandled(false);
  };

  /**
   * Reintenta únicamente la consulta del job.
   *
   * No elimina el JobKey ni reinicia el proceso.
   */
  const handlePollingRetry = async (): Promise<void> => {
    try {
      await refetchJob();
    } catch {
      // El hook expone el mensaje correspondiente.
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
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
      // El hook controla el mensaje y el toast.
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
              Asigna conversaciones pendientes entre agentes activos.
            </p>
          </div>

          <button
            type="button"
            className="bulkAssignmentModal-closeButton"
            onClick={handleClose}
            disabled={isSubmitting}
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
                        ? `Se utilizarán ${eligibleAgents.length} agentes disponibles.`
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

                  {isFetchingAgents && !isLoadingAgents && (
                    <Loader2
                      className="bulkAssignmentSpin"
                      aria-label="Actualizando agentes"
                    />
                  )}

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

                {isLoadingAgents ? (
                  <div className="bulkAssignmentEmptyState">
                    <Loader2 className="bulkAssignmentSpin" />

                    <span>Cargando agentes...</span>
                  </div>
                ) : isAgentsError ? (
                  <div className="bulkAssignmentErrorState" role="alert">
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
                          className={[
                            "bulkAssignmentAgent",
                            isSelected ? "bulkAssignmentAgent--selected" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
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
                              className={[
                                "bulkAssignmentAgent-status",
                                agent.isOnline
                                  ? "bulkAssignmentAgent-status--online"
                                  : "bulkAssignmentAgent-status--offline",
                              ].join(" ")}
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
                        Las conversaciones se distribuirán entre los agentes
                        disponibles, priorizando la carga configurada por el
                        backend.
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
                        {useAllAgents
                          ? eligibleAgents.length
                          : selectedAgentIds.length}
                      </strong>
                    </div>

                    <div className="bulkAssignmentSummary-item">
                      <span>Distribución</span>

                      <strong>Automática</strong>
                    </div>

                    <div className="bulkAssignmentSummary-item">
                      <span>Disponibilidad</span>

                      <strong>
                        {onlyOnline ? "Solo conectados" : "Activos"}
                      </strong>
                    </div>

                    <div className="bulkAssignmentSummary-item">
                      <span>Canal</span>

                      <strong>
                        {metaChannels.find(
                          (channel) => channel.id === filters.metaChannelId,
                        )?.name ?? "Todos"}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              {displayedErrorMessage && (
                <div className="bulkAssignmentErrorState" role="alert">
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
                disabled={isSubmitting}
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

        <BulkAssignmentResume
          modalStep={modalStep}
          progressPercentage={progressPercentage}
          job={job}
          errorMessage={errorMessage}
          hasPollingError={hasPollingError}
          isRetryingPolling={isFetchingJob}
          handleClose={handleClose}
          handleRetry={handleRetry}
          handlePollingRetry={handlePollingRetry}
        />
      </div>
    </div>
  );
}