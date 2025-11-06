import {
  getHistoryByContact as getConversationHistory,
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
} from "react";
import { toast } from "react-toastify";


function toDateInputValue(dateString: string) {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  
  return `${month}-${day}-${year}`;
}

export function useConversationHistoryModal(
  isOpen: boolean,
  conversationId: number | null,
  conversationStart: string | null
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
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
 
  //Aun los input no se incializan al montar con ese valor!!!, recibo un string
  const [startDate, setStartDate] = useState<string>(conversationStart ?? "");
  const [endDate, setEndDate] = useState<string>();

  useEffect(() => {
  if (conversationStart && startDate == null && endDate == null) {
    toast.success("Formato devuelto");
    const formatted = toDateInputValue(conversationStart);
    setStartDate(formatted);
    setEndDate(formatted);
  }

}, [conversationStart, endDate, startDate]);

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
  
  useEffect(() => {
    if (isOpen) {
      fetchHistory();

    } else {
      setConversations([]);
      setAllMessages([]);
      setSearchTerm("");
      setCurrentMatch(0);
      setTotalMatches(0);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, startDate, endDate]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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