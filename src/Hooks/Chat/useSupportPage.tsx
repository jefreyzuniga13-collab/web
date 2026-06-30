import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  closeConversation,
  getConversation,
  SetHaltedConversation,
} from "@/Services/chat/ConversationService";

import type {
  ConversationDto,
  AgentDto,
} from "@/Interfaces/Chat/ChatInterfaces";

import { openAssignModal } from "@/Context/Slices/Chat/assignModalSlice";
import { useSystemParams } from "@/Hooks/Crm/useSystemParams";

import {
  selectIsAdmin,
  selectUserId,
  selectIsRoot,
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

const getStoredFilterOrder = (defaultOptions: FilterOption[]): string[] => {
  const stored = localStorage.getItem(FILTER_ORDER_STORAGE_KEY);

  if (!stored) {
    return defaultOptions.map((option) => option.value);
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return defaultOptions.map((option) => option.value);
    }

    return parsed.filter((value): value is string => typeof value === "string");
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
  const [conversation, setConversation] = useState<ConversationDto | null>(null);

  const [isToggling, setIsToggling] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [contactDetailToggle, setContactDetailToggle] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [detailToggle, setDetailToggle] = useState(false);

  const [companySystemParam, setCompanySystemParam] =
    useState<CompanySystemParamsInterface | null>(null);

  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const DEFAULT_OPTIONS = useMemo<FilterOption[]>(() => {
    return isAdmin || isRoot ? ADMIN_FILTER_OPTIONS : AGENT_FILTER_OPTIONS;
  }, [isAdmin, isRoot]);

  const [filter, setFilter] = useState<string>(
    () => localStorage.getItem("selectedFilter") || "all"
  );

  const [selectedFilter, setSelectedFilter] = useState<string>(
    () => localStorage.getItem("selectedFilter") || "all"
  );

  const [filterOrder, setFilterOrder] = useState<string[]>(() =>
    getStoredFilterOrder(DEFAULT_OPTIONS)
  );

  const agentOptions = useMemo<AgentOption[]>(() => {
    return agents
      .map((agent) => ({
        label: agent.fullName,
        value: String(agent.userId),
      }))
      .filter((agent) => Number(agent.value) > 0);
  }, [agents]);

  const sortedOptions = useMemo(() => {
    const availableValues = new Set(DEFAULT_OPTIONS.map((option) => option.value));

    const orderedOptions = filterOrder
      .filter((value) => availableValues.has(value))
      .map((value) => DEFAULT_OPTIONS.find((option) => option.value === value))
      .filter((option): option is FilterOption => option !== null && option !== undefined);

    const missingOptions = DEFAULT_OPTIONS.filter(
      (option) => !filterOrder.includes(option.value)
    );

    return [...orderedOptions, ...missingOptions];
  }, [DEFAULT_OPTIONS, filterOrder]);

  const canAssign = isAdmin || isRoot || companySystemParam?.isActive === true;
  const label = canAssign 
  ? (conversation?.assignedAgentId ? "Reasignar" : "Asignar") 
  : "Cerrar";

  useEffect(() => {
    setFilter(selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    if (!convId) {
      setConversation(null);
      return;
    }

    setConversation(null);

    getConversation(convId)
      .then((res) => setConversation(res.data.data))
      .catch(console.error);

    fetchByName("OpcionesRapidas");
  }, [convId, fetchByName]);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await CompanySystemParamsService.getByIdAsync(
          SystemParamType.AsignarConversacionesEntreAgentes
        );

        setCompanySystemParam(res);
      } catch (error) {
        console.error("Error al obtener la política:", error);
      }
    };

    fetchPolicy();
  }, []);

  useEffect(() => {
    if (!isAdmin && !isRoot) {
      setAgents([]);
      return;
    }

    const fetchAgents = async () => {
      try {
        setLoadingAgents(true);

        const data = await AgentService.getAgentsAsync();

        setAgents(data);
      } catch (error) {
        console.error("Error al cargar agentes:", error);
        setAgents([]);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [isAdmin, isRoot]);

  const handleAssignClick = useCallback(() => {
    if (!convId || !conversation) return;

    dispatch(openAssignModal(conversation));
  }, [convId, conversation, dispatch]);

  const handleAfterActionRefresh = useCallback(() => {
    if (!convId) return;

    getConversation(convId)
      .then((res) => setConversation(res.data.data))
      .catch(() => {});
  }, [convId]);

  const handleCloseClick = useCallback(() => {
    if (!convId || !conversation) return;

    closeConversation(convId)
      .then(handleAfterActionRefresh)
      .catch(() => {});
  }, [convId, conversation, handleAfterActionRefresh]);

  const handleSetHaltedConversation = useCallback(async () => {
    if (!convId || !conversation || !isAdmin) return;

    try {
      await SetHaltedConversation(convId);

      setConversation((prev) =>
        prev ? { ...prev, isHalted: !prev.isHalted } : prev
      );
    } catch (error) {
      console.error(error);
    }
  }, [convId, conversation, isAdmin]);

  const handleOptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      setFilter(value);
      setSelectedFilter(value);
      localStorage.setItem("selectedFilter", value);
    },
    []
  );

  const extraerNumero = useCallback((cadena: string): string => {
    // Separa el prefijo 505 del resto del número.
    if (cadena.length <= 3) return cadena;

    return `${cadena.slice(0, 3)}-${cadena.slice(3)}`;
  }, []);

  const saveOrder = useCallback((newOrder: string[]) => {
    // Persiste el orden de filtros.
    setFilterOrder(newOrder);
    localStorage.setItem(FILTER_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
  }, []);

  return {
    conversation,
    setOrderModalVisible,
    saveOrder,
    filterOrder,
    DEFAULT_OPTIONS,
    orderModalVisible,
    setShowHistoryModal,
    showHistoryModal,
    setContactDetailToggle,
    contactDetailToggle,
    detailToggle,
    setDetailToggle,
    convId,
    isAdmin,
    isRoot,
    handleAssignClick,
    sortedOptions,
    handleOptionChange,
    setConvId,
    filter,
    userId,
    extraerNumero,
    selectedParam,
    isToggling,
    setIsToggling,
    handleSetHaltedConversation,
    label,
    canAssign,
    handleCloseClick,
    showCompanyModal,
    setShowCompanyModal,

    agents,
    agentOptions,
    loadingAgents,
  };
}