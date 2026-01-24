import React, { useState, useEffect, useMemo, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import {
  getConversation,
  closeConversation,
  SetHaltedConversation
} from "@/Services/chat/ConversationService";
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";
import { openAssignModal } from "@/Context/Slices/Chat/assignModalSlice";
import { useSystemParams } from "@/Hooks/Crm/useSystemParams";
import type { AuthStorage, JwtPayload } from "@/Interfaces/Auth/AuthInterface";
type FilterOption = { label: string; value: string; content: string };

const FILTER_ORDER_STORAGE_KEY = "filterOrder";

export function useSupportPage() {
  const dispatch = useDispatch();
  const [convId, setConvId] = useState<number | null>(null);
  const [conversation, setConversation] = useState<ConversationDto | null>(
    null
  );

  const [isToggling, setIsToggling] = useState(false);

  const [filter, setFilter] = useState<string>(
    () => localStorage.getItem("selectedFilter") || "all"
  );

  const [selectedFilter, setSelectedFilter] = useState<string>(
    () => localStorage.getItem("selectedFilter") || "all"
  );
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [contactDetailToggle, setContactDetailToggle] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const { selectedParam, fetchByName } = useSystemParams();

  const authRaw = localStorage.getItem("auth") || "{}";
  const { accessToken, userId } = JSON.parse(authRaw) as AuthStorage;
  const { role } = jwtDecode<JwtPayload>(accessToken);
  const isAdmin = role.toLowerCase() === "admin" ||  role.toLowerCase() === "root";
  let DEFAULT_OPTIONS: FilterOption[];

  const [detailToggle, setDetailToggle] = useState<boolean>(false);

  if (isAdmin) {
    DEFAULT_OPTIONS = [
      { label: "Todos", value: "all", content: "Todos" },
      { label: "Bot", value: "bot", content: "Bot" },
      { label: "Pendiente", value: "waiting", content: "Pendiente" },
      { label: "Humano", value: "human", content: "Asignado" },
      { label: "Cerrado", value: "closed", content: "Cerrado" },
      { label: "Incompleto", value: "incomplete", content: "Incompleto" },
      { label: "Pausado", value: "paused", content: "Pausado" },
    ];
  } else {
    DEFAULT_OPTIONS = [
      { label: "Todos", value: "all", content: "Todos" },
      { label: "Humano", value: "human", content: "Humano" },
      { label: "Cerrado", value: "closed", content: "Cerrado" },
      { label: "Incompleto", value: "incomplete", content: "Incompleto" },
      { label: "Pausado", value: "paused", content: "Pausado" },
    ];
  }

  // Cargar orden de filtros desde localStorage o usar el predeterminado
  const [filterOrder, setFilterOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem(FILTER_ORDER_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_OPTIONS.map((o) => o.value);
  });

  useEffect(() => {
    setFilter(selectedFilter);
  }, [selectedFilter]);

  const sortedOptions = useMemo(() => {
    return filterOrder
      .map((val) => DEFAULT_OPTIONS.find((o) => o.value === val))
      .filter((o): o is FilterOption => !!o);
  }, [DEFAULT_OPTIONS, filterOrder]);

    useEffect(() => {
    if (!convId) {
      setConversation(null)
      return
    }

      setConversation(null)

      getConversation(convId)
        .then(res => setConversation(res.data.data))
        .catch(console.error)

      fetchByName('OpcionesRapidas')
    }, [convId, fetchByName])
  
  const handleAfterAssign = () => {
    if (!convId) return;
    getConversation(convId)
      .then((res) => setConversation(res.data.data))
      .catch(console.error);
  };

  const handleAssignClick = () => {
    if (!convId || !conversation) return;
    if (isAdmin) {
      dispatch(openAssignModal(conversation));
    } else {
      closeConversation(convId).then(handleAfterAssign).catch(console.error);
    }
  };

  
  const handleSetHaltedConversation = useCallback(async () => {
    if (!convId || !conversation || !isAdmin) return
    try {
      await SetHaltedConversation(convId)
      setConversation(prev =>
        prev ? { ...prev, isHalted: !prev.isHalted } : prev
      )
    } catch (e) {
      console.error(e)
    }
  }, [convId, conversation, isAdmin])

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilter(val);
    setSelectedFilter(val);
    localStorage.setItem("selectedFilter", val);
  };

  //Funcion separar los primeros 3 numeros 505 del resto del numero.
  function extraerNumero(cadena: string): string {

    return cadena.slice(0, 3) + "-" + cadena.slice(3);
  }
  const saveOrder = (newOrder: string[]) => {
    setFilterOrder(newOrder);
    localStorage.setItem(FILTER_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
  };

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
    handleSetHaltedConversation
  };
}