import {
  getHistoryByContact as getConversationHistory,
  summarizeAllByContact as generateConversationSummary,
} from "@/Services/ConversationService";
import type {
  ConversationHistoryDto,
  MessageWithAttachmentsDto,
} from "@/Interfaces/Chat/ChatInterfaces";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  // useMemo,
} from "react";

export function useConversationHistoryModal(
  isOpen: boolean,
  conversationId: number | null
) {
  const [conversations, setConversations] = useState<ConversationHistoryDto[]>(
    []
  );

  const [allMessages, setAllMessages] = useState<MessageWithAttachmentsDto[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();

  const fetchHistory = async () =>{
    if (!conversationId) return;

    setLoading(true);
    try {

      const response = await getConversationHistory(conversationId, startDate as unknown as Date, endDate as unknown as Date);
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
  }
  
  const generateSummary = useCallback(async () => {
    if (!conversationId) return;

    setLoadingSummary(true);
    try {
      const response = await generateConversationSummary(conversationId);
      setSummary(response.data.data);
      setShowSummary(true);
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setLoadingSummary(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();

    } else {
      setConversations([]);
      setAllMessages([]);
      setSearchTerm("");
      setCurrentMatch(0);
      setTotalMatches(0);
      setSummary(null);
      setShowSummary(false);
      // Reiniciar fechas opcional; si quieres que permanezcan, coméntalo:
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, startDate, endDate]);
  

  // const filteredMessages = useMemo(() => {
  //   if (!allMessages.length) return [];

  //   const start = new Date(startDate);
  //   const end = new Date(endDate);
  //   end.setHours(23, 59, 59, 999);

  //   return allMessages.filter((message) => {
  //     const msgDate = new Date(message.sentAt);
  //     return msgDate >= start && msgDate <= end;
  //   });
  // }, [allMessages, startDate, endDate]);

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const regex = new RegExp(`(${term})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={idx} className="search-highlight">
          {part}
        </mark>
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
    allMessages.forEach((message, index) => {
      if (message.content?.toLowerCase().includes(searchTerm.toLowerCase())) {
        matches.push(index);
      }
    });

    setTotalMatches(matches.length);
    setCurrentMatch(matches.length > 0 ? 0 : -1);

    if (matches.length > 0) {
      const firstMatchIndex = matches[0];
      const element = messageRefs.current[firstMatchIndex];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [searchTerm]);

  useEffect(() => {
    searchMessages();
  }, [searchMessages]);

  const goToNextMatch = () => {
    if (!allMessages.length || totalMatches === 0) return;

    const matches: number[] = [];
      allMessages.forEach((message, index) => {
      if (message.content?.toLowerCase().includes(searchTerm.toLowerCase())) {
        matches.push(index);
      }
    });

    const next = (currentMatch + 1) % totalMatches;
    setCurrentMatch(next);
    const element = messageRefs.current[matches[next]];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const goToPreviousMatch = () => {
    if (!allMessages.length || totalMatches === 0) return;

    const matches: number[] = [];
    allMessages.forEach((message, index) => {
      if (message.content?.toLowerCase().includes(searchTerm.toLowerCase())) {
        matches.push(index);
      }
    });

    const prev = currentMatch === 0 ? totalMatches - 1 : currentMatch - 1;
    setCurrentMatch(prev);
    const element = messageRefs.current[matches[prev]];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        goToPreviousMatch();
      } else {
        goToNextMatch();
      }
    }
  };

  return {
    generateSummary,
    setEndDate,
    goToNextMatch,
    setStartDate,
    goToPreviousMatch,
    handleKeyDown,
    setSearchTerm,
    highlightText,
    setShowSummary,
    summary,
    showSummary,
    loadingSummary,
    endDate,
    startDate,
    currentMatch,
    totalMatches,
    searchTerm,
    // filteredMessages,
    loading,
    conversations,
    allMessages,
    messageRefs,
  };
}