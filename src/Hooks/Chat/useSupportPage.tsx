import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  closeConversation,
  getConversation,
  SetHaltedConversation,
} from "@/Services/chat/ConversationService";

import type {
  AgentDto,
  ConversationDto,
} from "@/Interfaces/Chat/ChatInterfaces";

import { openAssignModal } from "@/Context/Slices/Chat/assignModalSlice";
import { useSystemParams } from "@/Hooks/Crm/useSystemParams";

import {
  selectIsAdmin,
  selectIsRoot,
  selectUserId,
} from "@/Context/Slices/Auth/authSlice";

import { CompanySystemParamsService } from "@/Services/Crm/CompanySystemParamsService";
import { AgentService } from "@/Services/auth/AgentService";

import { SystemParamType } from "@/Utils/systemParam";

import type { CompanySystemParamsInterface } from "@/Interfaces/Crm/CompanySystemParams";

type FilterOption = {
  label: string;
  value: string;
  content: string;
};

type AgentOption = {
  label: string;
  value: string;
};

const FILTER_ORDER_STORAGE_KEY = "filterOrder";
const SELECTED_FILTER_STORAGE_KEY = "selectedFilter";

const ADMIN_FILTER_OPTIONS: FilterOption[] = [
  { label: "Todos", value: "all", content: "Todos" },
  { label: "Bot", value: "bot", content: "Bot" },
  { label: "Pendiente", value: "waiting", content: "Pendiente" },
  { label: "Humano", value: "human", content: "Asignado" },
  { label: "Cerrado", value: "closed", content: "Cerrado" },
  { label: "Incompleto", value: "incomplete", content: "Incompleto" },
  { label: "Pausado", value: "paused", content: "Pausado" },
];

const AGENT_FILTER_OPTIONS: FilterOption[] = [
  { label: "Todos", value: "all", content: "Todos" },
  { label: "Humano", value: "human", content: "Humano" },
  { label: "Cerrado", value: "closed", content: "Cerrado" },
  { label: "Incompleto", value: "incomplete", content: "Incompleto" },
  { label: "Pausado", value: "paused", content: "Pausado" },
];

/**
 * Obtiene el orden de filtros almacenado.
 *
 * Si el valor no existe o está dañado,
 * devuelve el orden predeterminado.
 */
const getStoredFilterOrder = (
  defaultOptions: FilterOption[]
): string[] => {
  const stored = localStorage.getItem(FILTER_ORDER_STORAGE_KEY);

  if (!stored) {
    return defaultOptions.map((option) => option.value);
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return defaultOptions.map((option) => option.value);
    }

    return parsed.filter(
      (value): value is string => typeof value === "string"
    );
  } catch {
    return defaultOptions.map((option) => option.value);
  }
};

