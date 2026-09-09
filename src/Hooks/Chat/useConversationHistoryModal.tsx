import {
  getHistoryByContact as getConversationHistory,
} from "@/Services/chat/ConversationService";
import type { ConversationHistoryDto, MessageWithAttachmentsDto } from "@/Interfaces/Chat/ChatInterfaces";
import React, { useState, useEffect, useCallback, useRef } from "react";

function toDateInputValue(dateLike: string | Date) {
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useConversationHistoryModal(
  isOpen: boolean,
  conversationId: number | null,
  conversationStart: string | null
) {
  const [conversations, setConversations] = useState<ConversationHistoryDto[]>([]);
  const [allMessages, setAllMessages] = useState<MessageWithAttachmentsDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // inputs type="date" deben recibir YYYY-MM-DD
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Para inicializar solo una vez al abrir
  const initializedRef = useRef(false);

  // Inicializa fechas al abrir el modal (una sola vez por apertura)
  useEffect(() => {
    if (!isOpen) {
      // reset al cerrar
      setConversations([]);
      setAllMessages([]);
      setSearchTerm("");
      setCurrentMatch(0);
      setTotalMatches(0);
      setStartDate("");
      setEndDate("");
      initializedRef.current = false;
      return;
    }

    if (isOpen && !initializedRef.current) {
      const base = conversationStart
        ? toDateInputValue(conversationStart)
        : toDateInputValue(new Date());
      setStartDate(base);
      setEndDate(base);
      initializedRef.current = true;
    }
  }, [isOpen, conversationStart]);

  const fetchHistory = async () => {
    if (!conversationId) return;

    // Si aún no hay fechas (primer render), no llames
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      // Si tu API espera Date, conviértelas; si espera string yyyy-MM-dd, mándalas así.
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T23:59:59");

      const response = await getConversationHistory(conversationId, start, end);
      const result = response.data?.data;

      if (Array.isArray(result)) {
        setConversations(result);
        const messages = result.flatMap((conv) => conv.messages);
        messages.sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
        setAllMessages(messages);
      }
    } catch (error) {
      console.error("Error fetching conversation history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Vuelve a pedir cuando cambian fechas o se abre
  useEffect(() => {
    if (isOpen) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, startDate, endDate, conversationId]);

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={idx} className="search-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  const searchMessages = useCallback(() => {
    if (!allMessages.length || !searchTerm.trim()) {
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }
    const matches: number[] = [];
    allMessages.forEach((m, i) => {
      if (m.content?.toLowerCase().includes(searchTerm.toLowerCase())) matches.push(i);
    });
    setTotalMatches(matches.length);
    setCurrentMatch(matches.length > 0 ? 0 : -1);
    if (matches.length > 0) {
      messageRefs.current[matches[0]]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [allMessages, searchTerm]);

  useEffect(() => { searchMessages(); }, [searchMessages]);

  const goToNextMatch = () => {
    if (!allMessages.length || totalMatches === 0) return;
    const matches: number[] = [];
    allMessages.forEach((m, i) => {
      if (m.content?.toLowerCase().includes(searchTerm.toLowerCase())) matches.push(i);
    });
    const next = (currentMatch + 1) % totalMatches;
    setCurrentMatch(next);
    messageRefs.current[matches[next]]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const goToPreviousMatch = () => {
    if (!allMessages.length || totalMatches === 0) return;
    const matches: number[] = [];
    allMessages.forEach((m, i) => {
      if (m.content?.toLowerCase().includes(searchTerm.toLowerCase())) matches.push(i);
    });
    const prev = currentMatch === 0 ? totalMatches - 1 : currentMatch - 1;
    setCurrentMatch(prev);
    messageRefs.current[matches[prev]]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    if (e.key === "Enter") e.shiftKey ? goToPreviousMatch() : goToNextMatch();
  };

  return {
    setEndDate,
    goToNextMatch,
    setStartDate,
    goToPreviousMatch,
    handleKeyDown,
    setSearchTerm,
    highlightText,
    endDate,
    startDate,
    currentMatch,
    totalMatches,
    searchTerm,
    loading,
    conversations,
    allMessages,
    messageRefs,
  };
}