export function useSupportPage() {
  const dispatch = useDispatch();

  const isAdmin = useSelector(selectIsAdmin);
  const isRoot = useSelector(selectIsRoot);
  const userId = useSelector(selectUserId);

  const { selectedParam, fetchByName } = useSystemParams();

  const [convId, setConvId] = useState<number | null>(null);

  const [conversation, setConversation] =
    useState<ConversationDto | null>(null);

  /**
   * Controla el loading visual del cierre.
   */
  const [isClosing, setIsClosing] = useState(false);

  /**
   * Evita que dos clics rápidos ejecuten
   * dos llamadas para cerrar la conversación.
   */
  const closingRef = useRef(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [contactDetailToggle, setContactDetailToggle] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [detailToggle, setDetailToggle] = useState(false);

  const [companySystemParam, setCompanySystemParam] =
    useState<CompanySystemParamsInterface | null>(null);

  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  /**
   * Los administradores y Root pueden ver
   * todos los filtros.
   */
  const DEFAULT_OPTIONS = useMemo<FilterOption[]>(() => {
    return isAdmin || isRoot
      ? ADMIN_FILTER_OPTIONS
      : AGENT_FILTER_OPTIONS;
  }, [isAdmin, isRoot]);

  const [filter, setFilter] = useState<string>(() => {
    return (
      localStorage.getItem(SELECTED_FILTER_STORAGE_KEY) ||
      "all"
    );
  });

  const [selectedFilter, setSelectedFilter] =
    useState<string>(() => {
      return (
        localStorage.getItem(SELECTED_FILTER_STORAGE_KEY) ||
        "all"
      );
    });

  const [filterOrder, setFilterOrder] = useState<string[]>(() =>
    getStoredFilterOrder(DEFAULT_OPTIONS)
  );

  /**
   * Opciones de agentes utilizadas por
   * el filtro administrativo.
   */
  const agentOptions = useMemo<AgentOption[]>(() => {
    return agents
      .map((agent) => ({
        label: agent.fullName,
        value: String(agent.userId),
      }))
      .filter((agent) => Number(agent.value) > 0);
  }, [agents]);

  /**
   * Ordena los filtros según el orden
   * almacenado en localStorage.
   */
  const sortedOptions = useMemo<FilterOption[]>(() => {
    const availableValues = new Set(
      DEFAULT_OPTIONS.map((option) => option.value)
    );

    const orderedOptions = filterOrder
      .filter((value) => availableValues.has(value))
      .map((value) =>
        DEFAULT_OPTIONS.find(
          (option) => option.value === value
        )
      )
      .filter(
        (option): option is FilterOption =>
          option !== undefined && option !== null
      );

    const missingOptions = DEFAULT_OPTIONS.filter(
      (option) => !filterOrder.includes(option.value)
    );

    return [...orderedOptions, ...missingOptions];
  }, [DEFAULT_OPTIONS, filterOrder]);

  /**
   * Root y Admin siempre pueden asignar.
   *
   * Los agentes normales dependen
   * del parámetro empresarial.
   */
  const canAssign =
    isAdmin ||
    isRoot ||
    companySystemParam?.isActive === true;

  /**
   * Texto del botón principal.
   *
   * La carga de asignación se controla
   * dentro de useAssignModal.
   */
  const label = canAssign
    ? conversation?.assignedAgentId
      ? "Reasignar"
      : "Asignar"
    : "Cerrar";

  /**
   * Sincroniza el filtro seleccionado
   * con el filtro aplicado.
   */
  useEffect(() => {
    setFilter(selectedFilter);
  }, [selectedFilter]);

  /**
   * Carga las opciones rápidas.
   */
  useEffect(() => {
    void fetchByName("OpcionesRapidas");
  }, [fetchByName]);

  /**
   * Conserva en el hook la conversación que ya fue obtenida
   * por la lista paginada.
   *
   * Esto evita ejecutar GET /Conversations/{id}
   * cada vez que el usuario selecciona un chat.
   */
  const setConversationSnapshot = useCallback(
    (value: ConversationDto | null): void => {
      setConversation(value);
    },
    []
  );

  /**
   * Al limpiar la selección también se descarta
   * la instantánea de la conversación anterior.
   */
  useEffect(() => {
    if (!convId) {
      setConversation(null);
    }
  }, [convId]);

  /**
   * Obtiene la política empresarial
   * para asignar entre agentes.
   */
  useEffect(() => {
    let cancelled = false;

    const fetchPolicy = async (): Promise<void> => {
      try {
        const response =
          await CompanySystemParamsService.getByIdAsync(
            SystemParamType.AsignarConversacionesEntreAgentes
          );

        if (cancelled) return;

        setCompanySystemParam(response);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Error al obtener la política de asignación:",
          error
        );

        setCompanySystemParam(null);
      }
    };

    void fetchPolicy();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Carga los agentes utilizados en
   * los filtros de Admin y Root.
   */
  useEffect(() => {
    if (!isAdmin && !isRoot) {
      setAgents([]);
      setLoadingAgents(false);
      return;
    }

    let cancelled = false;

    const fetchAgents = async (): Promise<void> => {
      try {
        setLoadingAgents(true);

        const data = await AgentService.getAgentsAsync();

        if (cancelled) return;

        setAgents(data ?? []);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Error al cargar agentes:",
          error
        );

        setAgents([]);
      } finally {
        if (!cancelled) {
          setLoadingAgents(false);
        }
      }
    };

    void fetchAgents();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isRoot]);

  /**
   * Abre el modal de asignación.
   *
   * No activa loading porque todavía
   * no se ejecuta la llamada a la API.
   */
  const handleAssignClick = useCallback((): void => {
    if (!convId || !conversation) return;

    dispatch(openAssignModal(conversation));
  }, [convId, conversation, dispatch]);

  /**
   * Vuelve a consultar la conversación
   * después de ejecutar una acción.
   */
  const handleAfterActionRefresh =
    useCallback(async (): Promise<void> => {
      if (!convId) return;

      try {
        const response = await getConversation(convId);

        setConversation(response.data.data ?? null);
      } catch (error) {
        console.error(
          "Error al actualizar la conversación:",
          error
        );
      }
    }, [convId]);

  /**
   * Cierra la conversación.
   *
   * isClosing controla la interfaz.
   * closingRef evita dobles solicitudes.
   */
  const handleCloseClick =
    useCallback(async (): Promise<void> => {
      if (!convId || !conversation) return;

      if (closingRef.current || isClosing) {
        return;
      }

      closingRef.current = true;
      setIsClosing(true);

      try {
        await closeConversation(convId);
        await handleAfterActionRefresh();
      } catch (error) {
        console.error(
          "Error al cerrar la conversación:",
          error
        );
      } finally {
        closingRef.current = false;
        setIsClosing(false);
      }
    }, [
      convId,
      conversation,
      isClosing,
      handleAfterActionRefresh,
    ]);

  /**
   * Pausa o reactiva una conversación.
   *
   * Solo está permitido actualmente
   * para administradores.
   */
  const handleSetHaltedConversation =
    useCallback(async (): Promise<void> => {
      if (!convId || !conversation || !isAdmin) {
        return;
      }

      try {
        await SetHaltedConversation(convId);

        setConversation((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            isHalted: !previous.isHalted,
          };
        });
      } catch (error) {
        console.error(
          "Error al pausar o reactivar la conversación:",
          error
        );
      }
    }, [convId, conversation, isAdmin]);

  /**
   * Cambia el filtro y lo almacena.
   */
  const handleOptionChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>
    ): void => {
      const value = event.target.value;

      setFilter(value);
      setSelectedFilter(value);

      localStorage.setItem(
        SELECTED_FILTER_STORAGE_KEY,
        value
      );
    },
    []
  );

  /**
   * Separa el prefijo telefónico 505
   * del resto del número.
   */
  const extraerNumero = useCallback(
    (cadena: string): string => {
      if (cadena.length <= 3) {
        return cadena;
      }

      return `${cadena.slice(0, 3)}-${cadena.slice(3)}`;
    },
    []
  );

  /**
   * Persiste el orden personalizado
   * de los filtros.
   */
  const saveOrder = useCallback(
    (newOrder: string[]): void => {
      setFilterOrder(newOrder);

      localStorage.setItem(
        FILTER_ORDER_STORAGE_KEY,
        JSON.stringify(newOrder)
      );
    },
    []
  );

  return {
    conversation,
    setConversationSnapshot,

    setOrderModalVisible,
    orderModalVisible,

    saveOrder,
    filterOrder,
    DEFAULT_OPTIONS,
    sortedOptions,

    setShowHistoryModal,
    showHistoryModal,

    setContactDetailToggle,
    contactDetailToggle,

    detailToggle,
    setDetailToggle,

    convId,
    setConvId,

    isAdmin,
    isRoot,
    userId,

    handleAssignClick,
    handleCloseClick,
    handleSetHaltedConversation,

    handleOptionChange,

    filter,
    selectedParam,

    extraerNumero,

    label,
    canAssign,

    showCompanyModal,
    setShowCompanyModal,

    agents,
    agentOptions,
    loadingAgents,

    /**
     * Usado por SupportPage para mostrar
     * el ícono y texto "Cerrando...".
     */
    isClosing,
  };
}